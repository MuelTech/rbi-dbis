import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { prisma } from "@rbi/db";
import { logAction } from "../services/auditService.js";
import {
  buildBackup,
  applyBackup,
  validateBackup,
} from "../services/backupService.js";
import { buildEncryptedBackup, openEncryptedBackup } from "../services/backupEnvelope.js";
import {
  getKeyring,
  getOrCreateKeyring,
  serverKekOf,
  recoveryKekOf,
  regenerateRecoveryKey,
} from "../services/backupKeyring.js";
import {
  deriveRecoveryKek,
  parseRecoveryKey,
  formatRecoveryKey,
} from "../services/backupCrypto.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "8h") as StringValue;

const DEFAULT_SETTINGS = {
  slogan: "Serbisyong Tapat, Para sa Lahat",
  barangayName: "Barangay 418",
  municipality: "Manila City",
  province: "Metro Manila",
  telephone: "8921-1234",
  punongBarangay: "Juan Dela Cruz",
  councilor1: "Pedro Penduko",
  councilor2: "Maria Makiling",
  councilor3: "Jose Rizal",
  councilor4: "Andres Bonifacio",
  councilor5: "Emilio Aguinaldo",
  councilor6: "Gabriela Silang",
  councilor7: "Melchora Aquino",
  skChairman: "Kabataan Pagasa",
  treasurer: "Yaman Bayan",
  secretary: "Sulat Kamay",
  clearanceFee: "200",
  residencyFee: "150",
  businessFee: "500",
  ownershipFee: "300",
  purposes: [
    "Employment application",
    "School enrollment",
    "Legal documents",
    "Job application",
    "Scholarship application",
    "Housing program applications",
    "Business permit requirements",
  ],
};

export async function getSettings(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let setting = await prisma.barangaySetting.findFirst();
    if (!setting) {
      setting = await prisma.barangaySetting.create({
        data: { data: DEFAULT_SETTINGS },
      });
    }
    res.json(setting.data);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    let setting = await prisma.barangaySetting.findFirst();
    if (setting) {
      await prisma.barangaySetting.update({
        where: { id: setting.id },
        data: { data: req.body },
      });
    } else {
      await prisma.barangaySetting.create({
        data: { data: req.body },
      });
    }

    if (userId) {
      await logAction("settings", "1", userId, "UPDATE", null, "Updated barangay settings");
    }

    res.json(req.body);
  } catch (err) {
    next(err);
  }
}

export async function verifyBackupPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    const { password } = req.body ?? {};

    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    const unlockToken = jwt.sign(
      { sub: user.id, scope: "backup-restore" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ unlockToken });
  } catch (err) {
    next(err);
  }
}

function sendSSE(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  // flush to ensure event is sent immediately
  if (typeof (res as any).flush === "function") {
    (res as any).flush();
  }
}

function startSSE(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

export async function backupData(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    startSSE(res);

    const plain = await buildBackup((progress) =>
      sendSSE(res, "progress", progress)
    );

    const { keyring, createdRecoveryKey } = await getOrCreateKeyring();
    const envelope = buildEncryptedBackup({ data: plain.data }, plain.meta, {
      serverKek: serverKekOf(keyring),
      recoveryKek: recoveryKekOf(keyring),
    });

    if (createdRecoveryKey) {
      sendSSE(res, "recovery-key", { recoveryKey: createdRecoveryKey });
    }
    sendSSE(res, "complete", envelope);
    res.end();
  } catch (err) {
    next(err);
  }
}

export async function restoreData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = req.body ?? {};

    startSSE(res);

    const validationError = validateBackup(payload);
    if (validationError) {
      sendSSE(res, "error", { error: validationError });
      res.end();
      return;
    }

    let payloadData = payload.data;

    if (payload.encrypted === true) {
      const keyring = await getKeyring();
      const serverKek = keyring ? serverKekOf(keyring) : null;

      let recoveryKek: Buffer | null = null;
      if (typeof req.body?.recoveryKey === "string" && req.body.recoveryKey.trim()) {
        try {
          recoveryKek = deriveRecoveryKek(parseRecoveryKey(req.body.recoveryKey));
        } catch {
          sendSSE(res, "error", {
            error: "Invalid recovery key",
            code: "INVALID_RECOVERY_KEY",
          });
          res.end();
          return;
        }
      }

      try {
        const opened = openEncryptedBackup(payload, { serverKek, recoveryKek });
        payloadData = (opened as any).data;
      } catch (e: any) {
        if (e?.message === "RECOVERY_KEY_REQUIRED") {
          sendSSE(res, "error", {
            error: "Recovery key required to decrypt this backup",
            code: "RECOVERY_KEY_REQUIRED",
          });
          res.end();
          return;
        }
        throw e;
      }
    }

    await applyBackup(payloadData, (progress) =>
      sendSSE(res, "progress", progress)
    );

    // Invalidate every existing session: any client that was active before
    // this restore must re-authenticate against the restored data.
    const now = new Date();
    await prisma.sessionState.upsert({
      where: { id: "global" },
      update: { sessionsValidAfter: now },
      create: { id: "global", sessionsValidAfter: now },
    });

    const userId = req.user?.id;
    if (userId) {
      await logAction("settings", "1", userId, "RESTORE", null, "Restored data from backup");
    }

    sendSSE(res, "complete", { success: true, message: "Data restored successfully" });
    res.end();
  } catch (err: any) {
    console.error("Restore error:", err);
    sendSSE(res, "error", { error: err?.message ?? "Restore failed" });
    res.end();
  }
}

export async function getRecoveryKey(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { keyring, createdRecoveryKey } = await getOrCreateKeyring();
    const display =
      createdRecoveryKey ??
      formatRecoveryKey(Buffer.from(keyring.recoveryKey, "base64"));
    res.json({ recoveryKey: display });
  } catch (err) {
    next(err);
  }
}

export async function regenerateRecoveryKeyHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const recoveryKey = await regenerateRecoveryKey();
    res.json({ recoveryKey });
  } catch (err) {
    next(err);
  }
}

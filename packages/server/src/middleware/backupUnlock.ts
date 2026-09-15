import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";

interface UnlockPayload {
  sub: string;
  scope: string;
}

export function requireBackupUnlock(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers["x-backup-unlock"];
  if (!header || typeof header !== "string") {
    res.status(401).json({ error: "Backup access is locked" });
    return;
  }

  try {
    const decoded = jwt.verify(header, JWT_SECRET) as UnlockPayload;

    if (decoded.scope !== "backup-restore" || decoded.sub !== req.user?.id) {
      res.status(403).json({ error: "Invalid backup unlock token" });
      return;
    }

    next();
  } catch {
    res.status(401).json({ error: "Backup unlock expired or invalid" });
  }
}

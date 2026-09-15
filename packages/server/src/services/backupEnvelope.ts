import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  generateKey,
  unwrapKey,
  wrapKey,
} from "./backupCrypto.js";
import type { BackupMeta } from "./backupValidation.js";

export const ENVELOPE_VERSION = 3;
const ALG = "AES-256-GCM";

export interface EncryptedEnvelope {
  format: "rbi-backup";
  version: number;
  encrypted: true;
  createdAt: string;
  meta?: BackupMeta;
  data: {
    alg: string;
    iv: string;
    ciphertext: string;
    tag: string;
    wraps: Array<{
      type: "server" | "recovery";
      iv: string;
      wrappedKey: string;
      tag: string;
    }>;
  };
}

export function isEncryptedBackup(value: any): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    value.encrypted === true &&
    !!value.data &&
    typeof value.data === "object" &&
    typeof value.data.ciphertext === "string" &&
    Array.isArray(value.data.wraps)
  );
}

export function buildEncryptedBackup(
  payload: object,
  meta: BackupMeta | undefined,
  keys: { serverKek: Buffer; recoveryKek: Buffer }
): EncryptedEnvelope {
  const dek = generateKey();
  const enc = aesGcmEncrypt(dek, Buffer.from(JSON.stringify(payload), "utf8"));
  const serverWrap = wrapKey(keys.serverKek, dek);
  const recoveryWrap = wrapKey(keys.recoveryKek, dek);

  return {
    format: "rbi-backup",
    version: ENVELOPE_VERSION,
    encrypted: true,
    createdAt: new Date().toISOString(),
    meta,
    data: {
      alg: ALG,
      iv: enc.iv,
      ciphertext: enc.ciphertext,
      tag: enc.tag,
      wraps: [
        {
          type: "server",
          iv: serverWrap.iv,
          wrappedKey: serverWrap.ciphertext,
          tag: serverWrap.tag,
        },
        {
          type: "recovery",
          iv: recoveryWrap.iv,
          wrappedKey: recoveryWrap.ciphertext,
          tag: recoveryWrap.tag,
        },
      ],
    },
  };
}

export function openEncryptedBackup(
  envelope: any,
  keys: { serverKek?: Buffer | null; recoveryKek?: Buffer | null }
): object {
  const unwrapWith = (
    kek: Buffer | null | undefined,
    type: "server" | "recovery"
  ): Buffer | null => {
    if (!kek) return null;
    const wrap = envelope?.data?.wraps?.find((w: any) => w.type === type);
    if (!wrap) return null;
    try {
      return unwrapKey(kek, wrap.iv, wrap.wrappedKey, wrap.tag);
    } catch {
      return null;
    }
  };

  const dek =
    unwrapWith(keys.serverKek, "server") ??
    unwrapWith(keys.recoveryKek, "recovery");
  if (!dek) {
    throw new Error("RECOVERY_KEY_REQUIRED");
  }

  const plaintext = aesGcmDecrypt(
    dek,
    envelope.data.iv,
    envelope.data.ciphertext,
    envelope.data.tag
  );
  return JSON.parse(plaintext.toString("utf8"));
}

import crypto from "node:crypto";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const RECOVERY_KEY_BYTES = 20;
const RECOVERY_SALT = Buffer.from("rbi-backup-recovery-salt-v1", "utf8");
const RECOVERY_INFO = Buffer.from("rbi-backup-recovery-v1", "utf8");
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export interface EncryptedParts {
  iv: string;
  ciphertext: string;
  tag: string;
}

export function generateKey(): Buffer {
  return crypto.randomBytes(KEY_BYTES);
}

export function aesGcmEncrypt(key: Buffer, plaintext: Buffer): EncryptedParts {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function aesGcmDecrypt(
  key: Buffer,
  iv: string,
  ciphertext: string,
  tag: string
): Buffer {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
}

export function wrapKey(kek: Buffer, dek: Buffer): EncryptedParts {
  return aesGcmEncrypt(kek, dek);
}

export function unwrapKey(
  kek: Buffer,
  iv: string,
  wrappedKey: string,
  tag: string
): Buffer {
  return aesGcmDecrypt(kek, iv, wrappedKey, tag);
}

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += CROCKFORD[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32Decode(text: string): Buffer {
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of text) {
    const idx = CROCKFORD.indexOf(ch);
    if (idx === -1) throw new Error("Invalid recovery key character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateRecoveryKey(): Buffer {
  return crypto.randomBytes(RECOVERY_KEY_BYTES);
}

export function formatRecoveryKey(raw: Buffer): string {
  return base32Encode(raw).match(/.{1,4}/g)!.join("-");
}

export function parseRecoveryKey(display: string): Buffer {
  const normalized = display
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
  const raw = base32Decode(normalized);
  if (raw.length !== RECOVERY_KEY_BYTES) {
    throw new Error("Invalid recovery key");
  }
  return raw;
}

export function deriveRecoveryKek(recoveryKey: Buffer): Buffer {
  return Buffer.from(
    crypto.hkdfSync("sha256", recoveryKey, RECOVERY_SALT, RECOVERY_INFO, KEY_BYTES)
  );
}

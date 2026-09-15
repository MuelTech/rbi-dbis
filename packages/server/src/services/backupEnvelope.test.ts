import { describe, expect, it } from "vitest";
import {
  deriveRecoveryKek,
  formatRecoveryKey,
  generateKey,
  generateRecoveryKey,
  parseRecoveryKey,
} from "./backupCrypto.js";
import {
  buildEncryptedBackup,
  isEncryptedBackup,
  openEncryptedBackup,
} from "./backupEnvelope.js";

function keys() {
  const serverKek = generateKey();
  const recoveryKek = deriveRecoveryKek(
    parseRecoveryKey(formatRecoveryKey(generateRecoveryKey()))
  );
  return { serverKek, recoveryKek };
}

describe("encrypted envelope", () => {
  it("round-trips with the server key", () => {
    const k = keys();
    const env = buildEncryptedBackup(
      { data: { residents: [1, 2] } },
      { total: 2, counts: {} },
      k
    );
    expect(isEncryptedBackup(env)).toBe(true);
    expect(openEncryptedBackup(env, { serverKek: k.serverKek })).toEqual({
      data: { residents: [1, 2] },
    });
  });

  it("round-trips with only the recovery key", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    expect(openEncryptedBackup(env, { recoveryKek: k.recoveryKek })).toEqual({
      data: { x: 1 },
    });
  });

  it("falls back to the recovery key when the server key is wrong", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    const opened = openEncryptedBackup(env, {
      serverKek: generateKey(),
      recoveryKek: k.recoveryKek,
    });
    expect(opened).toEqual({ data: { x: 1 } });
  });

  it("throws RECOVERY_KEY_REQUIRED when no supplied key works", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    expect(() =>
      openEncryptedBackup(env, { serverKek: generateKey() })
    ).toThrow("RECOVERY_KEY_REQUIRED");
  });

  it("detects a tampered ciphertext", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    const tampered = {
      ...env,
      data: {
        ...env.data,
        ciphertext: Buffer.from("AAAA", "base64").toString("base64"),
      },
    };
    expect(() =>
      openEncryptedBackup(tampered, { serverKek: k.serverKek })
    ).toThrow();
  });

  it("preserves meta", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: {} }, { total: 7, counts: { a: 1 } }, k);
    expect(env.meta).toEqual({ total: 7, counts: { a: 1 } });
  });

  it("rejects non-encrypted values", () => {
    expect(isEncryptedBackup({ version: 2, data: {} })).toBe(false);
    expect(isEncryptedBackup(null)).toBe(false);
  });
});

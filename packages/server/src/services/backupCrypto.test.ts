import { describe, expect, it } from "vitest";
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  deriveRecoveryKek,
  formatRecoveryKey,
  generateKey,
  generateRecoveryKey,
  parseRecoveryKey,
  unwrapKey,
  wrapKey,
} from "./backupCrypto.js";

describe("aesGcmEncrypt/Decrypt", () => {
  it("round-trips a payload", () => {
    const key = generateKey();
    const parts = aesGcmEncrypt(key, Buffer.from("hello"));
    expect(
      aesGcmDecrypt(key, parts.iv, parts.ciphertext, parts.tag).toString()
    ).toBe("hello");
  });

  it("fails with the wrong key", () => {
    const parts = aesGcmEncrypt(generateKey(), Buffer.from("hello"));
    expect(() =>
      aesGcmDecrypt(generateKey(), parts.iv, parts.ciphertext, parts.tag)
    ).toThrow();
  });

  it("detects tampering", () => {
    const key = generateKey();
    const parts = aesGcmEncrypt(key, Buffer.from("hello"));
    const tampered = Buffer.from(parts.ciphertext, "base64");
    tampered[0] ^= 0xff;
    expect(() =>
      aesGcmDecrypt(key, parts.iv, tampered.toString("base64"), parts.tag)
    ).toThrow();
  });
});

describe("wrapKey/unwrapKey", () => {
  it("round-trips a data key", () => {
    const kek = generateKey();
    const dek = generateKey();
    const w = wrapKey(kek, dek);
    expect(unwrapKey(kek, w.iv, w.ciphertext, w.tag).equals(dek)).toBe(true);
  });

  it("fails with a different kek", () => {
    const w = wrapKey(generateKey(), generateKey());
    expect(() => unwrapKey(generateKey(), w.iv, w.ciphertext, w.tag)).toThrow();
  });
});

describe("recovery key", () => {
  it("formats and parses back to the same bytes", () => {
    const raw = generateRecoveryKey();
    const display = formatRecoveryKey(raw);
    expect(display).toMatch(
      /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){7}$/
    );
    expect(parseRecoveryKey(display).equals(raw)).toBe(true);
  });

  it("is case-insensitive and ignores separators", () => {
    const raw = generateRecoveryKey();
    const display = formatRecoveryKey(raw);
    expect(
      parseRecoveryKey(display.toLowerCase().replace(/-/g, " ")).equals(raw)
    ).toBe(true);
  });

  it("rejects invalid length", () => {
    expect(() => parseRecoveryKey("ABCD")).toThrow();
  });

  it("derives a deterministic 32-byte kek", () => {
    const raw = generateRecoveryKey();
    const a = deriveRecoveryKek(raw);
    const b = deriveRecoveryKek(raw);
    expect(a.length).toBe(32);
    expect(a.equals(b)).toBe(true);
  });
});

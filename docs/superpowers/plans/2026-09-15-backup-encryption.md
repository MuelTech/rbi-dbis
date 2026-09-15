# Backup Encryption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encrypt every backup file with envelope encryption (AES-256-GCM) so a leaked file is unreadable, while keeping restore automatic via a server key and recoverable via an off-system recovery key.

**Architecture:** A new pure crypto module encrypts the backup payload with a random data key (DEK), then wraps that DEK with two KEKs: a server key (stored in a `CryptoKeyring` table) for automatic restore, and a recovery key (HKDF) that the admin keeps off-system. The server builds/opens envelopes; the desktop shows the recovery key once and prompts for it only when the server key can't decrypt.

**Tech Stack:** Node built-in `crypto` (no new deps), Prisma/MySQL, Express + SSE, React/Electron, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-backup-encryption-design.md`

## Global Constraints

- Use **AES-256-GCM** only; DEK = 32 random bytes, IV = 12 random bytes, tag = 16 bytes.
- Recovery key = **20 random bytes**, displayed as **Crockford Base32**, grouped `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`.
- Recovery KEK = `HKDF-SHA256(recoveryKeyBytes, salt="rbi-backup-recovery-salt-v1", info="rbi-backup-recovery-v1", 32)`.
- `BACKUP_VERSION = 3`; `validateBackup` accepts v1/v2 plaintext **and** v3 encrypted.
- **The recovery key must never be written into the backup file.**
- `CryptoKeyring` and `SessionState` are excluded from backup and from restore's clear list, and both appear in `HANDLED_MODELS`.
- No new runtime dependencies.
- Server verify: `pnpm --filter @rbi/server test` and `pnpm --filter @rbi/server exec tsc -p tsconfig.build.json`.
- Desktop verify: `pnpm --filter @rbi/desktop test` and `npx tsc --noEmit` (in `packages/desktop`).
- The two pre-existing `tsc` errors in `householdController.ts` / `userController.ts` are out of scope (a task is green when no *new* errors appear).

---

### Task 1: Crypto primitives (`backupCrypto.ts`)

**Files:**
- Create: `packages/server/src/services/backupCrypto.ts`
- Test: `packages/server/src/services/backupCrypto.test.ts`

**Interfaces:**
- Produces: `generateKey(): Buffer`, `generateRecoveryKey(): Buffer`, `formatRecoveryKey(raw: Buffer): string`, `parseRecoveryKey(display: string): Buffer`, `deriveRecoveryKek(raw: Buffer): Buffer`, `aesGcmEncrypt(key, plaintext): EncryptedParts`, `aesGcmDecrypt(key, iv, ciphertext, tag): Buffer`, `wrapKey(kek, dek): EncryptedParts`, `unwrapKey(kek, iv, wrappedKey, tag): Buffer`, `type EncryptedParts = { iv: string; ciphertext: string; tag: string }`.

- [ ] **Step 1: Write the failing tests**

```ts
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
    expect(aesGcmDecrypt(key, parts.iv, parts.ciphertext, parts.tag).toString()).toBe("hello");
  });

  it("fails with the wrong key", () => {
    const parts = aesGcmEncrypt(generateKey(), Buffer.from("hello"));
    expect(() => aesGcmDecrypt(generateKey(), parts.iv, parts.ciphertext, parts.tag)).toThrow();
  });

  it("detects tampering", () => {
    const key = generateKey();
    const parts = aesGcmEncrypt(key, Buffer.from("hello"));
    const tampered = Buffer.from(parts.ciphertext, "base64");
    tampered[0] ^= 0xff;
    expect(() => aesGcmDecrypt(key, parts.iv, tampered.toString("base64"), parts.tag)).toThrow();
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
    expect(display).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){7}$/);
    expect(parseRecoveryKey(display).equals(raw)).toBe(true);
  });

  it("is case-insensitive and ignores separators/ambiguous chars", () => {
    const raw = generateRecoveryKey();
    const display = formatRecoveryKey(raw);
    expect(parseRecoveryKey(display.toLowerCase().replace(/-/g, " ")).equals(raw)).toBe(true);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @rbi/server test`
Expected: FAIL — `Cannot find module './backupCrypto.js'`.

- [ ] **Step 3: Implement `backupCrypto.ts`**

```ts
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
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
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
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31];
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rbi/server test`
Expected: all `backupCrypto` tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/backupCrypto.ts packages/server/src/services/backupCrypto.test.ts
git commit -m "feat(backup): add AES-GCM crypto primitives and recovery key codec"
```

---

### Task 2: Envelope build/open (`backupEnvelope.ts`)

**Files:**
- Create: `packages/server/src/services/backupEnvelope.ts`
- Test: `packages/server/src/services/backupEnvelope.test.ts`

**Interfaces:**
- Consumes: Task 1 (`generateKey`, `aesGcmEncrypt`, `aesGcmDecrypt`, `wrapKey`, `unwrapKey`).
- Produces: `ENVELOPE_VERSION`, `isEncryptedBackup(value): boolean`, `buildEncryptedBackup(payload, meta, keys): EncryptedEnvelope`, `openEncryptedBackup(envelope, keys): object`.
- Error contract: `openEncryptedBackup` throws `Error("RECOVERY_KEY_REQUIRED")` when no supplied key unwraps the DEK.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { generateKey, deriveRecoveryKek, formatRecoveryKey, parseRecoveryKey } from "./backupCrypto.js";
import { buildEncryptedBackup, isEncryptedBackup, openEncryptedBackup } from "./backupEnvelope.js";

function keys() {
  const serverKek = generateKey();
  const recoveryKek = deriveRecoveryKek(parseRecoveryKey(formatRecoveryKey(generateKey())));
  return { serverKek, recoveryKek };
}

describe("encrypted envelope", () => {
  it("round-trips with the server key", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { residents: [1, 2] } }, { total: 2, counts: {} }, k);
    expect(isEncryptedBackup(env)).toBe(true);
    expect(openEncryptedBackup(env, { serverKek: k.serverKek })).toEqual({ data: { residents: [1, 2] } });
  });

  it("round-trips with only the recovery key", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    const opened = openEncryptedBackup(env, { recoveryKek: k.recoveryKek });
    expect(opened).toEqual({ data: { x: 1 } });
  });

  it("prefers the server key but falls back to recovery", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    const opened = openEncryptedBackup(env, { serverKek: generateKey(), recoveryKek: k.recoveryKek });
    expect(opened).toEqual({ data: { x: 1 } });
  });

  it("throws RECOVERY_KEY_REQUIRED when no key works", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    expect(() => openEncryptedBackup(env, { serverKek: generateKey() })).toThrow("RECOVERY_KEY_REQUIRED");
  });

  it("detects a tampered ciphertext", () => {
    const k = keys();
    const env = buildEncryptedBackup({ data: { x: 1 } }, undefined, k);
    const tampered = { ...env, data: { ...env.data, ciphertext: Buffer.from("AAAA", "base64").toString("base64") } };
    expect(() => openEncryptedBackup(tampered, { serverKek: k.serverKek })).toThrow();
  });

  it("rejects non-encrypted values", () => {
    expect(isEncryptedBackup({ version: 2, data: {} })).toBe(false);
    expect(isEncryptedBackup(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @rbi/server test`
Expected: FAIL — `Cannot find module './backupEnvelope.js'`.

- [ ] **Step 3: Implement `backupEnvelope.ts`**

```ts
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
    wraps: Array<{ type: "server" | "recovery"; iv: string; wrappedKey: string; tag: string }>;
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
        { type: "server", iv: serverWrap.iv, wrappedKey: serverWrap.ciphertext, tag: serverWrap.tag },
        { type: "recovery", iv: recoveryWrap.iv, wrappedKey: recoveryWrap.ciphertext, tag: recoveryWrap.tag },
      ],
    },
  };
}

export function openEncryptedBackup(
  envelope: any,
  keys: { serverKek?: Buffer | null; recoveryKek?: Buffer | null }
): object {
  const unwrapWith = (kek: Buffer | null | undefined, type: "server" | "recovery"): Buffer | null => {
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
    unwrapWith(keys.serverKek, "server") ?? unwrapWith(keys.recoveryKek, "recovery");
  if (!dek) throw new Error("RECOVERY_KEY_REQUIRED");

  const plaintext = aesGcmDecrypt(
    dek,
    envelope.data.iv,
    envelope.data.ciphertext,
    envelope.data.tag
  );
  return JSON.parse(plaintext.toString("utf8"));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rbi/server test`
Expected: all `backupEnvelope` tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/backupEnvelope.ts packages/server/src/services/backupEnvelope.test.ts
git commit -m "feat(backup): add encrypted envelope build/open"
```

---

### Task 3: `CryptoKeyring` model + keyring service

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create (migration): `packages/db/prisma/migrations/<ts>_add_crypto_keyring/`
- Create: `packages/server/src/services/backupKeyring.ts`
- Modify: `packages/server/src/services/backupService.ts` (`HANDLED_MODELS`)

**Interfaces:**
- Consumes: Task 1 (`generateKey`, `generateRecoveryKey`, `deriveRecoveryKek`, `formatRecoveryKey`).
- Produces: `getKeyring()`, `getOrCreateKeyring(): Promise<{ keyring: CryptoKeyring; createdRecoveryKey?: string }>`, `serverKekOf(keyring): Buffer`, `recoveryKekOf(keyring): Buffer`, `regenerateRecoveryKey(): Promise<string>`.

- [ ] **Step 1: Add the Prisma model**

Append to `packages/db/prisma/schema.prisma` (before the `SessionState` model or after it):

```prisma
// ─── CryptoKeyring ───────────────────────────────────────────────────────────

model CryptoKeyring {
  id          String   @id @default("global")
  serverKey   String   @db.Text @map("server_key")
  recoveryKey String   @db.Text @map("recovery_key")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("crypto_keyring")
}
```

- [ ] **Step 2: Create and apply the migration**

Run: `pnpm --filter @rbi/db exec prisma migrate dev --name add_crypto_keyring`
Expected: migration applied and Prisma Client regenerated.

- [ ] **Step 3: Add to the completeness guard**

In `packages/server/src/services/backupService.ts`, add to `HANDLED_MODELS`:

```ts
  // Infrastructure state, intentionally NOT exported/restored by backup.
  SessionState: true,
  CryptoKeyring: true,
```

- [ ] **Step 4: Implement `backupKeyring.ts`**

```ts
import { prisma } from "@rbi/db";
import {
  deriveRecoveryKek,
  formatRecoveryKey,
  generateKey,
  generateRecoveryKey,
} from "./backupCrypto.js";

export async function getKeyring() {
  return prisma.cryptoKeyring.findUnique({ where: { id: "global" } });
}

export async function getOrCreateKeyring(): Promise<{
  keyring: { serverKey: string; recoveryKey: string };
  createdRecoveryKey?: string;
}> {
  const existing = await getKeyring();
  if (existing) return { keyring: existing };

  const serverKey = generateKey();
  const recoveryKey = generateRecoveryKey();
  const keyring = await prisma.cryptoKeyring.create({
    data: {
      id: "global",
      serverKey: serverKey.toString("base64"),
      recoveryKey: recoveryKey.toString("base64"),
    },
  });
  return { keyring, createdRecoveryKey: formatRecoveryKey(recoveryKey) };
}

export function serverKekOf(keyring: { serverKey: string }): Buffer {
  return Buffer.from(keyring.serverKey, "base64");
}

export function recoveryKekOf(keyring: { recoveryKey: string }): Buffer {
  return deriveRecoveryKek(Buffer.from(keyring.recoveryKey, "base64"));
}

export async function regenerateRecoveryKey(): Promise<string> {
  const recoveryKey = generateRecoveryKey();
  await prisma.cryptoKeyring.update({
    where: { id: "global" },
    data: { recoveryKey: recoveryKey.toString("base64") },
  });
  return formatRecoveryKey(recoveryKey);
}
```

- [ ] **Step 5: Type-check**

Run: `pnpm --filter @rbi/server exec tsc -p tsconfig.build.json`
Expected: no new errors (the two pre-existing ones remain).

- [ ] **Step 6: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations packages/server/src/services/backupKeyring.ts packages/server/src/services/backupService.ts
git commit -m "feat(backup): add CryptoKeyring table and keyring service"
```

---

### Task 4: `validateBackup` accepts v3 envelopes (TDD)

**Files:**
- Modify: `packages/server/src/services/backupValidation.ts`
- Test: `packages/server/src/services/backupValidation.test.ts`

**Interfaces:**
- Consumes: `isEncryptedBackup` semantics (implemented inline to avoid a circular import: check `encrypted === true` + `data.wraps`).
- Produces: `BACKUP_VERSION = 3`; `validateBackup` returns `null` for v3 envelopes and v1/v2 plaintext, and an error string otherwise.

- [ ] **Step 1: Update the failing tests**

Add to `backupValidation.test.ts`:

```ts
it("accepts an encrypted v3 envelope", () => {
  expect(
    validateBackup({ version: 3, encrypted: true, data: { ciphertext: "x", wraps: [] } })
  ).toBeNull();
});

it("rejects an encrypted envelope without wraps", () => {
  expect(validateBackup({ version: 3, encrypted: true, data: { ciphertext: "x" } })).toBe(
    "Invalid encrypted backup"
  );
});

it("rejects a version newer than 3", () => {
  expect(validateBackup({ version: 4, data: {} })).toContain("newer than");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @rbi/server test`
Expected: FAIL on the new v3 cases (current code expects `data` plaintext and `BACKUP_VERSION` is 2).

- [ ] **Step 3: Implement**

In `backupValidation.ts`:

```ts
export const BACKUP_VERSION = 3;
```

Replace the body of `validateBackup` with:

```ts
export function validateBackup(payload: any): string | null {
  if (!payload || typeof payload !== "object") {
    return "Invalid backup file";
  }
  if (typeof payload.version !== "number") {
    return "Backup file is missing a version";
  }
  if (payload.version > BACKUP_VERSION) {
    return `Backup version ${payload.version} is newer than this system supports (${BACKUP_VERSION})`;
  }
  if (payload.encrypted === true) {
    const wraps = payload.data?.wraps;
    if (!payload.data || !Array.isArray(wraps)) {
      return "Invalid encrypted backup";
    }
    return null;
  }
  if (!payload.data || typeof payload.data !== "object") {
    return "Backup file is missing data";
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rbi/server test`
Expected: all pass (`BACKUP_VERSION` is now 3; the legacy v1 test still passes).

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/backupValidation.ts packages/server/src/services/backupValidation.test.ts
git commit -m "feat(backup): accept encrypted v3 envelopes in validateBackup"
```

---

### Task 5: Backup integration (server encrypts; recovery key via separate SSE event)

**Files:**
- Modify: `packages/server/src/controllers/settingsController.ts`
- Modify: `packages/desktop/src/services/settings.ts`
- Modify: `packages/desktop/src/services/sse.ts`
- Test: `packages/desktop/src/services/sse.test.ts`

**Interfaces:**
- Consumes: `buildBackup` (existing), `getOrCreateKeyring`, `serverKekOf`, `recoveryKekOf`, `buildEncryptedBackup`.
- Produces: SSE event `recovery-key` with `{ recoveryKey }`; `createSseParser` gains `onRecoveryKey?: (key: string) => void`; `settingsService.backupWithProgress(onProgress, onRecoveryKey?)`.

- [ ] **Step 1: Write the failing SSE test (desktop)**

Add to `sse.test.ts`:

```ts
it("captures a recovery-key event callback", () => {
  const seen: string[] = [];
  const parser = createSseParser({ onRecoveryKey: (k) => seen.push(k) });
  parser.push('event: recovery-key\ndata: {"recoveryKey":"ABCD-EFGH"}\n\n');
  parser.flush();
  expect(seen).toEqual(["ABCD-EFGH"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @rbi/desktop test`
Expected: FAIL (parser ignores `recovery-key`).

- [ ] **Step 3: Implement the parser change (`sse.ts`)**

```ts
export interface SseMessageHandlers {
  onProgress?: (data: any) => void;
  onRecoveryKey?: (key: string) => void;
}
```

In `handleMessage`, add a branch:

```ts
    if (event === "progress") {
      handlers.onProgress?.(parsed);
    } else if (event === "recovery-key") {
      if (typeof parsed?.recoveryKey === "string") handlers.onRecoveryKey?.(parsed.recoveryKey);
    } else if (event === "complete" || event === "error") {
      result = parsed;
    }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @rbi/desktop test`
Expected: all desktop tests pass.

- [ ] **Step 5: Wire `onRecoveryKey` through `settings.ts`**

Change the `sseRequest` signature to accept an optional `onRecoveryKey` and pass it into `createSseParser`. Change the two public helpers:

```ts
export const settingsService = {
  // ...
  backupWithProgress: async (
    onProgress: (update: ProgressUpdate) => void,
    onRecoveryKey?: (key: string) => void
  ): Promise<BackupData> =>
    sseRequest<BackupData>("GET", `${API_BASE}/settings/backup`, null, onProgress, onRecoveryKey),
  // restoreWithProgress gains an optional recoveryKey param in Task 6
};
```

- [ ] **Step 6: Encrypt in the backup controller**

In `settingsController.ts`, import the new modules and replace `backupData`:

```ts
import {
  buildBackup,
  applyBackup,
  validateBackup,
} from "../services/backupService.js";
import { buildEncryptedBackup } from "../services/backupEnvelope.js";
import {
  getOrCreateKeyring,
  serverKekOf,
  recoveryKekOf,
} from "../services/backupKeyring.js";
```

```ts
export async function backupData(_req: Request, res: Response, next: NextFunction) {
  try {
    startSSE(res);

    const plain = await buildBackup((progress) => sendSSE(res, "progress", progress));
    const { keyring, createdRecoveryKey } = await getOrCreateKeyring();

    const envelope = buildEncryptedBackup(
      { data: plain.data },
      plain.meta,
      { serverKek: serverKekOf(keyring), recoveryKek: recoveryKekOf(keyring) }
    );

    if (createdRecoveryKey) {
      sendSSE(res, "recovery-key", { recoveryKey: createdRecoveryKey });
    }
    sendSSE(res, "complete", envelope);
    res.end();
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 7: Type-check both packages**

Run: `pnpm --filter @rbi/server exec tsc -p tsconfig.build.json` and (in `packages/desktop`) `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/controllers/settingsController.ts packages/desktop/src/services/settings.ts packages/desktop/src/services/sse.ts packages/desktop/src/services/sse.test.ts
git commit -m "feat(backup): encrypt backups and emit recovery key over SSE"
```

---

### Task 6: Restore integration (auto server key → recovery fallback)

**Files:**
- Modify: `packages/server/src/controllers/settingsController.ts`
- Modify: `packages/desktop/src/services/settings.ts`
- Modify: `packages/desktop/src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `validateBackup`, `isEncryptedBackup` (add to `backupEnvelope.ts` exports), `openEncryptedBackup`, `getKeyring`, `serverKekOf`, `recoveryKekOf`, `parseRecoveryKey`, `deriveRecoveryKek`.
- Produces: restore request body may include `recoveryKey`; server SSE `error` event with `code: "RECOVERY_KEY_REQUIRED"` when needed.

- [ ] **Step 1: Server restore flow**

In `settingsController.ts`, replace the decryption section of `restoreData`. After `startSSE` and `validateBackup`:

```ts
    let payloadData = payload.data;

    if (payload.encrypted === true) {
      const keyring = await getKeyring();
      const serverKek = keyring ? serverKekOf(keyring) : null;
      let recoveryKek: Buffer | null = null;
      if (typeof req.body?.recoveryKey === "string" && req.body.recoveryKey.trim()) {
        recoveryKek = deriveRecoveryKek(parseRecoveryKey(req.body.recoveryKey));
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

    await applyBackup(payloadData, (progress) => sendSSE(res, "progress", progress));
```

Add imports:

```ts
import { getKeyring, serverKekOf } from "../services/backupKeyring.js";
import { openEncryptedBackup } from "../services/backupEnvelope.js";
import { deriveRecoveryKek, parseRecoveryKey } from "../services/backupCrypto.js";
```

- [ ] **Step 2: SSE client preserves the error code**

In `sse.ts`, store the code with the result (the `error` message already comes through). In `settings.ts`'s `sseRequest` `onload`, when rejecting on `result?.error`, attach the code:

```ts
        if (result?.error) {
          const err: any = new Error(result.error);
          if (result.code) err.code = result.code;
          reject(err);
        } else {
          resolve(result as T);
        }
```

- [ ] **Step 3: Desktop restore prompt + retry**

In `settings.ts`, add a `recoveryKey` argument to `restoreWithProgress` and include it in the JSON body:

```ts
  restoreWithProgress: async (
    data: BackupData,
    onProgress: (update: ProgressUpdate) => void,
    recoveryKey?: string
  ): Promise<{ success: boolean }> =>
    sseRequest<{ success: boolean }>(
      "POST",
      `${API_BASE}/settings/restore`,
      JSON.stringify({ ...data, recoveryKey }),
      onProgress
    ),
```

In `Settings.tsx` `handleRestoreConfirm`, wrap the restore call so a `RECOVERY_KEY_REQUIRED` error prompts and retries. Add state:

```tsx
const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
const [needsRecoveryKey, setNeedsRecoveryKey] = useState(false);
```

Replace the restore invocation with a helper:

```tsx
const runRestore = async (recoveryKey?: string) => {
  await settingsService.restoreWithProgress(backup, (update) => {
    setProgressModal((prev) => prev ? { ...prev, progress: update } : null);
  }, recoveryKey);
};
```

In the catch of `handleRestoreConfirm`, before showing the generic error:

```tsx
        } catch (err: any) {
          setProgressModal(null);
          if (err?.code === 'RECOVERY_KEY_REQUIRED' && !needsRecoveryKey) {
            setNeedsRecoveryKey(true);
            setIsRestoreRunning(false);
            return;
          }
          // ...existing error handling...
        }
```

Add a recovery-key prompt modal (using `ConfirmationModal`'s plain style or a small inline modal) that, on submit, calls `runRestore(recoveryKeyInput)` and resets `needsRecoveryKey`. (Follow the existing modal styling in `Settings.tsx`; reuse `settingsService.restoreWithProgress`.)

- [ ] **Step 4: Type-check**

Run server + desktop `tsc` as in Task 5 Step 7.
Expected: no new errors.

- [ ] **Step 5: Integration verification (temporary script)**

Create `packages/server/src/scripts/verifyEncryption.ts` that:
1. `buildBackup` → `buildEncryptedBackup` with a keyring from `getOrCreateKeyring`.
2. `openEncryptedBackup` with only the server KEK → payload matches.
3. Delete the keyring, `openEncryptedBackup` with `deriveRecoveryKek(parseRecoveryKey(display))` → payload matches.
4. Tamper a wrap/ciphertext → decryption throws.

Run: `pnpm --filter @rbi/server exec tsx src/scripts/verifyEncryption.ts`
Expected: `RESULT: ENCRYPTION OK`. Then delete the script folder.

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/controllers/settingsController.ts packages/desktop/src/services/settings.ts packages/desktop/src/pages/Settings.tsx
git commit -m "feat(backup): auto-decrypt with server key and fall back to recovery key"
```

---

### Task 7: Recovery-key UX (modal, Settings card, endpoints)

**Files:**
- Modify: `packages/server/src/routes/settings.ts`
- Modify: `packages/server/src/controllers/settingsController.ts`
- Create: `packages/server/src/middleware/requireSuperAdmin.ts`
- Modify: `packages/desktop/src/services/settings.ts`
- Modify: `packages/desktop/src/pages/Settings.tsx`

**Interfaces:**
- Produces: `GET /api/settings/encryption/recovery-key` → `{ recoveryKey: string }`; `POST /api/settings/encryption/recovery-key/regenerate` → `{ recoveryKey: string }`; both require `requireAuth` + `requireSuperAdmin`.
- `settingsService.getRecoveryKey()`, `settingsService.regenerateRecoveryKey()`.

- [ ] **Step 1: Add `requireSuperAdmin`**

Create `packages/server/src/middleware/requireSuperAdmin.ts`:

```ts
import type { Request, Response, NextFunction } from "express";

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.roleType !== "SuperAdmin") {
    res.status(403).json({ error: "SuperAdmin access required" });
    return;
  }
  next();
}
```

- [ ] **Step 2: Add controller handlers**

In `settingsController.ts`:

```ts
export async function getRecoveryKey(_req: Request, res: Response, next: NextFunction) {
  try {
    const { keyring, createdRecoveryKey } = await getOrCreateKeyring();
    const display =
      createdRecoveryKey ??
      formatRecoveryKey(Buffer.from((keyring as any).recoveryKey, "base64"));
    res.json({ recoveryKey: display });
  } catch (err) {
    next(err);
  }
}

export async function regenerateRecoveryKeyHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const recoveryKey = await regenerateRecoveryKey();
    res.json({ recoveryKey });
  } catch (err) {
    next(err);
  }
}
```

Add imports: `formatRecoveryKey` from `backupCrypto.js`, `regenerateRecoveryKey` from `backupKeyring.js`.

- [ ] **Step 3: Add routes**

In `routes/settings.ts`:

```ts
import { requireSuperAdmin } from "../middleware/requireSuperAdmin.js";
// ...
settingsRouter.get("/encryption/recovery-key", requireSuperAdmin, getRecoveryKey);
settingsRouter.post("/encryption/recovery-key/regenerate", requireSuperAdmin, regenerateRecoveryKeyHandler);
```

- [ ] **Step 4: Desktop service methods**

In `settings.ts`:

```ts
  getRecoveryKey: () => api.get<{ recoveryKey: string }>("/settings/encryption/recovery-key"),
  regenerateRecoveryKey: () =>
    api.post<{ recoveryKey: string }>("/settings/encryption/recovery-key/regenerate", {}),
```

- [ ] **Step 5: Desktop UI**

In `Settings.tsx`:
- On a backup where `onRecoveryKey` fires, store the key and show a **"Save your recovery key"** modal with the grouped key, a copy button, a download button (`downloadJson({ recoveryKey }, 'rbi-recovery-key.json')`), and an "I've saved it" button that closes it.
- Add a **Backup Encryption** card (only when `user.roleType === 'SuperAdmin'`, via `useAuth`) that fetches `settingsService.getRecoveryKey()` on demand and offers **Show/Copy** and **Regenerate** (behind `ConfirmationModal` with a warning that old backups then require the previous key).

- [ ] **Step 6: Type-check**

Run server + desktop `tsc`.
Expected: no new errors.

- [ ] **Step 7: Manual verification**

Run `pnpm dev:server` + `pnpm dev:desktop`. Confirm:
- First backup shows the recovery-key modal; the downloaded `.json` contains **no** `recoveryKey` field.
- Restore works automatically (no prompt).
- After deleting the `crypto_keyring` row (via Prisma Studio) and restoring, the app prompts for the recovery key and succeeds with it.
- Settings → Backup Encryption shows/copies/regenerates the key (SuperAdmin only).

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/routes/settings.ts packages/server/src/controllers/settingsController.ts packages/server/src/middleware/requireSuperAdmin.ts packages/desktop/src/services/settings.ts packages/desktop/src/pages/Settings.tsx
git commit -m "feat(backup): recovery-key modal, settings card, and admin endpoints"
```

---

## Self-Review

**Spec coverage:** crypto primitives → Task 1; envelope + `isEncryptedBackup` → Task 2; keyring + exclusion from backup/clear + `HANDLED_MODELS` → Task 3; version 3 + legacy acceptance → Task 4; encrypted backup + separate recovery-key SSE (never in the file) → Task 5; automatic server-key restore + recovery fallback + `RECOVERY_KEY_REQUIRED` → Task 6; recovery-key modal + Settings card + admin endpoints → Task 7. Non-goals (TLS, DB at-rest, per-user) intentionally absent.

**Placeholder scan:** every code step contains concrete code; no TBD/TODO.

**Type consistency:** `EncryptedParts` fields (`iv`, `ciphertext`, `tag`) are used consistently in `wrapKey`/envelope `wraps` (`wrappedKey` = wrap `ciphertext`). `RECOVERY_KEY_REQUIRED` is the single error contract between `openEncryptedBackup` (Task 2) and the controller (Task 6). `onRecoveryKey` callback name matches across `sse.ts` and `settings.ts` (Task 5). `BACKUP_VERSION = 3` set only in Task 4 and consumed by `validateBackup`.

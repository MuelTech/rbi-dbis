# Backup Encryption (Envelope) — Design Spec

**Date:** 2026-09-15
**Status:** Approved for planning
**Feature area:** Backup & Restore (`packages/server`, `packages/desktop`)

## 1. Goal

Encrypt the backup file so that a leaked file (Downloads folder, USB, email, cloud)
cannot be read by anyone who does not hold the decryption key, while keeping normal
restore **automatic** (no prompt) on the same installation. Provide an independent
recovery path for disaster recovery (server/database loss).

## 2. Threat model

- **In scope:** an attacker who obtains a backup **file** but not the server.
- **Out of scope:** an attacker with access to the server machine or database
  (they can read the database directly); network eavesdropping (the app uses plain
  HTTP over the LAN — TLS is a separate concern).

## 3. Non-goals

- TLS/transport encryption.
- At-rest encryption of the MySQL database.
- Per-user or multi-recipient keys.
- Changing the recovery key for already-created backups (each file keeps the key it
  was written with).

## 4. Cryptographic design

- **Cipher:** AES-256-GCM (authenticated) for both payload and key wrapping.
- **Data key (DEK):** random 32 bytes per backup. Encrypts the payload JSON.
- **IV/nonce:** random 12 bytes per encryption operation (payload and each wrap).
- **Auth tag:** 16 bytes, stored separately (`tag`) for clarity.
- **Key-encryption keys (KEKs):**
  - **Server KEK:** random 32 bytes, generated once, stored in the keyring.
  - **Recovery KEK:** `HKDF-SHA256(recoveryKeyBytes, salt, info)` where `salt` is a
    fixed, public application constant (`"rbi-backup-recovery-salt-v1"`, UTF-8) and
    `info` is `"rbi-backup-recovery-v1"`. A fixed salt is safe here because the IKM is
    already 256 bits of entropy and no salt secrecy is required. HKDF is appropriate
    because the recovery key is high-entropy; scrypt/Argon2 is only needed for
    human-chosen passwords (not used here).
- **Recovery key:** random 32 bytes, displayed to the admin as grouped Base32.
- No new dependencies — Node's built-in `crypto`.

## 5. Key management

- New singleton Prisma model **`CryptoKeyring`**:
  - `id` (default `"global"`), `serverKey` (base64), `recoveryKey` (base64),
    `createdAt`, `updatedAt`.
- **Not** part of the backup and **excluded** from restore's clear list (like
  `SessionState`). Added to `HANDLED_MODELS` as intentionally excluded.
- Auto-created (keys generated) on the first encrypted backup.
- The server keeps a copy of the recovery key solely to wrap DEKs automatically; the
  **admin's off-system copy is the true disaster-recovery path**. If the keyring is
  lost (fresh install), the recovery key is required to decrypt existing backups.

## 6. File format (v3 envelope)

```json
{
  "format": "rbi-backup",
  "version": 3,
  "encrypted": true,
  "createdAt": "2026-09-15T...Z",
  "meta": { "total": 174, "counts": { "residents": 20, "...": 0 } },
  "data": {
    "alg": "AES-256-GCM",
    "iv": "<base64>",
    "ciphertext": "<base64>",
    "tag": "<base64>",
    "wraps": [
      { "type": "server",   "alg": "AES-256-GCM", "iv": "<base64>", "wrappedKey": "<base64>", "tag": "<base64>" },
      { "type": "recovery", "alg": "AES-256-GCM", "iv": "<base64>", "wrappedKey": "<base64>", "tag": "<base64>" }
    ]
  }
}
```

- Only `format`, `version`, `encrypted`, `createdAt`, and `meta` (counts only) are
  plaintext. `meta` contains no PII.
- The payload plaintext is `{ "data": <existing backup data object> }` (same shape the
  current `buildBackup` produces).

## 7. Backup flow

1. Build the payload as today (`buildBackup`).
2. Ensure the keyring exists (generate if first time).
3. Generate a DEK; encrypt the payload; wrap the DEK with the server KEK and the
   recovery KEK.
4. Emit the v3 envelope via the existing SSE `complete` event; client downloads it as
   `.json` (UX unchanged, **no prompt**).
5. If the keyring/recovery key was just generated, the `complete` event also carries
   `recoveryKey` (+ `recoveryKeyGenerated: true`) so the client can show the
   "Save your recovery key" modal. Otherwise it is omitted.

## 8. Restore flow

1. `validateBackup` accepts **v1/v2 plaintext** and **v3 encrypted**.
2. **Plaintext** → existing path.
3. **v3 encrypted**:
   - Try the **server KEK** to unwrap the DEK; on success, decrypt and proceed
     (automatic).
   - If the server KEK is absent or fails to unwrap:
     - If the request included a `recoveryKey`, derive the recovery KEK and unwrap.
     - Otherwise respond with an SSE `error` event carrying
       `code: "RECOVERY_KEY_REQUIRED"`.
4. Client, on `RECOVERY_KEY_REQUIRED`, prompts for the recovery key and re-POSTs the
   restore including `recoveryKey`.
5. After decryption, the existing apply + session-cutoff logic runs unchanged.

## 9. Recovery-key UX

- **"Save your recovery key" modal** on first encrypted backup: displays the grouped
  key, copy + download buttons, and an "I've saved it" acknowledgment.
- **Settings → Backup Encryption** card (SuperAdmin only): shows encryption status,
  lets the admin **view/copy** the recovery key, and **regenerate** it (with a warning
  that previous backups then require the previous key).

## 10. Compatibility

- `BACKUP_VERSION` becomes `3`; `validateBackup` accepts `≤ 3` and requires the
  envelope shape for `encrypted: true`.
- v1/v2 plaintext backups remain restorable.
- `CryptoKeyring` and `SessionState` are excluded from backup/restore.

## 11. Testing

- **Unit (`packages/server`):** encrypt/decrypt round-trip; wrong key fails; tamper
  detection (modified ciphertext/tag fails); envelope parse/validate; HKDF recovery
  derivation; legacy (plaintext) detection; `validateBackup` for v3.
- **Integration (live DB, temporary scripts):** backup produces a decryptable
  envelope; restore with server key (automatic); restore with recovery key after
  removing the keyring; referential integrity preserved; DB left unchanged.
- **Desktop:** `Settings` restore flow handles `RECOVERY_KEY_REQUIRED` (prompt +
  retry) — covered by manual click-through; SSE parser tests unaffected.

## 12. Trade-offs / notes

- The recovery key transits the LAN in plaintext when displayed/entered (no TLS). It
  protects the **file at rest**, not the wire.
- The server stores a copy of the recovery key for automation; the admin keeps the
  independent copy.
- Losing both the keyring and the recovery key makes existing encrypted backups
  unrecoverable — this is inherent and must be documented for operators.

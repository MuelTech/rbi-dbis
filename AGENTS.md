# AGENTS.md — Barangay 418 RBI-DBIS

Agent context for this repository. Read this before making changes.

## What this is

A barangay records management system for **Barangay 418**: residents, households,
families, document issuance, activity logging, and a full backup/restore feature
with at-rest encryption. Multiple **desktop clients on a LAN** connect to a single
**Express API** that owns the database.

pnpm workspaces monorepo. **Node 18+, TypeScript, React 19, Electron 35,
Express 5, Prisma 6, TanStack Query 5, MariaDB** (XAMPP for dev, standalone
MariaDB for production).

## Packages

| Package | Path | Role |
|---|---|---|
| `@rbi/db` | `packages/db/` | Prisma schema + singleton `PrismaClient` (`src/index.ts`) |
| `@rbi/server` | `packages/server/` | Express 5 REST API on `:4000`, ESM (`"type": "module"`) |
| `@rbi/desktop` | `packages/desktop/` | React 19 + Electron app (Electron Forge + Vite) |

Deeper detail lives in `.agent/rules/*.mdc` (project-structure, api-communication,
database-schema, deployment-networking, design-system). Keep them in sync with code.

## Commands (run from repo root)

| Command | Purpose |
|---|---|
| `pnpm install` | install all workspace deps |
| `pnpm dev:server` | Express API (`tsx watch`, port 4000) |
| `pnpm dev:desktop` | Electron + Vite (renderer port 3000) |
| `pnpm test` | run tests in all packages (server + desktop) |
| `pnpm --filter @rbi/server test` | server tests only |
| `pnpm --filter @rbi/desktop test` | desktop tests only |
| `pnpm build:server` | `tsc -p tsconfig.build.json` (see Gotchas) |
| `pnpm db:migrate` | `prisma migrate dev` (dev) |
| `pnpm db:generate` | regenerate Prisma client |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | seed users + document types |

Production migrations use **`prisma migrate deploy`** (not `migrate dev`):
`pnpm --filter @rbi/db exec prisma migrate deploy`.

## Architecture

### Auth & sessions
- JWT (Bearer), default 8h (`JWT_SECRET`, `JWT_EXPIRES_IN`). Claims: `sub`, `username`, `iat`, `tv` (tokenVersion).
- `requireAuth` (`middleware/auth.ts`) checks: user exists + `isActive`, `tokenVersion` matches, and `iat >= SessionState.sessionsValidAfter`.
- **Per-user invalidation:** changing a password increments `User.tokenVersion`, revoking old tokens. A self password change returns a **fresh token** so that session stays logged in. `PUT /auth/change-password` → `{ success, token }`.
- **Global invalidation:** a full restore sets `SessionState.sessionsValidAfter = now`, killing **every** session. Clients are also logged out in the UI after restore.
- Desktop: `services/api.ts` has `setUnauthorizedHandler`/`notifyUnauthorized`; `AuthContext` registers `logout`, so any `401` (except a failed login) drops to the login screen.
- Forced first-login password change is driven by `User.mustChangePassword`; `ChangePassword` page is React state, `App.tsx` shows it when true.

### RBAC
- Roles: `SuperAdmin`, `Admin`. Admin permissions: `Resident Access`, `Document Access`, `Resident & Document Access`. Sidebar visibility is permission-driven.
- `middleware/requireSuperAdmin.ts` gates recovery-key endpoints (403 otherwise).

### Backup & Restore (read this before touching it)
- **Encrypted by default, always on.** New backups are a **v3 envelope**: AES-256-GCM payload encrypted with a random **data key (DEK)**; the DEK is wrapped (encrypted) twice — by a **server KEK** and a **recovery KEK**.
- **Keys live in `CryptoKeyring`** (single row): `server_key` + `recovery_key`. Created once on first backup. **Never part of the backup.**
- **Recovery key** is generated once, shown once as Crockford Base32, and must be kept off-system. Derived KEK = `HKDF-SHA256`.
  - Same server → restore is automatic (server key).
  - Fresh install / keyring gone → restore prompts for the recovery key.
  - Regenerating the recovery key affects **future** backups only; old files need the old key (for disaster recovery).
- **File format (v3):** `{ format:"rbi-backup", version:3, encrypted:true, createdAt, meta{counts,total}, data{ alg, iv, ciphertext, tag, wraps:[server,recovery] } }`. Only counts/timestamp are plaintext.
- **Coverage:** all 18 business models. `SessionState` and `CryptoKeyring` are intentionally excluded (infra). `HANDLED_MODELS: Record<Prisma.ModelName, true>` in `backupService.ts` is a **compile-time guard** — adding a model without updating it fails the build.
- **Restore semantics:** destructive; clears then rebuilds inside one transaction (120s timeout). Accepts v1/v2 plaintext and v3 encrypted.
  - **System document types are protected** (`DocumentType.isSystem`): restore only clears non-system types and maps by name, so an empty/old backup can't wipe the baseline.
  - **`displayId` is preserved** on restore for Resident/Household/Family/User/Document/Order.
  - Encrypted v3 backups require the recovery key when the server key can't decrypt (`code: "RECOVERY_KEY_REQUIRED"`).
- Server files: `services/backupCrypto.ts`, `backupEnvelope.ts`, `backupKeyring.ts`, `backupService.ts`, `backupValidation.ts`; `middleware/backupUnlock.ts`; `middleware/requireSuperAdmin.ts`. Backup/restore progress streams over **SSE**.
- Desktop files: `services/settings.ts` (SSE client), `services/sse.ts` (SSE parser), `pages/Settings.tsx` (UI: password gate, recovery-key modal, Backup Encryption card).

### Audit trail
- `AuditTrail` stores field-level JSON deltas (`changes` Json, `summary`) via `services/auditService.ts`. Every create/update/archive/login/restore logs an entry.

### Documents & issuance
- Issuance: resident (active only) → purpose → document type → editor/preview → issue → print.
- Document types live in the DB (`document_types`); the client templates are in `config/documents.tsx`. Required types are seeded as **system** rows by migration.
- **Purposes** come from `BarangaySetting.data.purposes` (Settings → Document Settings), fetched via `GET /settings` and shown in the Document Purpose dropdown (plus "Other").
- Issuing creates a `Document` + `Order` in one transaction (`orNumber`, `amount`). Printing uses `window.print()`; the code sets `document.title` to `"<Resident>_<DocType>_<date>"` for a meaningful Save-as-PDF name.
- The Document page lists residents via `GET /residents?status=Active` (server clamps `pageSize` to 100).

### Multi-device
- All clients share one MySQL DB via the server. TanStack Query revalidates on window focus and polls every 60s (`index.tsx`), so other PCs pick up changes within ~1 min or on focus. A restore hard-invalidates all sessions (re-login → fresh data).

## Data model (20 models)

`Block → Household → Family → FamilyMember → Resident`; `Family` has 1:1 `Address`,
optional `FamilyPet`/`FamilyVehicle`, and a head `Resident`. `Resident` ↔ 1:0..1 `Record`;
`Resident` 1:M `Order`. `Order` 1:1 `Document` → `DocumentType`, `Document` 1:M
`DocumentSigner` → `BarangayOfficial`. `User` 1:1 `UserInfo`, 1:M `Order`/`AuditTrail`.
Plus `BarangaySetting`, `SessionState`, `CryptoKeyring`.

Enums: `Sex` (`Male`/`Female`), `ResidentStatus` (`Alive`/`Deceased`/`MovedOut`).

Conventions: CUID ids, camelCase Prisma fields with `@map("snake_case")`,
`@@map("table")`, money `Decimal(10,2)`, FKs `{relation}Id`. Full detail: `.agent/rules/database-schema.mdc`.

## API conventions

- camelCase request/response fields; never leak DB snake_case.
- Paginated lists return `{ data, meta: { page, pageSize, total, totalPages } }`; server sanitizes `page`/`pageSize` (`pageSize` capped at 100).
- Errors: `{ "error": "message" }` with proper status (400/401/403/404/500). `errorHandler` respects `err.status`.
- Contract changes must update controller + route + frontend service + types together.
- Full spec: `.agent/rules/api-communication.mdc`.

## Frontend conventions

- Tailwind via **Play CDN** in `index.html`; **no CSS files / no config**. Style with utility classes.
- Icons: `lucide-react` only. Font: Inter.
- Server state via **TanStack Query** (`useQuery`/`useMutation`); do not hand-roll `useEffect` fetch. Service layer in `services/*.ts` stays the fetch layer.
- `HashRouter` (Electron `file://`). `@` alias → `packages/desktop/src/`.
- Detailed design system + query patterns: `.agent/rules/design-system.mdc`.

## Server conventions

- ESM with **`.js` extensions** in relative imports (`import { x } from "./y.js"`).
- `tsx watch` in dev; `tsc -p tsconfig.build.json` in build (excludes `*.test.ts` and `src/test`).
- Uses Node built-in `crypto` (no crypto deps).

## Testing

- **Vitest** in `@rbi/server` and `@rbi/desktop`. Run `pnpm test`.
- Server unit tests: `backupCrypto`, `backupEnvelope`, `backupValidation`, `sessionPolicy`, `backupUnlock`.
- Desktop unit tests: `sse`, `api`.
- DB-touching behavior is verified with temporary `tsx` scripts (create in `packages/server/src/scripts/`, run, then delete) — there is no DB test harness.
- Prefer TDD: write the failing test first, watch it fail, implement, watch it pass, and mutation-check that the test catches a regression.

## Gotchas / known issues

- **`pnpm build:server` currently fails** on two pre-existing type errors unrelated to current work:
  - `packages/server/src/controllers/householdController.ts:205` — `req.params.id` typed `string | string[]`.
  - `packages/server/src/controllers/userController.ts:81` — loose `req.body` spread into `prisma.user.create`.
  Dev (`tsx`), tests, and the app are unaffected.
- **Adding a Prisma model** requires updating `HANDLED_MODELS` in `backupService.ts` (compile-time guard) and deciding whether it is backed up or infra-excluded.
- **Migrations are data changes.** Do not run `prisma migrate dev` against a DB that has migrations not present in the checked-out branch (drift/reset risk). Use `migrate deploy` in production.
- **`pnpm db:seed`** upserts users `admin` / `johndoe` / `qa_admin` (resetting their passwords) and seeds document types. Default new-user password is `brgy418`.
- **Restore is destructive.** Other devices are logged out (session cutoff). Fresh installs need the recovery key. `CryptoKeyring`/`SessionState` are never in a backup.
- Recovery key loss + keyring loss = encrypted backups are unrecoverable. This is inherent; keep the key off-system.

## Deployment (LAN)

- Server is the only DB accessor; clients hit `http://<server-ip>:4000/api` (build-time `VITE_API_URL`).
- Express binds `0.0.0.0`. Open firewall TCP 4000. Run under **PM2** for persistence.
- On the server: `pnpm install`, set `.env` files, `pnpm db:migrate`/`migrate deploy`, `pnpm db:generate`.
- Full checklist: `.agent/rules/deployment-networking.mdc`.

## Workflow notes

- Feature work is often done on branches (`feature/...`) and merged to `main`; some changes are committed directly to `main`.
- Design specs and implementation plans for larger features live in `docs/superpowers/specs/` and `docs/superpowers/plans/`.

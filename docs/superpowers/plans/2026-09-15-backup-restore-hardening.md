# Backup & Restore Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing password-gated Backup & Restore feature with a transaction timeout, forced logout after restore, a pre-restore safety backup, type-to-confirm, backup metadata, and `createMany` bulk inserts — without changing any data relationships.

**Architecture:** Server work stays inside `packages/server/src/services/backupService.ts` and its pure sibling `backupValidation.ts`. Desktop work stays inside `packages/desktop/src/pages/Settings.tsx`, `services/settings.ts`, and the shared `components/ui/ConfirmationModal.tsx`. Every item is additive; no restore ordering or explicit-ID behavior changes.

**Tech Stack:** Express + Prisma + MySQL server; React 19 + Electron + TanStack Query + Tailwind desktop; Vitest (server only) for pure unit tests.

**Spec:** No separate spec doc (bounded change to an existing flow). Requirements are the Goal, Global Constraints, and per-task steps below.

## Global Constraints

- **Do NOT change** restore behavior for autoincrement `displayId`, `createdAt`, or `updatedAt`. They stay regenerated on restore.
- **Do NOT reorder** `RESTORE_STEPS`. Foreign-key order is: blocks → records → households → residents → addresses → families → barangayOfficials → users → documentTypes → documents → orders → auditTrails → settings.
- **Keep explicit IDs** on every re-created row (`id: x.id`) so relationships keep resolving.
- `createMany` is allowed **only** for: blocks, records, households, residents, barangayOfficials, orders, auditTrails. Leave addresses, documentTypes, families, users, documents on `create` (they need generated IDs for maps or have nested relations).
- Backup payload `version` stays `2`; `meta` is additive and ignored by restore.
- No new server runtime dependencies.
- Server verification command: `pnpm --filter @rbi/server test` and `pnpm --filter @rbi/server exec tsc -p tsconfig.build.json`.
- Desktop has no test framework; desktop tasks are verified by the manual steps listed in each task.
- Two pre-existing `tsc` errors (`householdController.ts`, `userController.ts`) are out of scope; a task is green when no *new* errors appear.

---

### Task 1: Restore transaction timeout

**Files:**
- Modify: `packages/server/src/services/backupService.ts:403`

**Interfaces:**
- Produces: constant `RESTORE_TRANSACTION_TIMEOUT_MS`, `RESTORE_TRANSACTION_MAX_WAIT_MS` (module-private).

- [ ] **Step 1: Add timeout constants**

Add near the top of `backupService.ts` (after the imports):

```ts
const RESTORE_TRANSACTION_TIMEOUT_MS = 120_000;
const RESTORE_TRANSACTION_MAX_WAIT_MS = 10_000;
```

- [ ] **Step 2: Apply them to the transaction**

Change the `applyBackup` transaction call so it passes options as the second argument:

```ts
  await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // ...existing body unchanged...
    },
    {
      timeout: RESTORE_TRANSACTION_TIMEOUT_MS,
      maxWait: RESTORE_TRANSACTION_MAX_WAIT_MS,
    }
  );
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @rbi/server exec tsc -p tsconfig.build.json`
Expected: only the two pre-existing errors; none in `backupService.ts`.

- [ ] **Step 4: Manual round-trip smoke test**

Temporarily add `packages/server/src/scripts/verifyRoundTrip.ts` (same script used previously), run `pnpm --filter @rbi/server exec tsx src/scripts/verifyRoundTrip.ts`, confirm `RESULT: ALL MATCH`, then delete the script and the `src/scripts` folder.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/backupService.ts
git commit -m "fix(backup): raise restore transaction timeout for growing datasets"
```

---

### Task 2: Backup metadata (server + desktop)

**Files:**
- Modify: `packages/server/src/services/backupValidation.ts` (add pure summarizer + type)
- Modify: `packages/server/src/services/backupService.ts` (include `meta` in payload)
- Modify: `packages/server/src/services/backupValidation.test.ts` (tests)
- Modify: `packages/desktop/src/services/settings.ts` (`BackupData.meta`)
- Modify: `packages/desktop/src/pages/Settings.tsx` (display + persist)

**Interfaces:**
- Produces: `BackupMeta { counts: Record<string, number>; total: number }` and `summarizeBackup(data: Record<string, any>): BackupMeta`.
- `BackupPayload` gains `meta: BackupMeta`.

- [ ] **Step 1: Write the failing tests**

Append to `packages/server/src/services/backupValidation.test.ts`:

```ts
import { summarizeBackup } from "./backupValidation.js";

describe("summarizeBackup", () => {
  it("counts arrays by length and singletons as one", () => {
    const meta = summarizeBackup({
      settings: { slogan: "x" },
      residents: [1, 2, 3],
      orders: [],
    });
    expect(meta.counts).toEqual({ settings: 1, residents: 3, orders: 0 });
    expect(meta.total).toBe(4);
  });

  it("returns zero for empty data", () => {
    const meta = summarizeBackup({});
    expect(meta.counts).toEqual({});
    expect(meta.total).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @rbi/server test`
Expected: FAIL — `summarizeBackup` is not exported / not a function.

- [ ] **Step 3: Implement the summarizer**

Add to `packages/server/src/services/backupValidation.ts`:

```ts
export interface BackupMeta {
  counts: Record<string, number>;
  total: number;
}

export function summarizeBackup(data: Record<string, any>): BackupMeta {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const [key, value] of Object.entries(data)) {
    const count = Array.isArray(value) ? value.length : value ? 1 : 0;
    counts[key] = count;
    total += count;
  }
  return { counts, total };
}
```

And extend the payload type:

```ts
export interface BackupPayload {
  version: number;
  exportedAt: string;
  data: Record<string, any>;
  meta: BackupMeta;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rbi/server test`
Expected: `Tests 14 passed (14)`.

- [ ] **Step 5: Include meta in the built backup**

In `backupService.ts`, import the summarizer and add `meta` to the return value:

```ts
import {
  BACKUP_VERSION,
  validateBackup,
  summarizeBackup,
  type BackupPayload,
} from "./backupValidation.js";
```

```ts
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    meta: summarizeBackup(data),
  };
```

Also re-export it: `export { BACKUP_VERSION, validateBackup, summarizeBackup };`

- [ ] **Step 6: Type-check the server**

Run: `pnpm --filter @rbi/server exec tsc -p tsconfig.build.json`
Expected: only the two pre-existing errors.

- [ ] **Step 7: Extend the desktop type**

In `packages/desktop/src/services/settings.ts`:

```ts
export interface BackupMeta {
  counts: Record<string, number>;
  total: number;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  data: Record<string, any>;
  meta?: BackupMeta;
}
```

- [ ] **Step 8: Persist and display metadata**

In `packages/desktop/src/pages/Settings.tsx`:

Add near the other state:

```tsx
const LAST_BACKUP_META_KEY = 'rbiLastBackupMeta';

interface BackupMetaDisplay {
  version: number;
  exportedAt: string;
  total: number;
}

const [lastBackupMeta, setLastBackupMeta] = useState<BackupMetaDisplay | null>(() => {
  const raw = localStorage.getItem(LAST_BACKUP_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackupMetaDisplay;
  } catch {
    return null;
  }
});
```

In `handleBackup`, after the download succeeds, store metadata:

```tsx
            const now = new Date();
            setLastBackup(now.toLocaleString());
            const meta: BackupMetaDisplay = {
              version: data.version,
              exportedAt: data.exportedAt,
              total: data.meta?.total ?? 0,
            };
            setLastBackupMeta(meta);
            localStorage.setItem(LAST_BACKUP_META_KEY, JSON.stringify(meta));
```

Replace the "Last Backup" box body (`Settings.tsx`, the `bg-gray-50 rounded-xl p-4` block) with:

```tsx
                                        <p className="text-sm font-bold text-gray-900">{lastBackup ?? 'No backup yet'}</p>
                                        {lastBackupMeta && (
                                            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                                                <p>Version {lastBackupMeta.version}</p>
                                                <p>Exported {new Date(lastBackupMeta.exportedAt).toLocaleString()}</p>
                                                <p>{lastBackupMeta.total} total records</p>
                                            </div>
                                        )}
```

- [ ] **Step 9: Manual verification**

Run `pnpm dev:server` and `pnpm dev:desktop`, unlock Backup & Restore, click **Download Backup**. Confirm the card now shows Version / Exported / total records, and that the downloaded JSON contains a `meta` object. Reload the app and confirm the metadata persists.

- [ ] **Step 10: Commit**

```bash
git add packages/server/src/services/backupValidation.ts packages/server/src/services/backupValidation.test.ts packages/server/src/services/backupService.ts packages/desktop/src/services/settings.ts packages/desktop/src/pages/Settings.tsx
git commit -m "feat(backup): include and display backup metadata"
```

---

### Task 3: Force logout after successful restore

**Files:**
- Modify: `packages/desktop/src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `useAuth().logout` from `@/context/AuthContext`.

- [ ] **Step 1: Import and use logout**

At the top of `Settings.tsx`:

```tsx
import { useAuth } from '@/context/AuthContext';
```

Inside the component:

```tsx
const { logout } = useAuth();
```

- [ ] **Step 2: Log out after restore success**

In `handleRestoreConfirm`, replace the success tail:

```tsx
            queryClient.invalidateQueries();
            clearBackupUnlock();
            setIsUnlocked(false);
            if (onShowSuccess) onShowSuccess('Data restored successfully. Please log in again.');
            if (setIsNavigationBlocked) setIsNavigationBlocked(false);
            setTimeout(() => logout(), 1200);
```

(The delay lets the success toast render before `App` redirects to `/login`.)

- [ ] **Step 3: Manual verification**

With the server + desktop running, restore a backup. Confirm the success toast appears, then the app returns to the login screen on its own, and the unlock token is cleared (re-entering Settings shows the tab locked).

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/pages/Settings.tsx
git commit -m "fix(backup): force logout after a successful restore"
```

---

### Task 4: Type-to-confirm on the destructive restore

**Files:**
- Modify: `packages/desktop/src/components/ui/ConfirmationModal.tsx`
- Modify: `packages/desktop/src/pages/Settings.tsx`

**Interfaces:**
- `ConfirmationModal` gains an optional `confirmPhrase?: string`. When set, Confirm is disabled until the typed text matches (case-sensitive).

- [ ] **Step 1: Add the confirm phrase to ConfirmationModal**

Change the imports:

```tsx
import React, { useEffect, useState } from 'react';
```

Add to the props interface:

```tsx
    confirmPhrase?: string;
```

Destructure it with a default:

```tsx
    variant = "danger",
    confirmPhrase,
```

Add state and a reset effect right after `if (!isOpen) return null;`:

```tsx
    const [phraseInput, setPhraseInput] = useState('');
    useEffect(() => {
        if (!isOpen) setPhraseInput('');
    }, [isOpen]);

    const phraseOk = !confirmPhrase || phraseInput === confirmPhrase;
```

Render the input between the Body and Footer:

```tsx
                {confirmPhrase && (
                    <div className="px-6 pb-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            Type <span className="font-bold text-gray-900">{confirmPhrase}</span> to confirm
                        </label>
                        <input
                            value={phraseInput}
                            onChange={(e) => setPhraseInput(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                            placeholder={confirmPhrase}
                        />
                    </div>
                )}
```

Disable the confirm button when the phrase is wrong:

```tsx
                    <button
                        onClick={onConfirm}
                        disabled={isLoading || !phraseOk}
                        className={`px-4 py-2.5 rounded-lg ${styles.confirmBg} text-white font-bold text-[14px] transition-colors shadow-lg ${styles.confirmShadow} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
```

- [ ] **Step 2: Use it on the restore modal**

In `Settings.tsx`, the restore `ConfirmationModal` becomes:

```tsx
                            <ConfirmationModal
                                isOpen={showRestoreConfirm}
                                onClose={() => { setShowRestoreConfirm(false); setPendingRestoreFile(null); }}
                                onConfirm={handleRestoreConfirm}
                                title="Restore Backup?"
                                message={`This will overwrite all current data with the contents of "${pendingRestoreFile?.name}". This action cannot be undone. Continue?`}
                                confirmPhrase="RESTORE"
                                confirmText="Restore"
                            />
```

- [ ] **Step 3: Manual verification**

Open the restore confirmation. Confirm the **Restore** button is disabled until `RESTORE` is typed exactly; a wrong/partial phrase keeps it disabled. Confirm the normal unsaved-changes modal (App.tsx) is unaffected (no input, confirm enabled).

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/components/ui/ConfirmationModal.tsx packages/desktop/src/pages/Settings.tsx
git commit -m "feat(backup): require typing RESTORE to confirm a restore"
```

---

### Task 5: Automatic pre-restore safety backup

**Files:**
- Modify: `packages/desktop/src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `settingsService.backupWithProgress` (already exists).
- Extends the local `progressModal` state with an optional `label`.

- [ ] **Step 1: Allow a custom progress label**

Change the `progressModal` state type:

```tsx
    const [progressModal, setProgressModal] = useState<{ type: 'backup' | 'restore'; progress: ProgressUpdate | null; label?: string } | null>(null);
```

In the progress modal JSX, use the label when present:

```tsx
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {progressModal.label ?? (progressModal.type === 'backup' ? 'Backing Up Data' : 'Restoring Data')}
                                            </h3>
```

- [ ] **Step 2: Download a safety copy before restoring**

At the start of `handleRestoreConfirm` (after the `pendingRestoreFile` guard, before parsing the file), add:

```tsx
        setProgressModal({ type: 'backup', progress: null, label: 'Saving safety backup...' });
        try {
            const safety = await settingsService.backupWithProgress((update) => {
                setProgressModal((prev) => prev ? { ...prev, progress: update } : null);
            });
            const blob = new Blob([JSON.stringify(safety, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rbi-pre-restore-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setProgressModal(null);
            setIsRestoreRunning(false);
            setPendingRestoreFile(null);
            if (onShowSuccess) onShowSuccess(`Restore cancelled: could not save safety backup (${err?.message || 'unknown error'})`);
            return;
        }
```

Then the existing restore flow continues (it already sets `{ type: 'restore', progress: null }`).

- [ ] **Step 3: Manual verification**

Restore a file. Confirm a `rbi-pre-restore-<date>.json` downloads first (progress shows "Saving safety backup..."), then the restore progress runs. Simulate a safety-backup failure (e.g., stop the server mid-flow) and confirm the restore aborts with a message and does **not** wipe data.

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/pages/Settings.tsx
git commit -m "feat(backup): auto-download a safety backup before restore"
```

---

### Task 6: `createMany` for the flat tables

**Files:**
- Modify: `packages/server/src/services/backupService.ts` (`RESTORE_STEPS`)

**Interfaces:**
- No interface changes; same `RESTORE_STEPS` shape and order.

- [ ] **Step 1: Convert the safe steps**

Replace the body of these steps with a single `createMany` (leave addresses, families, users, documentTypes, documents unchanged):

```ts
  {
    label: "Restoring blocks...",
    run: async (tx, data) => {
      if (data.blocks?.length) {
        await tx.block.createMany({
          data: data.blocks.map((b: any) => ({ id: b.id, blockNumber: b.blockNumber })),
        });
      }
    },
  },
  {
    label: "Restoring records...",
    run: async (tx, data) => {
      if (data.records?.length) {
        await tx.record.createMany({
          data: data.records.map((r: any) => ({
            id: r.id,
            hasRecord: r.hasRecord,
            recordDate: r.recordDate ? new Date(r.recordDate) : null,
            description: r.description,
          })),
        });
      }
    },
  },
  {
    label: "Restoring households...",
    run: async (tx, data) => {
      if (data.households?.length) {
        await tx.household.createMany({
          data: data.households.map((h: any) => ({
            id: h.id,
            brgyHouseholdNo: h.brgyHouseholdNo,
            blockId: h.blockId,
          })),
        });
      }
    },
  },
  {
    label: "Restoring residents...",
    run: async (tx, data) => {
      if (data.residents?.length) {
        await tx.resident.createMany({
          data: data.residents.map((r: any) => ({
            id: r.id,
            lastName: r.lastName,
            firstName: r.firstName,
            middleName: r.middleName,
            suffix: r.suffix,
            placeOfBirth: r.placeOfBirth,
            dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth) : null,
            sex: r.sex,
            civilStatus: r.civilStatus,
            isVoter: r.isVoter,
            isPwd: r.isPwd,
            isSoloParent: r.isSoloParent,
            isOwner: r.isOwner,
            studentType: r.studentType,
            statusType: r.statusType,
            contactNumber: r.contactNumber,
            occupationType: r.occupationType,
            profileImage: r.profileImage,
            recordId: r.recordId,
          })),
        });
      }
    },
  },
  {
    label: "Restoring barangay officials...",
    run: async (tx, data) => {
      if (data.barangayOfficials?.length) {
        await tx.barangayOfficial.createMany({
          data: data.barangayOfficials.map((o: any) => ({
            id: o.id,
            firstName: o.firstName,
            lastName: o.lastName,
            roleType: o.roleType,
          })),
        });
      }
    },
  },
  {
    label: "Restoring orders...",
    run: async (tx, data) => {
      if (data.orders?.length) {
        await tx.order.createMany({
          data: data.orders.map((o: any) => ({
            id: o.id,
            orNumber: o.orNumber,
            orderDate: new Date(o.orderDate),
            amount: o.amount,
            userId: o.userId,
            residentId: o.residentId,
            documentId: o.documentId,
          })),
        });
      }
    },
  },
  {
    label: "Restoring activity logs...",
    run: async (tx, data) => {
      if (data.auditTrails?.length) {
        await tx.auditTrail.createMany({
          data: data.auditTrails.map((log: any) => ({
            id: log.id,
            tableName: log.tableName,
            recordId: log.recordId,
            actionType: log.actionType,
            timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
            ...(log.changes != null ? { changes: log.changes } : {}),
            summary: log.summary,
            userId: log.userId,
          })),
        });
      }
    },
  },
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @rbi/server exec tsc -p tsconfig.build.json`
Expected: only the two pre-existing errors.

- [ ] **Step 3: Round-trip verification (counts + relationships)**

Re-add the temporary `verifyRoundTrip.ts` and `verifyFields.ts` scripts (as used previously), run both, and confirm:
- `RESULT: ALL MATCH` and `RESULT: ALL FIELDS MATCH`.
- Specifically: `familyMembers: before=10 after=10`, `ordersWithDocument: 30`, `uniqueOrNumbers: 30` — proving head↔member and order links survived. Then delete the scripts and the `src/scripts` folder.

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/services/backupService.ts
git commit -m "perf(backup): bulk-insert flat tables on restore with createMany"
```

---

## Self-Review

**Spec coverage:** (1) transaction timeout → Task 1; (2) forced logout → Task 3; (3) pre-restore safety backup → Task 5; (4) metadata → Task 2; (5) type-to-confirm → Task 4; (6) createMany → Task 6. All six recommendations covered.

**Placeholder scan:** No TBD/TODO; every code step contains concrete code. Manual verification for DB/UI tasks is explicit (desktop has no test framework).

**Type consistency:** `BackupMeta`/`summarizeBackup` defined in Task 2 and used in `BackupPayload` and the desktop `BackupData.meta` in the same task; `confirmPhrase` defined and consumed in Task 4; `progressModal.label` defined and consumed in Task 5. `RESTORE_STEPS` shape unchanged in Task 6.

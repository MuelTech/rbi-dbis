# FTJS + Document Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **User preference override:** Before execution, **ask the user** to choose inline vs agent-driven (or other). **Do not default.** If tools are denied, report blocked — do not invent system state.

**Goal:** Issue RA 11261 FTJS CERT1 with once-only + reprint validity rules, implement Barangay Clearance template, align Business Clearance copy, and remove document types that have no real template.

**Architecture:** Follow the Certificate of Indigency pattern: React template + `config/documents.tsx` fields + DB `DocumentType` + Document issuance. FTJS rules live server-side (status + create guard); reprint uses the existing document without a new Order. No new Prisma model.

**Tech Stack:** React 19 + Tailwind Play CDN, Express 5 ESM, Prisma 6 / MariaDB, TanStack Query 5, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-17-ftjs-and-document-types-design.md`

## Global Constraints

- Branch: `feature/ftjs-document-types` (already created on main worktree — user approved)
- FTJS type name (exact): `Barangay Certificate (FTJS)`
- Config id: `barangay-certificate-ftjs`
- FTJS amount: `0`
- FTJS validity default: **issue date + 1 year**
- CERT2: paper only — no digital type, no oath checkbox
- Delete/hide: `Certificate of Residency`, `Business Permit` — hide in UI/seed; hard-delete only if zero Document references
- Assets: `packages/desktop/src/assets/` only — do not create repo-root `assets/`
- Server relative imports use `.js` extensions
- Frontend: Tailwind utilities only, `lucide-react` icons, TanStack Query for server state
- Types matched by **documentName** string between DB and config
- `pnpm test` must pass for touched packages
- Do **not** commit/push unless user explicitly asks
- Do **not** kill node processes
- At implementation start: ask execution mode (inline vs other)

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/server/src/services/ftjsPolicy.ts` | Pure helpers: type name, validity date, status shape, guard decision |
| `packages/server/src/controllers/documentController.ts` | `getFtjsStatus`, FTJS guard in `createDocument` |
| `packages/server/src/routes/documents.ts` | `GET /documents/ftjs-status` |
| `packages/server/src/services/ftjsPolicy.test.ts` | Unit tests for policy helpers |
| `packages/desktop/src/services/documents.ts` | `getFtjsStatus`, payload types include `validityPeriod` |
| `packages/desktop/src/components/templates/FtjsCertificateTemplate.tsx` | CERT1 printable |
| `packages/desktop/src/components/templates/BarangayClearanceTemplate.tsx` | Clearance printable |
| `packages/desktop/src/components/templates/BusinessClearanceTemplate.tsx` | Official-form copy alignment |
| `packages/desktop/src/components/templates/BusinessPermitTemplate.tsx` | Remove if unused (Task 7) |
| `packages/desktop/src/config/documents.tsx` | Field configs + template wiring |
| `packages/desktop/src/pages/Document.tsx` | Dropdown from configs; FTJS status/reprint; send validityPeriod |
| `packages/db/prisma/seed.ts` | Add FTJS; remove obsolete type names |
| `packages/db/prisma/migrations/<new>` | Seed/system-type adjustments |

---

### Task 1: FTJS policy helpers + unit tests (server)

**Files:**
- Create: `packages/server/src/services/ftjsPolicy.ts`
- Test: `packages/server/src/services/ftjsPolicy.test.ts`

**Interfaces:**
- Produces:
  - `FTJS_DOCUMENT_NAME = "Barangay Certificate (FTJS)"`
  - `computeFtjsValidUntil(issueDate: Date): Date` — issue date + 1 year
  - `isFtjsStillValid(validUntil: Date, now?: Date): boolean`
  - `formatDateLong(d: Date): string` — e.g. `January 28, 2027`
  - `type FtjsStatus { hasFtjs: boolean; documentId?: string; issueDate?: string; validUntil?: string; isValid?: boolean; orNumber?: string | null; formData?: Record<string, unknown> | null; purpose?: string | null }`

- [ ] **Step 1: Write failing tests**

```ts
// packages/server/src/services/ftjsPolicy.test.ts
import { describe, it, expect } from "vitest";
import {
  FTJS_DOCUMENT_NAME,
  computeFtjsValidUntil,
  isFtjsStillValid,
  formatDateLong,
} from "./ftjsPolicy.js";

describe("ftjsPolicy", () => {
  it("exports exact document type name", () => {
    expect(FTJS_DOCUMENT_NAME).toBe("Barangay Certificate (FTJS)");
  });

  it("computes validUntil as issue date + 1 year", () => {
    const issue = new Date("2026-01-28T00:00:00.000Z");
    const valid = computeFtjsValidUntil(issue);
    expect(valid.toISOString().slice(0, 10)).toBe("2027-01-28");
  });

  it("handles leap day issue date", () => {
    const issue = new Date("2024-02-29T00:00:00.000Z");
    const valid = computeFtjsValidUntil(issue);
    // JS Date rolls Mar 1 on non-leap +1y years; accept 2025-03-01
    expect(valid.toISOString().slice(0, 10)).toBe("2025-03-01");
  });

  it("isValid true on boundary day and false after", () => {
    const validUntil = new Date("2027-01-28T00:00:00.000Z");
    expect(isFtjsStillValid(validUntil, new Date("2027-01-28T12:00:00.000Z"))).toBe(true);
    expect(isFtjsStillValid(validUntil, new Date("2027-01-29T00:00:00.000Z"))).toBe(false);
  });

  it("formats long dates", () => {
    expect(formatDateLong(new Date("2027-01-28T00:00:00.000Z"))).toBe("January 28, 2027");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter @rbi/server exec vitest run src/services/ftjsPolicy.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement helpers**

```ts
// packages/server/src/services/ftjsPolicy.ts
export const FTJS_DOCUMENT_NAME = "Barangay Certificate (FTJS)";

export type FtjsStatus = {
  hasFtjs: boolean;
  documentId?: string;
  issueDate?: string;
  validUntil?: string;
  isValid?: boolean;
  orNumber?: string | null;
  formData?: Record<string, unknown> | null;
  purpose?: string | null;
};

export function computeFtjsValidUntil(issueDate: Date): Date {
  const d = new Date(issueDate.getTime());
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function isFtjsStillValid(validUntil: Date, now: Date = new Date()): boolean {
  const end = new Date(validUntil.getTime());
  end.setHours(23, 59, 59, 999);
  return now.getTime() <= end.getTime();
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm --filter @rbi/server exec vitest run src/services/ftjsPolicy.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/ftjsPolicy.ts packages/server/src/services/ftjsPolicy.test.ts
git commit -m "feat(server): add FTJS policy helpers for validity rules"
```

---

### Task 2: FTJS status endpoint + create guard

**Files:**
- Modify: `packages/server/src/controllers/documentController.ts`
- Modify: `packages/server/src/routes/documents.ts`

**Interfaces:**
- Consumes: `FTJS_DOCUMENT_NAME`, `computeFtjsValidUntil`, `isFtjsStillValid`, `FtjsStatus` from `ftjsPolicy.js`
- Produces:
  - `GET /api/documents/ftjs-status?residentId=` → `FtjsStatus`
  - `POST /api/documents` returns `409` `{ error: "..." }` when FTJS already exists for resident

- [ ] **Step 1: Add controller functions**

In `documentController.ts`, add imports:

```ts
import {
  FTJS_DOCUMENT_NAME,
  computeFtjsValidUntil,
  isFtjsStillValid,
  formatDateLong,
  type FtjsStatus,
} from "../services/ftjsPolicy.js";
```

Add `getFtjsStatus`:

```ts
export async function getFtjsStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const residentId = req.query.residentId as string | undefined;
    if (!residentId) {
      res.json({ hasFtjs: false } satisfies FtjsStatus);
      return;
    }

    const type = await prisma.documentType.findFirst({
      where: { documentName: FTJS_DOCUMENT_NAME },
    });
    if (!type) {
      res.json({ hasFtjs: false } satisfies FtjsStatus);
      return;
    }

    const doc = await prisma.document.findFirst({
      where: {
        documentTypeId: type.id,
        order: { residentId },
      },
      include: { order: true },
      orderBy: { issueDate: "desc" },
    });

    if (!doc) {
      res.json({ hasFtjs: false } satisfies FtjsStatus);
      return;
    }

    const formData = (doc.formData ?? {}) as Record<string, unknown>;
    const rawValid =
      (typeof formData.validUntil === "string" && formData.validUntil) ||
      doc.validityPeriod ||
      null;

    let validUntilDate: Date | null = null;
    if (rawValid) {
      const parsed = new Date(rawValid);
      if (!Number.isNaN(parsed.getTime())) validUntilDate = parsed;
    }
    if (!validUntilDate) {
      validUntilDate = computeFtjsValidUntil(doc.issueDate);
    }

    res.json({
      hasFtjs: true,
      documentId: doc.id,
      issueDate: doc.issueDate.toISOString(),
      validUntil: validUntilDate.toISOString(),
      isValid: isFtjsStillValid(validUntilDate),
      orNumber: doc.order?.orNumber ?? null,
      formData,
      purpose: doc.purpose,
    } satisfies FtjsStatus);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Guard `createDocument`**

Inside `createDocument`, after document type is loaded (~line 163), insert:

```ts
    const isFtjs = documentType.documentName === FTJS_DOCUMENT_NAME;
    if (isFtjs) {
      const existing = await prisma.document.findFirst({
        where: {
          documentTypeId: documentType.id,
          order: { residentId },
        },
        select: { id: true },
      });
      if (existing) {
        return res.status(409).json({
          error:
            "FTJS certificate already issued for this resident. Reprint is allowed only while still valid; a new availment is not allowed.",
        });
      }
    }
```

In the transaction create for Document, when FTJS, set validity:

```ts
      const issueDate = new Date();
      let storedValidity: string | null = validityPeriod || null;
      if (isFtjs) {
        const until = computeFtjsValidUntil(issueDate);
        storedValidity = until.toISOString().slice(0, 10);
        const bodyForm = (formData ?? {}) as Record<string, unknown>;
        if (!bodyForm.validUntil) {
          bodyForm.validUntil = storedValidity;
        }
      }

      const document = await tx.document.create({
        data: {
          issueDate,
          purpose: purpose || null,
          validityPeriod: storedValidity,
          formData: formData || null,
          documentTypeId,
        },
      });
```

If FTJS mutated `formData` object, assign the updated object into create (use local `const formPayload = ...` and pass `formData: formPayload`).

- [ ] **Step 3: Register route**

In `packages/server/src/routes/documents.ts`:

```ts
import {
  // ...existing
  getFtjsStatus,
} from "../controllers/documentController.js";

documentRouter.get("/ftjs-status", getFtjsStatus);
```

Place **before** any `/:id` route if present.

- [ ] **Step 4: Typecheck server package**

```bash
pnpm --filter @rbi/server exec tsc -p tsconfig.build.json --noEmit
```

Expected: may still show **pre-existing** errors in `householdController.ts` / `userController.ts` (known). No **new** errors in `documentController.ts` / `ftjsPolicy.ts`.

- [ ] **Step 5: Run server tests**

```bash
pnpm --filter @rbi/server test
```

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/controllers/documentController.ts packages/server/src/routes/documents.ts
git commit -m "feat(server): FTJS status endpoint and once-only create guard"
```

---

### Task 3: Desktop documents service

**Files:**
- Modify: `packages/desktop/src/services/documents.ts`

**Interfaces:**
- Produces:
  - `FtjsStatus` type (mirror server)
  - `documentsService.getFtjsStatus(residentId: string)`
  - `CreateDocumentPayload.validityPeriod` already exists — callers must pass it for FTJS

- [ ] **Step 1: Add types + method**

```ts
export interface FtjsStatus {
  hasFtjs: boolean;
  documentId?: string;
  issueDate?: string;
  validUntil?: string;
  isValid?: boolean;
  orNumber?: string | null;
  formData?: Record<string, any> | null;
  purpose?: string | null;
}
```

```ts
  getFtjsStatus: async (residentId: string): Promise<FtjsStatus> => {
    return api.get(`/documents/ftjs-status?residentId=${encodeURIComponent(residentId)}`);
  },
```

Also extend `getLastDocument` return type usage if needed — optional `validityPeriod` in responses later; not required if FTJS uses status endpoint.

- [ ] **Step 2: Desktop unit tests if api mock pattern exists**

If `packages/desktop` has service tests for `api.get`, add a small test that `getFtjsStatus` hits the correct path. If no established mock harness, skip automated test and verify via app later.

```bash
pnpm --filter @rbi/desktop test
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/documents.ts
git commit -m "feat(desktop): add getFtjsStatus service"
```

---

### Task 4: FTJS CERT1 template + config

**Files:**
- Create: `packages/desktop/src/components/templates/FtjsCertificateTemplate.tsx`
- Modify: `packages/desktop/src/config/documents.tsx`

**Interfaces:**
- Consumes: `Letterhead`, `DocumentConfig` fields pattern from Indigency
- Produces: config name `Barangay Certificate (FTJS)` with fields used by Document.tsx preview

- [ ] **Step 1: Create template**

```tsx
// packages/desktop/src/components/templates/FtjsCertificateTemplate.tsx
import React from 'react';
import Letterhead from '@/components/templates/Letterhead';

const FtjsCertificateTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    selectedResident,
    age,
    civilStatus,
    address,
    yearsOfResidency,
    validUntil,
    witnessName,
    barangayName,
    punongBarangay,
    secretary,
    issueDay,
    issueMonth,
    issueYear,
    orNumber,
  } = data;

  const witness = witnessName || secretary || '';

  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      <Letterhead barangayName={barangayName} />

      <div className="relative px-[20mm] pb-[20mm]">
        <div className="text-center mb-10 mt-6">
          <h2 className="text-[18pt] font-serif font-bold uppercase tracking-wide">
            Barangay Certificate
          </h2>
          <p className="text-[12pt] font-serif mt-1">
            (First Time Jobseeker Assistance Act. RA 11261)
          </p>
        </div>

        <div className="mb-8">
          <p className="text-[12pt] font-bold uppercase">To Whom It May Concern:</p>
        </div>

        <div className="space-y-6 text-[12pt] leading-loose">
          <p className="indent-12">
            This is to certify that{' '}
            <span className="font-bold underline">{selectedResident || '________________'}</span>,{' '}
            <span className="font-bold">{age || '__'} years old</span>,{' '}
            {civilStatus || '________'}, a resident of{' '}
            <span className="font-bold">{address || '________________'}</span>, for{' '}
            <span className="font-bold">{yearsOfResidency || '__'} year/s</span> is a qualified
            availee of RA 11261 or the First Time Jobseeker Act of 2019.
          </p>

          <p className="indent-12">
            I further certify that the holder/bearer was informed of her/his rights, including the
            duties and responsibilities accorded by RA 11261 through the Oath of Undertaking
            she/he has signed and executed in the presence of our Barangay Official.
          </p>

          <p className="indent-12">
            Signed this <span className="font-bold">{issueDay || '____'}</span> day of{' '}
            <span className="font-bold underline">{issueMonth || '__________'}</span>,{' '}
            <span className="font-bold">{issueYear || '2026'}</span> in Barangay 418 zone 43,
            District IV, Metro Manila, Philippines.
          </p>

          <p className="indent-12">
            This certification is valid only until{' '}
            <span className="font-bold underline">{validUntil || '________________'}</span>.
          </p>
        </div>

        <div className="mt-16 flex justify-end">
          <div className="w-[280px] text-center space-y-6">
            <div>
              <p className="text-[12pt] font-bold uppercase underline underline-offset-4">
                {punongBarangay || 'AMELIA V. ARELLANO'}
              </p>
              <p className="text-[11pt] uppercase mt-1">Barangay Chairwoman</p>
            </div>
            <div>
              <p className="text-[12pt] font-bold underline underline-offset-4">
                {data.issueDateDisplay || '________________'}
              </p>
              <p className="text-[11pt] mt-1">Date</p>
            </div>
            <div className="text-left pt-4">
              <p className="text-[12pt]">Witnessed by:</p>
              <p className="text-[12pt] font-bold underline underline-offset-4 mt-6">
                {witness || '________________'}
              </p>
              <p className="text-[11pt] mt-1">Barangay Secretary</p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-[10pt] font-mono">
          OR No.: {orNumber || '2026-418-________'}
        </div>
      </div>
    </div>
  );
};

export default FtjsCertificateTemplate;
```

- [ ] **Step 2: Wire config**

In `documents.tsx`:

```tsx
import FtjsCertificateTemplate from '@/components/templates/FtjsCertificateTemplate';
```

Add entry (replace nothing yet — insert before closing of array):

```tsx
  {
    id: 'barangay-certificate-ftjs',
    name: 'Barangay Certificate (FTJS)',
    Template: FtjsCertificateTemplate,
    fields: [
      {
        key: 'age',
        label: 'Age',
        type: 'text',
        source: 'input',
        required: true,
        width: 'half',
      },
      {
        key: 'civilStatus',
        label: 'Civil Status',
        type: 'select',
        source: 'input',
        options: ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'],
        defaultValue: 'Single',
        width: 'half',
      },
      {
        key: 'address',
        label: 'Resident Address',
        type: 'text',
        source: 'input',
        residentAttribute: 'address',
        required: true,
        width: 'full',
      },
      {
        key: 'yearsOfResidency',
        label: 'Years of Residency',
        type: 'text',
        source: 'input',
        required: true,
        width: 'half',
      },
      {
        key: 'validUntil',
        label: 'Valid Until',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. January 28, 2027',
        width: 'half',
      },
      {
        key: 'witnessName',
        label: 'Barangay Secretary (Witness)',
        type: 'text',
        source: 'input',
        width: 'full',
      },
    ],
  },
```

- [ ] **Step 3: Desktop tests / typecheck**

```bash
pnpm --filter @rbi/desktop test
```

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/components/templates/FtjsCertificateTemplate.tsx packages/desktop/src/config/documents.tsx
git commit -m "feat(desktop): FTJS CERT1 template and document config"
```

---

### Task 5: Barangay Clearance template + config

**Files:**
- Create: `packages/desktop/src/components/templates/BarangayClearanceTemplate.tsx`
- Modify: `packages/desktop/src/config/documents.tsx`

**Interfaces:**
- Consumes: Letterhead, Indigency-like fields
- Produces: real template replacing Coming Soon for `Barangay Clearance`

- [ ] **Step 1: Create template** (based on `BC 2023 Ch Amy.pdf`)

```tsx
// packages/desktop/src/components/templates/BarangayClearanceTemplate.tsx
import React from 'react';
import Letterhead from '@/components/templates/Letterhead';

const BarangayClearanceTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    selectedResident,
    address,
    purpose,
    day,
    month,
    year,
    barangayName,
    punongBarangay,
    orNumber,
  } = data;

  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      <Letterhead barangayName={barangayName} />
      <div className="relative px-[20mm] pb-[20mm]">
        <div className="text-center mb-10 mt-6">
          <h2 className="text-[18pt] font-serif font-bold uppercase tracking-widest">
            Barangay Certificate
          </h2>
        </div>

        <div className="mb-8">
          <p className="text-[12pt] font-bold uppercase">To Whom It May Concern:</p>
        </div>

        <div className="space-y-6 text-[12pt] leading-loose">
          <p className="indent-8">
            <span className="font-bold">THIS IS TO CERTIFY</span> that{' '}
            <span className="font-bold uppercase">
              {selectedResident || '________________'}
            </span>{' '}
            is a bonafide resident of Barangay 418, Zone 43 with residence and postal address{' '}
            <span className="font-bold">{address || '________________'}</span>.
          </p>
          <p className="indent-8">
            She/he are person of good moral character and a law-abiding citizen of Barangay 418,
            Zone 43. As per record, has no derogatory, no criminal record has been filed against
            him/her in the barangay as of this date.
          </p>
          <p className="indent-8">
            This certification is being issued upon the request of the person mentioned above, for{' '}
            <span className="font-bold uppercase">{purpose || '________________'}</span>.
          </p>
          <p className="indent-8">
            Done in the City of Manila this{' '}
            <span className="font-bold">{day || '_____'}</span> day of{' '}
            <span className="font-bold">{month || '__________'}</span>,{' '}
            <span className="font-bold">{year || '2026'}</span>.
          </p>
        </div>

        <div className="mt-16 flex justify-end">
          <div className="text-center w-[260px]">
            <p className="text-[12pt] font-bold uppercase mb-2">Attested by:</p>
            <p className="text-[12pt] font-bold uppercase underline underline-offset-4">
              {punongBarangay || 'AMELIA V. ARELLANO'}
            </p>
            <p className="text-[11pt] uppercase mt-1">Punong Barangay</p>
          </div>
        </div>

        <div className="mt-14 space-y-1 text-[11pt] uppercase">
          <p>Not valid for any loan</p>
          <p>Not valid without barangay seal</p>
          <p>Valid for six months upon date issued</p>
          <p className="font-mono text-[10pt] normal-case">
            OR No.: {orNumber || '2026-418-________'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarangayClearanceTemplate;
```

- [ ] **Step 2: Replace placeholder config**

Remove the Coming Soon `Barangay Clearance` entry and replace with:

```tsx
  {
    id: 'barangay-clearance',
    name: 'Barangay Clearance',
    Template: BarangayClearanceTemplate,
    fields: [
      {
        key: 'address',
        label: 'Residence / Postal Address',
        type: 'text',
        source: 'input',
        residentAttribute: 'address',
        required: true,
        width: 'full',
      },
      {
        key: 'purpose',
        label: 'Purpose',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. LOCAL EMPLOYMENT',
        required: true,
        width: 'full',
      },
      {
        key: 'day',
        label: 'Day',
        type: 'text',
        source: 'input',
        width: 'half',
      },
      {
        key: 'month',
        label: 'Month',
        type: 'text',
        source: 'input',
        width: 'half',
      },
      {
        key: 'year',
        label: 'Year',
        type: 'text',
        source: 'input',
        defaultValue: '2026',
        width: 'half',
      },
    ],
  },
```

Import `BarangayClearanceTemplate`.

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/templates/BarangayClearanceTemplate.tsx packages/desktop/src/config/documents.tsx
git commit -m "feat(desktop): Barangay Clearance printable template"
```

---

### Task 6: Business Clearance copy + drop Business Permit from UI/config

**Files:**
- Modify: `packages/desktop/src/components/templates/BusinessClearanceTemplate.tsx`
- Modify: `packages/desktop/src/config/documents.tsx`
- Delete (later task with seed): config entry for Business Permit; remove unused template file when confirmed unused

**Interfaces:**
- Produces: Business Clearance body matches official BPLO sample; config no longer lists Business Permit

- [ ] **Step 1: Align Business Clearance body**

Update body paragraphs in `BusinessClearanceTemplate.tsx` to official sample wording:

```tsx
        <div className="mb-8">
          <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
            THIS IS TO CERTIFY that Mr./Mrs.{' '}
            <span className="font-bold uppercase">{selectedResident || 'OWNER NAME'}</span>, owner
            of a <span className="font-bold uppercase">{natureOfBusiness || businessName || 'BUSINESS'}</span>{' '}
            with business address located at{' '}
            <span className="font-bold">{businessAddress || 'BUSINESS ADDRESS'}</span> under the
            trade name{' '}
            <span className="font-bold uppercase">{businessName || 'TRADE NAME'}</span> were
            allowed to operate its business/ activity within the jurisdiction of{' '}
            <span className="font-bold uppercase">{barangayName || 'BARANGAY 418'} ZONE 43</span>,
            pursuant to provision of Section 162, Republic Act No. 7160 otherwise known as THE
            LOCAL GOVERNMENT CODE OF 1991.
          </p>
          <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
            “Failure to comply with the requirements of the City Government of Manila shall cause
            this clearance to be revoke and cancelled.”
          </p>
          <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
            This Business Clearance is issued upon the request of the owner for Business Permit and
            Licensing Office only.
          </p>
          {/* keep existing issued-date + validUntil + attestation + OR/footer patterns */}
```

Ensure footer includes: `NOT VALID WITHOUT BARANGAY SEAL` and OR No. Keep signature block.

- [ ] **Step 2: Remove Business Permit from config array**

Delete the `id: 'business-permit'` entry from `documentConfigs` in `documents.tsx` and remove `BusinessPermitTemplate` import if unused.

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/templates/BusinessClearanceTemplate.tsx packages/desktop/src/config/documents.tsx
git commit -m "feat(desktop): align Business Clearance copy; drop Business Permit config"
```

---

### Task 7: Document page — dropdown, FTJS UX, validityPeriod

**Files:**
- Modify: `packages/desktop/src/pages/Document.tsx`

**Interfaces:**
- Consumes: `getDocumentConfig` / `documentConfigs`, `documentsService.getFtjsStatus`, settings `secretary`
- Produces: no Certificate of Residency / Business Permit in dropdown; FTJS reprint flow; create sends `validityPeriod`

- [ ] **Step 1: Drive document type options from configs + DB intersection**

Replace hardcoded dropdown options:

```tsx
options={documentConfigs
  .map((c) => c.name)
  .filter((name) =>
    docTypes?.some((dt) => dt.documentName === name) || name === 'Barangay Certificate (FTJS)'
  )}
```

Better: filter to names that exist in **both** config and DB after seed, **or** config-only if DB not yet migrated — prefer:

```tsx
const selectableDocTypes = React.useMemo(() => {
  const configNames = documentConfigs.map((c) => c.name);
  if (!docTypes?.length) return configNames;
  return configNames.filter((name) =>
    docTypes.some((dt) => dt.documentName === name)
  );
}, [docTypes]);
```

Import `documentConfigs` from `@/config/documents`.

Ensure list no longer contains `Certificate of Residency` or `Business Permit` once those configs are removed.

- [ ] **Step 2: Prefill secretary / date fields for FTJS**

In `handleProceed` initialData, add:

```tsx
      secretary: settings.secretary || '',
      witnessName: settings.secretary || '',
```

When building defaults after selecting resident, if config has `validUntil` and type is FTJS:

```tsx
    const issueDate = new Date();
    if (documentType === 'Barangay Certificate (FTJS)') {
      const until = new Date(issueDate.getTime());
      until.setFullYear(until.getFullYear() + 1);
      initialData.validUntil = until.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      initialData.issueDateDisplay = issueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      initialData.issueDay = String(issueDate.getUTCDate());
      initialData.issueMonth = issueDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
      initialData.issueYear = String(issueDate.getUTCFullYear());
    }
```

Similar day/month/year defaults help Barangay Clearance.

- [ ] **Step 3: FTJS status check on proceed**

```tsx
    if (documentType === 'Barangay Certificate (FTJS)') {
      try {
        const status = await documentsService.getFtjsStatus(selectedResidentId);
        if (status.hasFtjs) {
          setFtjsStatus(status);
          if (status.isValid) {
            // Reprint path: load existing formData for preview; do not go to blank issue editor
            if (status.formData) {
              setFormData(prev => ({
                ...prev,
                ...status.formData,
                selectedResident: getFullName(resident),
                documentTypeId: dbDocType.id,
                purpose: purpose === 'Other' ? otherPurpose : purpose,
                barangayName: settings.barangayName,
                municipality: settings.municipality,
                province: settings.province,
                punongBarangay: settings.punongBarangay,
                secretary: settings.secretary || '',
                orNumber: status.orNumber || prev.orNumber,
                validUntil: status.formData.validUntil || prev.validUntil,
                issueDateDisplay: status.issueDate
                  ? new Date(status.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })
                  : prev.issueDateDisplay,
              }));
            }
            setActiveConfig(config);
            setFtjsMode('reprint');
            setStep(2);
            return;
          }
          alert(
            `FTJS already used (expired ${status.validUntil ? new Date(status.validUntil).toLocaleDateString() : 'unknown'}). New FTJS certificate not allowed.`
          );
          return;
        }
        setFtjsStatus(null);
        setFtjsMode('issue');
      } catch {
        // fail closed for FTJS if status unknown? Prefer allow issue with server-side 409.
        setFtjsMode('issue');
      }
    }
```

Add state:

```tsx
const [ftjsStatus, setFtjsStatus] = useState<any>(null);
const [ftjsMode, setFtjsMode] = useState<'issue' | 'reprint' | null>(null);
```

In Step 2 banner area, if `ftjsMode === 'reprint' && ftjsStatus`:

```tsx
FTJS already issued on {issue date} — valid until {validUntil}. You are reprinting the same certificate (no new availment).
```

- [ ] **Step 4: Issue button behavior**

In `handleConfirmIssue` / primary CTA:
- If `ftjsMode === 'reprint'` → do **not** call `documentsService.create`. Open print/save actions on existing preview (`setShowIssueActions(true)` or `handlePrintDocument` directly).
- If issuing FTJS → include validity:

```tsx
      const result = await documentsService.create({
        residentId: selectedResidentId,
        documentTypeId,
        purpose: purpose === 'Other' ? otherPurpose : purpose,
        formData,
        validityPeriod:
          documentType === 'Barangay Certificate (FTJS)'
            ? formData.validUntil || undefined
            : undefined,
      });
```

On 409 from server, alert the error message and do not pretend success.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/pages/Document.tsx
git commit -m "feat(desktop): FTJS reprint UX and validity on issuance"
```

---

### Task 8: Seed + migration for document types

**Files:**
- Modify: `packages/db/prisma/seed.ts`
- Create: migration under `packages/db/prisma/migrations/` (name with date, e.g. `20260918000000_ftjs_document_types`)

**Interfaces:**
- Produces: DB type `Barangay Certificate (FTJS)` amount 0 isSystem true; obsolete names not seeded; existing unused types hidden — hard-delete only if safe

- [ ] **Step 1: Update seed documentTypes array**

```ts
  const documentTypes = [
    { documentName: "Barangay Business Clearance", amount: 500 },
    { documentName: "Certificate of Indigency", amount: 0 },
    { documentName: "Barangay Clearance", amount: 200 },
    { documentName: "Barangay Certificate (FTJS)", amount: 0 },
  ];
```

Removed from seed: Business Permit, Certificate of Residency.

- [ ] **Step 2: Write migration (safe cleanup)**

```sql
-- packages/db/prisma/migrations/<timestamp>_ftjs_document_types/migration.sql

-- Ensure FTJS system type exists
INSERT INTO `document_types` (`id`, `document_name`, `amount`, `is_system`)
SELECT UUID(), 'Barangay Certificate (FTJS)', 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM `document_types` WHERE `document_name` = 'Barangay Certificate (FTJS)'
);

UPDATE `document_types`
SET `is_system` = true, `amount` = 0
WHERE `document_name` = 'Barangay Certificate (FTJS)';

-- Hide obsolete types from being "system baseline" going forward
UPDATE `document_types`
SET `is_system` = false
WHERE `document_name` IN ('Business Permit', 'Certificate of Residency');

-- Hard-delete ONLY when no documents reference the type
DELETE dt FROM `document_types` dt
LEFT JOIN `documents` d ON d.`document_type_id` = dt.`id`
WHERE dt.`document_name` IN ('Business Permit', 'Certificate of Residency')
  AND d.`id` IS NULL;
```

If Prisma migrate dev is unsafe on drifted DBs (AGENTS.md), prefer documenting `prisma migrate deploy` for production and a manual script for dev if migrate dev is blocked.

- [ ] **Step 3: Align backup system-type names if hardcoded**

Search `backupService.ts` / restore logic for hardcoded system document names. Update lists so `Business Permit` / `Certificate of Residency` are no longer treated as protected baseline names; `Barangay Certificate (FTJS)` **is** system-protected.

```bash
# verify
pnpm --filter @rbi/server test
```

- [ ] **Step 4: Apply on dev DB when user allows**

```bash
pnpm --filter @rbi/db exec prisma migrate deploy
# or
pnpm db:generate
```

Do not run destructive migrate without user awareness.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/seed.ts packages/db/prisma/migrations
git commit -m "feat(db): seed FTJS type; retire unused document types safely"
```

---

### Task 9: Optional — delete BusinessPermitTemplate file

**Files:**
- Delete: `packages/desktop/src/components/templates/BusinessPermitTemplate.tsx` (after config no longer imports it)

- [ ] **Step 1: Confirm no imports remain**

Grep `BusinessPermitTemplate` — only the template file itself.

- [ ] **Step 2: Delete file and commit**

```bash
git rm packages/desktop/src/components/templates/BusinessPermitTemplate.tsx
git commit -m "chore(desktop): remove unused Business Permit template"
```

---

### Task 10: Full verification

- [ ] **Step 1: Unit tests**

```bash
pnpm test
```

- [ ] **Step 2: Manual flow checklist (app)**

1. Document types in UI: Barangay Clearance, Barangay Business Clearance, Certificate of Indigency, Barangay Certificate (FTJS).
2. No Certificate of Residency, no Business Permit.
3. Issue FTJS → validity ≈ issue+1y on preview/DB; CERT1 layout readable; letterhead present.
4. Second FTJS same resident → 409 / reprint banner; reprint does not create second Order.
5. Barangay Clearance prints footers (loan/seal/six months).
6. Business Clearance matches BPLO/RA 7160 wording.
7. Indigency still works (regression).

- [ ] **Step 3: DB reference check before claiming type deletion**

```bash
# temporary script under packages/server/src/scripts/ then delete (per AGENTS.md)
# count documents by type name for Business Permit / Certificate of Residency
```

- [ ] **Step 4: Report to user**

Summarize what shipped, what’s blocked, and whether hard-deletes were safe. Ask before any commit push or GitHub PR.

---

## Self-review notes

- Spec coverage: FTJS once-only + validity + reprint; CERT2 out; Barangay Clearance template; Business Clearance copy; type cleanup; seed/migration; inline-vs-agent ask.
- Placeholder scan: tasks include concrete code; app QA is checklist not “handle edge cases”.
- Type consistency: `FTJS_DOCUMENT_NAME`, `getFtjsStatus`, `FtjsStatus`, `computeFtjsValidUntil` used consistently.
- Known repo gotchas: pre-existing tsc errors in household/user controllers; `pnpm build:server` may fail for unrelated reasons; verify with vitest + targeted tsc.

## Execution handoff

Plan saved. **Before any implementation:** ask user **inline vs agent-driven (or other)**. Do not default.

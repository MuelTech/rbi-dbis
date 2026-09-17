# FTJS + Document Types Cleanup Design

## Overview

Add First Time Jobseeker (RA 11261) certificate issuance to RBI-DBIS, finish the Barangay Clearance printable template from the official barangay sample, align Business Clearance copy with the official form where needed, and remove document types that have no real template.

**Out of scope:** CERT2 (Oath of Undertaking) as a digital form. CERT2 remains a paper document the barangay files in person. The system only records that an FTJS CERT1 was issued.

**Reference pattern:** Certificate of Indigency — shared `Letterhead`, config fields in `config/documents.tsx`, DB `DocumentType`, issuance via Document page → preview → `documentsService.create`.

## Source samples

| File | Use |
|------|-----|
| `D:\Backup\BSIT-3B\SYSARCH\barangay documents\FTJS CERT1.pdf` | FTJS CERT1 layout + body text |
| `D:\Backup\BSIT-3B\SYSARCH\barangay documents\BC 2023 Ch Amy.pdf` | Barangay Clearance layout (employment-style certificate) |
| `D:\Backup\BSIT-3B\SYSARCH\barangay documents\business permit.pdf` | Official Business Clearance wording (BPLO) |
| `D:\Backup\BSIT-3B\SYSARCH\barangay documents\indigency.pdf` | Already implemented — reference only |

Project assets (letterhead) live at `packages/desktop/src/assets/`:
- `letterhead-banner.jpg`
- `bagong-pilipinas.png`

Do **not** create asset folders at the repo root.

## Business rules

### FTJS CERT1 (RA 11261)

1. **Document type name (DB + UI):** `Barangay Certificate (FTJS)`  
   Config id: `barangay-certificate-ftjs`  
   Amount: `0` (first-time jobseeker fee waiver context; barangay may charge later via Settings/seed if they choose — default 0).

2. **Once only:** A resident may have **at most one issued FTJS CERT1**.  
   - No prior FTJS document → allow new issuance.  
   - Prior FTJS exists → **do not create a second Document/Order**. Offer **reprint only** while validity is still open; otherwise block.

3. **Validity (locked):** Store on `Document.validityPeriod` and in `formData.validUntil`.  
   **Default rule: issue date + 1 year** (e.g. issued 2026-01-28 → valid until 2027-01-28).  
   Not the calendar-year cut-off from the sample PDF.

4. **Reprint (lost certificate, still valid):**  
   - Look up existing FTJS document for the resident.  
   - If `validUntil >= today` → show existing issuance data, allow print/save PDF.  
   - **Same validity end date** — never reset to a new period.  
   - **No new Document/Order row.** Reprint is a print action on the existing record (or a reprint endpoint that returns the existing document for printing without insert).  
   - If already expired → staff message: FTJS already used and expired; new FTJS not allowed.

5. **CERT2 / Oath (locked):** Not implemented in the app. **No in-app oath checkbox.** CERT1 body still certifies that the holder signed the Oath of Undertaking (official wording). Staff collect the paper oath outside the system before issuing.

6. **Purpose:** Staff should select an FTJS-related purpose from Settings → Document Settings (e.g. `First Time Jobseeker (RA 11261)`). Purpose is free-text from settings; the once-only rule keys off **document type**, not purpose string.

### Barangay Clearance

1. Replace the “Coming Soon” placeholder with a real template based on `BC 2023 Ch Amy.pdf`.
2. Body: bonafide resident of Barangay 418 Zone 43, address, good moral character / no derogatory record, issued upon request for a stated purpose (e.g. LOCAL EMPLOYMENT).
3. Footers from sample:  
   - NOT VALID FOR ANY LOAN  
   - NOT VALID WITHOUT BARANGAY SEAL  
   - VALID FOR SIX MONTHS UPON DATE ISSUED  
   - Control/OR number on the face (system already uses OR Number `YYYY-418-XXXXX`)
4. Signatory: Punong Barangay / Barangay Chairwoman from settings.
5. Config fields: address (resident attribute), purpose, date parts if needed (or system issue date).

### Business Clearance / Business Permit

1. **Barangay Business Clearance** — keep existing type and template; update body copy to match official `business permit.pdf` (Section 162, RA 7160; revoke clause; “for Business Permit and Licensing Office only”; valid until date; BUS. NO. / OR No.).
2. **Business Permit (locked: DELETE):** Remove `Business Permit` from seed, system-type set, frontend config, and Document dropdown. Current `BusinessPermitTemplate.tsx` is a Business Clearance clone and is not a true permit form. **Barangay Business Clearance** remains the printable business document.
3. Align **Barangay Business Clearance** copy with official `business permit.pdf` (Section 162, RA 7160; revoke clause; BPLO-only; valid until; OR/BUS number).

### Document types with no template (delete)

**Locked cleanup policy:** Hide from UI + seed; **block hard-delete if Document/Order rows reference the type.** Do not migrate historical documents silently. Report counts; leave rows intact until user approves case-by-case deletion.

| Type | Action |
|------|--------|
| Certificate of Residency | **Hide + remove from seed/UI** — placeholder, no sample. Hard-delete only if zero references (or after user approval). |
| Business Permit | **Delete from seed/UI/config** — locked. Hard-delete only if zero references. |
| Barangay Clearance | **Keep** — implement real template in this feature |
| Barangay Certificate (FTJS) | **Add** — new system type |

Deletion rules (locked):
- Update **seed** (`packages/db/prisma/seed.ts`) and system-type seed/migration so obsolete names are not re-inserted.
- **UI/config first:** remove from `Document.tsx` options and `documents.tsx` configs so staff cannot issue them.
- **DB hard-delete:** only when zero `Document` rows reference the type; if references exist, hide in UI, leave DB rows, and report counts. No silent type reassignment.
- Restore/backup: update the system-type name set consistently so restore does not re-protect deleted names as baseline.

## Template content (FTJS CERT1)

Mirror the official sample structure using shared `Letterhead`:

- Title: `BARANGAY CERTIFICATE`
- Subtitle: `(First Time Jobseeker Assistance Act. RA 11261)`
- Salutation: `TO WHOM IT MAY CONCERN:`
- Body 1: certify that **{name}**, **{age} years old**, **{civilStatus}**, a resident of **{address}**, for **{yearsOfResidency} year/s** is a qualified availee of RA 11261 or the First Time Jobseeker Act of 2019.
- Body 2: further certify that the holder/bearer was informed of her/his rights, including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking she/he has signed and executed in the presence of our Barangay Official.
- Signed this **{day}** day of **{month}**, **{year}** in Barangay 418 zone 43, District IV, Metro Manila, Philippines.
- Validity line: This certification is valid only until **{validUntil}**.
- Signatories (right column):
  - **{punongBarangay}** — BARANGAY CHAIRWOMAN  
  - **{issueDate display}** — Date  
  - Witnessed by: **{barangaySecretary}** — Barangay Secretary  

### Form fields (config)

| Key | Label | Source | Notes |
|-----|-------|--------|-------|
| age | Age | input or resident attr if available | required |
| civilStatus | Civil Status | select (Single, Married, etc.) | required; sample: Single |
| address | Address | resident household / input | required |
| yearsOfResidency | Years of Residency | input | required; e.g. 3 |
| validUntil | Valid Until | system default + editable | **default: issue date + 1 year** |
| witnessName | Barangay Secretary | settings if available, else input | sample: Julie Ann L. Castilla |

`punongBarangay`, `barangayName`, issue date, and OR number already flow from settings / issuance.

### Barangay Clearance fields

| Key | Label | Source |
|-----|-------|--------|
| address | Residence / postal address | resident / input |
| purpose | Purpose (e.g. LOCAL EMPLOYMENT) | input or purpose dropdown value |

## API / data behavior

### Existing (reuse)

- `GET /api/documents/types` — list types  
- `GET /api/documents/last?residentId&documentTypeId` — last doc (prefill); **not sufficient alone for FTJS**  
- `POST /api/documents` — creates Document + Order  
- `Document.validityPeriod` String? — already in schema; UI currently does not send it  
- `Document.formData` JSON — store FTJS fields + `validUntil` for reprint display  

### New / changed

1. **FTJS status endpoint (recommended)**  
   `GET /api/documents/ftjs-status?residentId=`  
   Response:
   ```json
   {
     "hasFtjs": true,
     "documentId": "doc_xxx",
     "issueDate": "2026-01-28",
     "validUntil": "2026-12-31",
     "isValid": true,
     "orNumber": "2026-418-00012",
     "formData": { }
   }
   ```
   Or `null` / `{ hasFtjs: false }` when none.

2. **Create FTJS with guard**  
   In `createDocument` (or a dedicated FTJS path): if `documentType.documentName` is FTJS (or a config flag on type), reject create when an FTJS document already exists for that resident (409), unless the request is explicitly a reprint (which should not call create).

3. **Reprint**  
   Preferred: frontend fetches FTJS status → if valid, load existing document into preview/print **without** `POST /documents`.  
   Optional server: `GET /api/documents/:id/reprint` returns print payload; still no new row.

4. **Send `validityPeriod` from FTJS UI** on first issuance (and store `validUntil` in formData).

5. **Hardcoded dropdown** in `Document.tsx` must be replaced or updated to match types that have templates + DB types.

## Frontend flow (Document page)

### First-time FTJS issuance

1. Select resident → purpose (FTJS) → document type `Barangay Certificate (FTJS)`.
2. On proceed, call FTJS status (or last document + type name check).
3. No prior FTJS → normal editor; default `validUntil` to **issue date + 1 year**; show once-only notice.
4. Confirm issue → `POST` with `validityPeriod` + formData → preview/print (existing pattern).
5. Staff collect paper CERT2 outside the system (no UI checkbox).

### Resident already has FTJS

1. Banner (do not open a blank new-issue editor as default):  
   `FTJS already issued on {issueDate} — valid until {validUntil}. Reprint certificate?`
2. **Valid** → buttons: `Reprint certificate` (print/save existing data). No new Order.  
3. **Expired** → block: `FTJS already used (expired {validUntil}). New FTJS certificate not allowed.` No create.

### Barangay Clearance / Business Clearance

Standard Indigency-like flow: select type → fill fields → preview → issue → print.

## Files to touch (expected)

| File | Change |
|------|--------|
| `packages/desktop/src/components/templates/FtjsCertificateTemplate.tsx` | **Create** — CERT1 template |
| `packages/desktop/src/components/templates/BarangayClearanceTemplate.tsx` | **Create** — replace placeholder |
| `packages/desktop/src/components/templates/BusinessClearanceTemplate.tsx` | Align copy to official form |
| `packages/desktop/src/components/templates/BusinessPermitTemplate.tsx` | Delete or rewrite per decision |
| `packages/desktop/src/config/documents.tsx` | Add FTJS + Barangay Clearance fields; remove deleted types |
| `packages/desktop/src/pages/Document.tsx` | Dropdown from real types; FTJS status/reprint UX; pass validityPeriod |
| `packages/desktop/src/services/documents.ts` | `getFtjsStatus`, types for reprint payload |
| `packages/server/src/controllers/documentController.ts` | FTJS status; create guard; include validity in last/status responses |
| `packages/server/src/routes/documents.ts` | New route(s) |
| `packages/db/prisma/seed.ts` | Add FTJS type; remove obsolete types |
| `packages/db/prisma/migrations/...` | Seed/remove document types; adjust `isSystem` set carefully |
| `docs/superpowers/plans/2026-09-17-ftjs-and-document-types.md` | Implementation plan (after this spec) |

No change required to `HANDLED_MODELS` unless a new Prisma model is added — **prefer no new model**; FTJS is a document type + rules, not a new table. (If a future `FtjsAvailment` table is desired, that would require backup model decisions — YAGNI for v1.)

## Edge cases

- Multiple staff PCs: once-only must be enforced **server-side**, not only UI.
- Two concurrent FTJS creates: transaction/upsert or unique constraint preferred; practical v1: check-before-create + audit log; optional unique partial index is MySQL-limited — document limitation if not enforced at DB.
- Reprint after restore/backup: validity comes from Document row, not recomputed.
- Resident deceased/moved out: issuance still uses Active resident filter already in Document page — no special FTJS rule beyond that.
- Prefill banner for non-FTJS types remains as today; for FTJS, reprint path replaces generic “issue again” prefill.
- Display name must match exactly across seed, config `name`, and Document.tsx options.

## Verification

1. Seed/migrate: types list = Barangay Clearance, Barangay Business Clearance, Certificate of Indigency, Barangay Certificate (FTJS) (+ Business Permit only if kept).
2. Certificate of Residency absent from UI and (when safe) from DB seed.
3. Issue FTJS for a resident → row exists; validity on document; print layout matches sample structure.
4. Attempt second FTJS → blocked or reprint-only; no second Order when reprinted.
5. Expired FTJS → blocked message.
6. Barangay Clearance prints with six-month / loan / seal footers.
7. Business Clearance copy matches official RA 7160 / BPLO sample.
8. Server tests where practical: FTJS guard unit-testable logic if extracted; otherwise tsx script per AGENTS.md (no DB test harness).
9. `pnpm test` in server + desktop for touched units.

## Decisions (locked)

1. **Business Permit type:** Delete from seed/UI/config.  
2. **FTJS validity default:** Issue date + 1 year.  
3. **CERT2 checkbox:** Omit — no in-app oath confirmation.  
4. **Unused types in DB:** Hide + block hard-delete if referenced; no silent data migration.  
5. **Secretary name:** Settings if available, else input on the form (default empty).

## Execution mode

Not chosen yet. At implementation start, ask the user: **inline vs agent-driven (or other)**. Do not default.

# Document Pre-fill Design

## Overview

When issuing a document, staff can choose to pre-fill form data from the resident's most recent document of the same type. This speeds up repeat requests (e.g., lost documents).

## Behavior

1. Staff selects resident + document type in Step 1
2. System checks: Does this resident have a previous document of this type?
3. In Step 2, if previous document exists, show a banner: "Previous [Document Type] found from [Date]. Use this data?"
4. Staff clicks "Use Previous Data" button → form overwrites with past data
5. Staff can modify any field before printing

## Backend

### New Endpoint

`GET /api/documents/last`

Query params:
- `residentId` (string): resident ID
- `documentTypeId` (string): document type ID

Response:
```json
{
  "id": "doc_xxx",
  "formData": { ... },
  "purpose": "...",
  "issueDate": "2026-01-15T00:00:00.000Z"
}
```

Returns `null` if no previous document found.

## Frontend

### Documents Service

Add `getLastDocument(residentId, documentTypeId)` function.

### Document.tsx

1. Add state: `previousDocumentData` and `showPrefillBanner`
2. In `handleProceed`, after setting `activeConfig`, fetch last document
3. If found, set `showPrefillBanner = true`
4. In Step 2, show banner with "Use Previous Data" button
5. On button click, overwrite `formData` with past `formData`

## Files to Modify

| File | Change |
|------|--------|
| `packages/server/src/controllers/documentController.ts` | Add `getLastDocument` function |
| `packages/server/src/routes/documents.ts` | Add route `GET /last` |
| `packages/desktop/src/services/documents.ts` | Add `getLastDocument()` function |
| `packages/desktop/src/pages/Document.tsx` | Add pre-fill banner and logic |

# Task 4 Report: Frontend - Refactor Document Page with Dynamic Forms

## Status: DONE

## Summary
Refactored the Document.tsx page to fetch real residents and document types from the API, create documents via the backend, and pass OR Number and Document Number to the template.

## Changes Made

### Backend
- **`packages/server/src/controllers/documentController.ts`** — Added `getDocumentTypes` endpoint that returns all document types from the database (cuid IDs + documentName + amount)
- **`packages/server/src/routes/documents.ts`** — Added `GET /api/documents/types` route before the `/:id` catch-all

### Frontend
- **`packages/desktop/src/services/documents.ts`** — Added `DocumentTypeRecord` interface and `documentsService.getTypes()` method
- **`packages/desktop/src/pages/Document.tsx`** — Major refactor:
  - Replaced mock residents array with `useQuery` + `residentsService.list({ pageSize: 1000 })`
  - Added `selectedResidentId` state to track the selected resident's database ID
  - Added `useQuery` for `documentsService.getTypes()` to fetch document type IDs
  - `handleProceed` now calls `documentsService.create()` with `residentId`, `documentTypeId`, and `purpose`
  - OR Number and Document Number from the API response are included in `formData`
  - Request Details card now shows OR Number, Document Number, and dynamic address from resident data
  - Resident `getFullName` handles both camelCase (API response) and snake_case field formats
  - Resident search dropdown uses `resident.id` as key and stores it in `selectedResidentId`

## Verification
- Desktop package TypeScript check: **PASSED** (no errors)
- Server TypeScript check: Pre-existing errors only (not introduced by this change)

## Concerns
- Document types must be seeded in the database for document creation to work. If the `document_types` table is empty, the user will see an alert: "Document type not found in the system."
- The `GET /documents/:id` route must come after `/documents/types` to avoid the `:id` param catching "types" as an ID — this is correctly ordered in the route file.
- The `resident` include on existing `getDocuments`/`getDocumentById` endpoints has a pre-existing TS error (the Prisma schema may not have the relation named `resident` in the expected way).

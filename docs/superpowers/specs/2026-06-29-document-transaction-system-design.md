# Document Transaction System Design

## Overview

Design the document issuance flow for RBI-DBIS, connecting frontend to backend and establishing proper transaction tracking.

## Current State

- Document.tsx uses hardcoded mock residents
- No Order record created when document is issued
- Transaction Section uses mock data
- Templates exist but some are placeholders

## Design Decisions

### Fields to Store

| Field | Table | Source |
|-------|-------|--------|
| OR Number | Order | Auto-generated |
| Document Number | Document | Auto-generated |
| Issue Date | Document | System date |
| Purpose | Document | User input |
| Amount Paid | Order | From DocumentType |
| Issued By | Order → User | Current user |
| Resident | Order → Resident | Selected resident |
| Document Type | Document → Type | User selection |

### Fields to Show on Document

| Field | Show? |
|-------|-------|
| OR Number | ✅ |
| Resident Name | ✅ |
| Purpose | ✅ |
| Issue Date | ✅ |
| Validity Period | ✅ |
| Amount Paid | ❌ (backend only) |

### OR Number Format

```
YYYY-418-XXXXX
Example: 2026-418-00001
```

### Document Number Format

```
DOC-XXXXX
Example: DOC-00001
```

## Flow

1. User selects resident from real API data
2. User selects document type
3. User fills purpose and other fields
4. System creates Document record
5. System creates Order record (links Document ↔ Resident ↔ User)
6. System generates OR Number
7. Document template displays with OR Number

## API Changes

### POST /api/documents

Request:
```json
{
  "residentId": "cuid",
  "documentTypeId": "cuid",
  "purpose": "Business Permit",
  "validityPeriod": "1 year"
}
```

Response:
```json
{
  "id": "cuid",
  "displayId": 1,
  "documentNumber": "DOC-00001",
  "issueDate": "2026-06-29",
  "purpose": "Business Permit",
  "validityPeriod": "1 year",
  "order": {
    "id": "cuid",
    "displayId": 1,
    "orNumber": "2026-418-00001",
    "amount": 500,
    "orderDate": "2026-06-29"
  },
  "documentType": {
    "id": "cuid",
    "documentName": "Business Permit",
    "amount": 500
  }
}
```

## Files to Modify

### Backend
1. `packages/server/src/controllers/documentController.ts` — Add Order creation
2. `packages/server/src/routes/documents.ts` — Update routes

### Frontend
1. `packages/desktop/src/services/documents.ts` — Update service
2. `packages/desktop/src/pages/Document.tsx` — Fetch real residents, create Order
3. `packages/desktop/src/components/templates/*.tsx` — Add OR Number field

## Migration Required

Add `orNumber` and `documentNumber` fields to Order and Document tables.

## Testing

1. Select a real resident
2. Choose document type
3. Fill purpose
4. Click Issue & Print
5. Verify Document + Order created in database
6. Verify OR Number appears on document

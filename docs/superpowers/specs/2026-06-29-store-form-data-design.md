# Store Document FormData Design

## Overview

Add a `formData` JSON field to the Document model to store all dynamic input fields when a document is issued. This allows viewing the complete document later with all original data.

## Current Problem

When a document is issued, only `purpose` and `validityPeriod` are saved. Dynamic fields like business name, address, etc. are lost.

## Solution

Add a `formData` JSON column to the Document table to store all dynamic input fields.

## Schema Change

```prisma
model Document {
  id             String   @id @default(cuid())
  documentNumber String   @unique @map("document_number") @db.VarChar(20)
  issueDate      DateTime @map("issue_date") @db.Date
  purpose        String?  @db.VarChar(255)
  validityPeriod String?  @map("validity_period") @db.VarChar(50)
  formData       Json?    @db.Json  // NEW
  createdAt      DateTime @default(now()) @map("created_at")
  ...
}
```

## Example formData

Barangay Business Clearance:
```json
{
  "selectedResident": "Juan Dela Cruz",
  "businessName": "Sari-Sari Store",
  "businessAddress": "123 Main St",
  "natureOfBusiness": "Retail",
  "ownershipType": "Sole Proprietorship",
  "purpose": "Business Permit",
  "dateIssued": "June 29, 2026",
  "barangayName": "Barangay 418",
  "orNumber": "2026-418-00001"
}
```

## Files to Modify

1. `packages/db/prisma/schema.prisma` — Add formData field
2. `packages/server/src/controllers/documentController.ts` — Save formData on create
3. `packages/desktop/src/pages/Document.tsx` — Pass all formData to API
4. `packages/desktop/src/components/ui/TransactionViewModal.tsx` — Use formData for template

## Data Flow

```
User fills dynamic fields → formData collected → Saved to database
                                                      ↓
View button clicked → Fetch document → formData passed to template
```

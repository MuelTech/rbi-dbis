# Store Document FormData Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add formData JSON field to Document model to store all dynamic input fields for future viewing.

**Architecture:** Add JSON column to store form data, save on document creation, retrieve for template rendering.

**Tech Stack:** Prisma, Express, React, TypeScript

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Follow existing code patterns

---

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/db/prisma/schema.prisma` | Add formData field |
| `packages/server/src/controllers/documentController.ts` | Save formData on create |
| `packages/desktop/src/services/documents.ts` | Update service types |
| `packages/desktop/src/pages/Document.tsx` | Pass all formData to API |
| `packages/desktop/src/components/ui/TransactionViewModal.tsx` | Use formData for template |

---

### Task 1: Database Schema Update

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Consumes: None
- Produces: Updated schema with formData field

- [ ] **Step 1: Add formData field to Document model**

Open `packages/db/prisma/schema.prisma` and add to the Document model:

```prisma
model Document {
  id             String   @id @default(cuid())
  displayId      Int      @unique @default(autoincrement()) @map("display_id")
  issueDate      DateTime @map("issue_date") @db.Date
  purpose        String?  @db.VarChar(255)
  validityPeriod String?  @map("validity_period") @db.VarChar(50)
  formData       Json?    @db.Json  // Store all dynamic input fields
  createdAt      DateTime @default(now()) @map("created_at")

  documentTypeId String       @map("document_type_id")
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id])

  order          Order?
  signers        DocumentSigner[]

  @@map("documents")
}
```

- [ ] **Step 2: Run migration**

```bash
pnpm db:migrate --name "add-form-data-to-document"
```

- [ ] **Step 3: Generate Prisma client**

```bash
pnpm db:generate
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): add formData JSON field to Document model"
```

---

### Task 2: Backend - Update Document Controller

**Files:**
- Modify: `packages/server/src/controllers/documentController.ts`

**Interfaces:**
- Consumes: Updated Prisma schema
- Produces: Document creation with formData

- [ ] **Step 1: Update createDocument to save formData**

Find the `createDocument` function and update the document create to include formData:

```typescript
const document = await tx.document.create({
  data: {
    issueDate: new Date(),
    purpose: purpose || null,
    validityPeriod: validityPeriod || null,
    formData: req.body.formData || null,  // NEW
    documentTypeId,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/server && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/documentController.ts
git commit -m "feat(server): save formData when creating document"
```

---

### Task 3: Frontend - Update Service Types

**Files:**
- Modify: `packages/desktop/src/services/documents.ts`

**Interfaces:**
- Consumes: Backend API response
- Produces: Updated service types

- [ ] **Step 1: Update DocumentRecord interface**

Add formData to the interface:

```typescript
export interface DocumentRecord {
  id: string;
  displayId: number;
  issueDate: string;
  purpose: string;
  validityPeriod: string;
  formData: Record<string, any> | null;  // NEW
  documentType: {
    id: string;
    documentName: string;
    amount: number;
  };
  order: {
    id: string;
    displayId: number;
    orNumber: string;
    amount: number;
    orderDate: string;
  } | null;
}
```

- [ ] **Step 2: Update CreateDocumentPayload**

Add formData to the payload:

```typescript
export interface CreateDocumentPayload {
  residentId: string;
  documentTypeId: string;
  purpose: string;
  validityPeriod?: string;
  formData?: Record<string, any>;  // NEW
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/services/documents.ts
git commit -m "feat(frontend): add formData to document service types"
```

---

### Task 4: Frontend - Update Document Page

**Files:**
- Modify: `packages/desktop/src/pages/Document.tsx`

**Interfaces:**
- Consumes: Updated service
- Produces: Document creation with formData

- [ ] **Step 1: Update handlePrint to pass formData**

Find the `handlePrint` function and update the API call to include formData:

```typescript
const result = await documentsService.create({
  residentId: selectedResidentId,
  documentTypeId,
  purpose: purpose === 'Other' ? otherPurpose : purpose,
  formData,  // NEW: Pass all form data
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/pages/Document.tsx
git commit -m "feat(frontend): pass formData when creating document"
```

---

### Task 5: Frontend - Update TransactionViewModal

**Files:**
- Modify: `packages/desktop/src/components/ui/TransactionViewModal.tsx`

**Interfaces:**
- Consumes: Document with formData
- Produces: Template rendered with formData

- [ ] **Step 1: Update templateData to use formData**

Find the templateData construction and update it to use formData:

```typescript
const templateData = documentData ? {
  ...documentData.formData,  // Spread all saved form data
  selectedResident: transaction.resident,
  orNumber: transaction.orNumber,
  dateIssued: new Date(documentData.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  barangayName: settings.barangayName,
  municipality: settings.municipality,
  province: settings.province,
  punongBarangay: settings.punongBarangay,
} : null;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/ui/TransactionViewModal.tsx
git commit -m "feat(frontend): use formData for template rendering in View modal"
```

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | Database schema update | schema.prisma |
| 2 | Backend controller | documentController.ts |
| 3 | Frontend service types | documents.ts |
| 4 | Frontend document page | Document.tsx |
| 5 | Frontend view modal | TransactionViewModal.tsx |

## Expected Outcome

After completing all tasks:
- All dynamic input fields are saved to database
- Documents can be viewed with complete data
- All document types work with the same approach
- Templates render correctly with saved data

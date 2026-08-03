# Remove Document Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Document Number from the system and keep only OR Number for document tracking.

**Architecture:** Remove `documentNumber` field from database schema, backend controller, frontend service, and templates. OR Number becomes the sole identifier for documents.

**Tech Stack:** Prisma, Express, React, TypeScript

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Follow existing code patterns

---

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/db/prisma/schema.prisma` | Remove documentNumber field |
| `packages/server/src/controllers/documentController.ts` | Remove documentNumber generation |
| `packages/desktop/src/services/documents.ts` | Remove documentNumber from types |
| `packages/desktop/src/pages/Document.tsx` | Remove documentNumber from formData |
| `packages/desktop/src/components/templates/*.tsx` | Remove Doc Number display |

---

### Task 1: Database Schema Update

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Consumes: None
- Produces: Updated schema without documentNumber

- [ ] **Step 1: Remove documentNumber field from Document model**

Open `packages/db/prisma/schema.prisma` and remove this line from the Document model:
```prisma
documentNumber String   @unique @map("document_number") @db.VarChar(20)
```

- [ ] **Step 2: Run migration**

```bash
pnpm db:migrate --name "remove-document-number"
```

- [ ] **Step 3: Generate Prisma client**

```bash
pnpm db:generate
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): remove document number field, keep only OR number"
```

---

### Task 2: Backend Controller Update

**Files:**
- Modify: `packages/server/src/controllers/documentController.ts`

**Interfaces:**
- Consumes: Updated Prisma schema
- Produces: Controller without documentNumber

- [ ] **Step 1: Remove generateDocumentNumber function**

Delete the entire `generateDocumentNumber` function (approximately lines 94-107).

- [ ] **Step 2: Update createDocument to remove documentNumber**

In the `createDocument` function, remove:
1. The `documentNumber` generation code
2. The `documentNumber` from the transaction create data
3. The `documentNumber` from the logCreate call

The create should only include:
```typescript
const document = await tx.document.create({
  data: {
    issueDate: new Date(),
    purpose: purpose || null,
    validityPeriod: validityPeriod || null,
    documentTypeId,
  },
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd packages/server && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/controllers/documentController.ts
git commit -m "feat(server): remove document number generation, keep OR number only"
```

---

### Task 3: Frontend Service Update

**Files:**
- Modify: `packages/desktop/src/services/documents.ts`

**Interfaces:**
- Consumes: Backend API response
- Produces: Updated service types

- [ ] **Step 1: Remove documentNumber from DocumentRecord interface**

Remove this line from the interface:
```typescript
documentNumber: string;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/documents.ts
git commit -m "feat(frontend): remove document number from service types"
```

---

### Task 4: Document Page Update

**Files:**
- Modify: `packages/desktop/src/pages/Document.tsx`

**Interfaces:**
- Consumes: Updated service
- Produces: Page without documentNumber

- [ ] **Step 1: Remove documentNumber from formData**

In the `handleProceed` function, remove this line from `initialData`:
```typescript
documentNumber: result.documentNumber ?? '',
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/pages/Document.tsx
git commit -m "feat(frontend): remove document number from page"
```

---

### Task 5: Template Updates

**Files:**
- Modify: `packages/desktop/src/components/templates/BusinessClearanceTemplate.tsx`
- Modify: `packages/desktop/src/components/templates/BusinessPermitTemplate.tsx`
- Modify: `packages/desktop/src/components/templates/IndigencyTemplate.tsx`

**Interfaces:**
- Consumes: formData without documentNumber
- Produces: Templates showing only OR Number

- [ ] **Step 1: Update BusinessClearanceTemplate**

Remove the Doc Number section from the OR Details:
```tsx
<div className="grid grid-cols-[100px_1fr] gap-1">
  <span>Doc Number:</span>
  <span>{data.documentNumber || 'N/A'}</span>
</div>
```

- [ ] **Step 2: Update BusinessPermitTemplate**

Same removal as above.

- [ ] **Step 3: Update IndigencyTemplate**

Same removal as above.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/components/templates/*.tsx
git commit -m "feat(templates): remove document number display, keep OR number only"
```

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | Database schema update | schema.prisma |
| 2 | Backend controller | documentController.ts |
| 3 | Frontend service | documents.ts |
| 4 | Document page | Document.tsx |
| 5 | Templates | *.tsx templates |

## Expected Outcome

After completing all tasks:
- Document Number field removed from database
- OR Number is the sole document identifier
- Templates show only OR Number
- All code compiles without errors

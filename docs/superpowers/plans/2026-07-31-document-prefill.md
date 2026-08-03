# Document Pre-fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow staff to pre-fill document form data from a resident's previous document of the same type.

**Architecture:** Add backend endpoint to fetch last document data. Add frontend banner in Step 2 that offers to pre-fill form fields when previous document exists.

**Tech Stack:** Express.js, Prisma, React, TanStack Query

## Global Constraints

- Do NOT kill node processes
- Do NOT commit or push to GitHub until user explicitly approves
- Follow existing code patterns in the codebase
- PHP peso sign (₱) not supported — use "PHP" text in PDF exports

---

### Task 1: Backend - Get Last Document Endpoint

**Files:**
- Modify: `packages/server/src/controllers/documentController.ts`
- Modify: `packages/server/src/routes/documents.ts`

**Interfaces:**
- Consumes: Existing document queries as reference
- Produces: `getLastDocument` function, `GET /documents/last` route

- [ ] **Step 1: Add getLastDocument function**

Add after the existing `getDocumentById` function in `documentController.ts`:

```typescript
export async function getLastDocument(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { residentId, documentTypeId } = req.query;

    if (!residentId || !documentTypeId) {
      res.json(null);
      return;
    }

    const document = await prisma.document.findFirst({
      where: {
        order: {
          residentId: residentId as string,
        },
        documentTypeId: documentTypeId as string,
      },
      include: {
        order: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    if (!document) {
      res.json(null);
      return;
    }

    res.json({
      id: document.id,
      formData: document.formData,
      purpose: document.purpose,
      issueDate: document.issueDate,
    });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Add route**

Add to `packages/server/src/routes/documents.ts`:

```typescript
import { getLastDocument } from "../controllers/documentController";

// Add BEFORE the /:id route
documentsRouter.get("/last", getLastDocument);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project packages/server/tsconfig.json`
Expected: Only pre-existing errors (householdController, userController), no new errors

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/controllers/documentController.ts packages/server/src/routes/documents.ts
git commit -m "feat: add get last document endpoint"
```

---

### Task 2: Frontend Service

**Files:**
- Modify: `packages/desktop/src/services/documents.ts`

**Interfaces:**
- Consumes: Backend `GET /documents/last` endpoint
- Produces: `getLastDocument(residentId, documentTypeId)` function

- [ ] **Step 1: Add getLastDocument function**

Add after the existing functions in `documents.ts`:

```typescript
getLastDocument: async (
  residentId: string,
  documentTypeId: string
): Promise<{
  id: string;
  formData: Record<string, any> | null;
  purpose: string | null;
  issueDate: string;
} | null> => {
  const params = new URLSearchParams({
    residentId,
    documentTypeId,
  });
  return api.get(`/documents/last?${params.toString()}`);
},
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project packages/desktop/tsconfig.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/documents.ts
git commit -m "feat: add get last document service function"
```

---

### Task 3: Frontend Component - Pre-fill Banner

**Files:**
- Modify: `packages/desktop/src/pages/Document.tsx`

**Interfaces:**
- Consumes: `documentsService.getLastDocument()` from Task 2
- Produces: Updated Step 2 with pre-fill banner

- [ ] **Step 1: Add state variables**

Add after the existing state declarations (around line 33):

```typescript
// Pre-fill State
const [previousDocumentData, setPreviousDocumentData] = useState<{
  id: string;
  formData: Record<string, any> | null;
  purpose: string | null;
  issueDate: string;
} | null>(null);
const [showPrefillBanner, setShowPrefillBanner] = useState(false);
```

- [ ] **Step 2: Update handleProceed to fetch previous document**

In the `handleProceed` function, after `setFormData(initialData);` and before `setStep(2);`, add:

```typescript
// Fetch previous document for pre-fill
try {
  const lastDoc = await documentsService.getLastDocument(
    selectedResidentId,
    dbDocType.id
  );
  if (lastDoc && lastDoc.formData) {
    setPreviousDocumentData(lastDoc);
    setShowPrefillBanner(true);
  } else {
    setPreviousDocumentData(null);
    setShowPrefillBanner(false);
  }
} catch {
  setPreviousDocumentData(null);
  setShowPrefillBanner(false);
}
```

- [ ] **Step 3: Add handleUsePreviousData function**

Add after the `handleInputChange` function:

```typescript
const handleUsePreviousData = () => {
  if (previousDocumentData?.formData) {
    setFormData(prev => ({
      ...prev,
      ...previousDocumentData.formData,
    }));
  }
  setShowPrefillBanner(false);
};
```

- [ ] **Step 4: Add pre-fill banner UI**

In the Step 2 JSX, after the back button and before the form fields, add:

```tsx
{showPrefillBanner && previousDocumentData && (
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
    <div className="flex items-center gap-3">
      <FileText size={20} className="text-blue-600" />
      <div>
        <p className="text-sm font-medium text-blue-900">
          Previous {documentType} found
        </p>
        <p className="text-xs text-blue-600">
          Issued on {new Date(previousDocumentData.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
    <button
      onClick={handleUsePreviousData}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Use Previous Data
    </button>
  </div>
)}
```

- [ ] **Step 5: Hide banner after use**

The `handleUsePreviousData` function already sets `setShowPrefillBanner(false)`, so the banner will disappear after clicking.

- [ ] **Step 6: Reset state on back**

In the `handleBack` function, add:

```typescript
setPreviousDocumentData(null);
setShowPrefillBanner(false);
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project packages/desktop/tsconfig.json`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add packages/desktop/src/pages/Document.tsx
git commit -m "feat: add pre-fill banner for document issuance"
```

---

### Task 4: End-to-End Testing

**Files:**
- None (manual testing)

- [ ] **Step 1: Restart backend server**

- [ ] **Step 2: Test pre-fill flow**
  1. Go to Document page
  2. Select a resident who has a previous document
  3. Select the same document type
  4. Fill in purpose and click "Proceed to Editor"
  5. Verify banner appears: "Previous [Document Type] found from [Date]"
  6. Click "Use Previous Data"
  7. Verify form fields are pre-filled with past data
  8. Modify a field if needed
  9. Click "Issue & Print"
  10. Verify document is created successfully

- [ ] **Step 3: Test no previous document**
  1. Select a resident with no previous document of that type
  2. Click "Proceed to Editor"
  3. Verify NO banner appears
  4. Form should have default values only

- [ ] **Step 4: Test back button**
  1. In Step 2 with banner visible
  2. Click "Back"
  3. Verify banner state is reset
  4. Re-proceed to Step 2
  5. Verify banner appears again

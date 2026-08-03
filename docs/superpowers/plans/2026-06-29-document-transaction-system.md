# Document Transaction System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete document issuance flow with real resident data, Order creation, OR Number generation, and dynamic form fields based on document type.

**Architecture:** Frontend fetches real residents, creates Document + Order records via API, generates OR Number, and displays template with proper fields. Dynamic form fields adapt based on selected document type.

**Tech Stack:** React, TanStack Query, Express, Prisma, TypeScript, Tailwind CSS

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Tailwind CSS via Play CDN
- TanStack Query for data fetching
- Prisma ORM with MySQL
- Follow `.agent/rules/design-system.mdc` for UI patterns
- Follow `.agent/rules/api-communication.mdc` for API contracts

---

## File Structure

### Backend Files
| File | Responsibility |
|------|----------------|
| `packages/db/prisma/schema.prisma` | Add OR number fields |
| `packages/server/src/controllers/documentController.ts` | Create Document + Order |
| `packages/server/src/routes/documents.ts` | Update routes |

### Frontend Files
| File | Responsibility |
|------|----------------|
| `packages/desktop/src/services/documents.ts` | API calls |
| `packages/desktop/src/pages/Document.tsx` | Main page with dynamic forms |
| `packages/desktop/src/config/documents.tsx` | Document type configs |
| `packages/desktop/src/components/templates/*.tsx` | Document templates |

---

### Task 1: Database Schema Update

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Consumes: None
- Produces: Updated schema with OR number fields

- [ ] **Step 1: Add OR number fields to Order model**

```prisma
model Order {
  id         String   @id @default(cuid())
  displayId  Int      @unique @default(autoincrement()) @map("display_id")
  orNumber   String   @unique @map("or_number") @db.VarChar(20)
  orderDate  DateTime @map("order_date")
  amount     Decimal  @default(0) @db.Decimal(10, 2)
  createdAt  DateTime @default(now()) @map("created_at")

  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id])

  residentId String   @map("resident_id")
  resident   Resident @relation(fields: [residentId], references: [id])

  documentId String   @unique @map("document_id")
  document   Document @relation(fields: [documentId], references: [id])

  @@map("orders")
}
```

- [ ] **Step 2: Add document number field to Document model**

```prisma
model Document {
  id             String   @id @default(cuid())
  displayId      Int      @unique @default(autoincrement()) @map("display_id")
  documentNumber String   @unique @map("document_number") @db.VarChar(20)
  issueDate      DateTime @map("issue_date") @db.Date
  purpose        String?  @db.VarChar(255)
  validityPeriod String?  @map("validity_period") @db.VarChar(50)
  createdAt      DateTime @default(now()) @map("created_at")

  documentTypeId String       @map("document_type_id")
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id])

  order          Order?
  signers        DocumentSigner[]

  @@map("documents")
}
```

- [ ] **Step 3: Run migration**

```bash
pnpm db:migrate --name "add-or-number-document-number"
```

- [ ] **Step 4: Generate Prisma client**

```bash
pnpm db:generate
```

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): add OR number and document number fields"
```

---

### Task 2: Backend - Document Controller Update

**Files:**
- Modify: `packages/server/src/controllers/documentController.ts`

**Interfaces:**
- Consumes: Updated Prisma schema
- Produces: `createDocument` creates Document + Order

- [ ] **Step 1: Update imports**

```typescript
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";
import { logCreate } from "../services/auditService.js";
```

- [ ] **Step 2: Add OR number generation function**

```typescript
async function generateOrNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orNumber: true },
  });

  let sequence = 1;
  if (lastOrder?.orNumber) {
    const lastSeq = parseInt(lastOrder.orNumber.split("-").pop() || "0", 10);
    sequence = lastSeq + 1;
  }

  return `${year}-418-${sequence.toString().padStart(5, "0")}`;
}
```

- [ ] **Step 3: Add document number generation function**

```typescript
async function generateDocumentNumber(): Promise<string> {
  const lastDoc = await prisma.document.findFirst({
    orderBy: { createdAt: "desc" },
    select: { documentNumber: true },
  });

  let sequence = 1;
  if (lastDoc?.documentNumber) {
    const lastSeq = parseInt(lastDoc.documentNumber.replace("DOC-", ""), 10);
    sequence = lastSeq + 1;
  }

  return `DOC-${sequence.toString().padStart(5, "0")}`;
}
```

- [ ] **Step 4: Update createDocument function**

```typescript
export async function createDocument(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    const { residentId, documentTypeId, purpose, validityPeriod } = req.body;

    if (!residentId || !documentTypeId) {
      return res.status(400).json({ error: "residentId and documentTypeId are required" });
    }

    const documentType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
    });

    if (!documentType) {
      return res.status(404).json({ error: "Document type not found" });
    }

    const [documentNumber, orNumber] = await Promise.all([
      generateDocumentNumber(),
      generateOrNumber(),
    ]);

    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          documentNumber,
          issueDate: new Date(),
          purpose,
          validityPeriod,
          documentTypeId,
        },
      });

      const order = await tx.order.create({
        data: {
          orNumber,
          orderDate: new Date(),
          amount: documentType.amount,
          userId: userId!,
          residentId,
          documentId: document.id,
        },
      });

      return { document, order };
    });

    if (userId) {
      await logCreate("documents", result.document.id, userId, {
        documentNumber,
        orNumber,
        purpose,
      });
    }

    const fullDocument = await prisma.document.findUnique({
      where: { id: result.document.id },
      include: {
        documentType: true,
        order: true,
      },
    });

    res.status(201).json(fullDocument);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd packages/server && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/controllers/documentController.ts
git commit -m "feat(server): implement document + order creation with OR number"
```

---

### Task 3: Frontend - Update Document Service

**Files:**
- Modify: `packages/desktop/src/services/documents.ts`

**Interfaces:**
- Consumes: Backend API response
- Produces: Updated service functions

- [ ] **Step 1: Update service**

```typescript
import { api } from "./api";

export interface DocumentRecord {
  id: string;
  displayId: number;
  documentNumber: string;
  issueDate: string;
  purpose: string;
  validityPeriod: string;
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

export interface CreateDocumentPayload {
  residentId: string;
  documentTypeId: string;
  purpose: string;
  validityPeriod?: string;
}

export const documentsService = {
  getAll: () => api.get<DocumentRecord[]>("/documents"),
  getById: (id: string) => api.get<DocumentRecord>(`/documents/${id}`),
  create: (data: CreateDocumentPayload) =>
    api.post<DocumentRecord>("/documents", data),
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/documents.ts
git commit -m "feat(frontend): update document service with proper types"
```

---

### Task 4: Frontend - Refactor Document Page with Dynamic Forms

**Files:**
- Modify: `packages/desktop/src/pages/Document.tsx`
- Modify: `packages/desktop/src/config/documents.tsx`

**Interfaces:**
- Consumes: `documentsService`, `residentsService`
- Produces: Dynamic form based on document type

- [ ] **Step 1: Update documents config with dynamic fields**

```typescript
import React from 'react';
import { DocumentConfig } from '@/types';
import BusinessClearanceTemplate from '@/components/templates/BusinessClearanceTemplate';
import BusinessPermitTemplate from '@/components/templates/BusinessPermitTemplate';
import IndigencyTemplate from '@/components/templates/IndigencyTemplate';

export const documentConfigs: DocumentConfig[] = [
  {
    id: 'barangay-business-clearance',
    name: 'Barangay Business Clearance',
    Template: BusinessClearanceTemplate,
    fields: [
      { key: 'businessName', label: 'Business Name', type: 'text', source: 'input', placeholder: 'e.g. Sari-Sari Store', required: true, width: 'full' },
      { key: 'businessAddress', label: 'Business Address', type: 'text', source: 'input', placeholder: 'Complete business address', residentAttribute: 'address', required: true, width: 'full' },
      { key: 'natureOfBusiness', label: 'Nature of Business', type: 'text', source: 'input', placeholder: 'e.g. Retail', required: true, width: 'full' },
      { key: 'ownershipType', label: 'Type of Ownership', type: 'select', source: 'input', options: ['Sole Proprietorship', 'Partnership', 'Corporation', 'Cooperative'], defaultValue: 'Sole Proprietorship', width: 'full' },
      { key: 'amountPaid', label: 'Amount Paid', type: 'currency', source: 'system', defaultValue: '500', width: 'full' }
    ]
  },
  {
    id: 'business-permit',
    name: 'Business Permit',
    Template: BusinessPermitTemplate,
    fields: [
      { key: 'businessType', label: 'Business Type', type: 'text', source: 'input', placeholder: 'e.g. House Space Rental', required: true, width: 'full' },
      { key: 'businessAddress', label: 'Business Address', type: 'text', source: 'input', placeholder: 'Complete business address', residentAttribute: 'address', required: true, width: 'full' },
      { key: 'tradeName', label: 'Trade Name', type: 'text', source: 'input', placeholder: 'e.g. NOEH House Space Rental', required: true, width: 'full' },
      { key: 'validUntil', label: 'Valid Until', type: 'text', source: 'input', defaultValue: 'December 31, 2026', width: 'full' },
      { key: 'busNo', label: 'Business Number', type: 'text', source: 'input', placeholder: 'e.g. 2026-418-0006', width: 'full' },
      { key: 'amountPaid', label: 'Amount Paid', type: 'currency', source: 'system', defaultValue: '500', width: 'full' }
    ]
  },
  {
    id: 'certificate-of-indigency',
    name: 'Certificate of Indigency',
    Template: IndigencyTemplate,
    fields: [
      { key: 'address', label: 'Resident Address', type: 'text', source: 'input', residentAttribute: 'address', required: true, width: 'full' },
      { key: 'purpose', label: 'Purpose', type: 'text', source: 'input', placeholder: 'e.g. Medical Assistance', required: true, width: 'full' },
      { key: 'day', label: 'Day', type: 'text', source: 'input', placeholder: 'e.g. 21st', width: 'half' },
      { key: 'month', label: 'Month', type: 'text', source: 'input', placeholder: 'e.g. January', width: 'half' },
      { key: 'year', label: 'Year', type: 'text', source: 'input', defaultValue: '2026', width: 'half' },
      { key: 'controlNo', label: 'Control Number', type: 'text', source: 'input', placeholder: 'e.g. 2026-418-0001', width: 'half' },
      { key: 'amountPaid', label: 'Amount Paid', type: 'currency', source: 'system', defaultValue: '0', width: 'full' }
    ]
  },
  {
    id: 'barangay-clearance',
    name: 'Barangay Clearance',
    Template: ({ data }) => <div>Template for Barangay Clearance (Coming Soon)</div>,
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'text', source: 'input', placeholder: 'e.g. Employment', required: true, width: 'full' },
      { key: 'amountPaid', label: 'Amount Paid', type: 'currency', source: 'system', defaultValue: '200', width: 'full' }
    ]
  },
  {
    id: 'certificate-of-residency',
    name: 'Certificate of Residency',
    Template: ({ data }) => <div>Template for Certificate of Residency (Coming Soon)</div>,
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'text', source: 'input', placeholder: 'e.g. School Enrollment', required: true, width: 'full' },
      { key: 'amountPaid', label: 'Amount Paid', type: 'currency', source: 'system', defaultValue: '150', width: 'full' }
    ]
  }
];

export const getDocumentConfig = (name: string): DocumentConfig | undefined => {
  return documentConfigs.find(doc => doc.name === name);
};
```

- [ ] **Step 2: Refactor Document.tsx to fetch real residents**

Replace mock residents with API call:

```typescript
import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, FileText, User, Calendar, MapPin, CheckCircle, Printer, ArrowLeft } from 'lucide-react';
import ContentCard from '@/components/ui/ContentCard';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { getDocumentConfig } from '@/config/documents';
import { DocumentConfig } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { useQuery } from '@tanstack/react-query';
import { residentsService } from '@/services/residents';
import { documentsService } from '@/services/documents';

const Document: React.FC = () => {
  const { settings } = useSettings();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResident, setSelectedResident] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [otherPurpose, setOtherPurpose] = useState('');
  const [documentType, setDocumentType] = useState('Barangay Business Clearance');

  const [activeConfig, setActiveConfig] = useState<DocumentConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Fetch real residents
  const { data: residentsData } = useQuery({
    queryKey: ['residents', { pageSize: 1000 }],
    queryFn: () => residentsService.list({ pageSize: 1000 }),
  });

  const residents = residentsData?.data ?? [];

  const getFullName = (r: any) => `${r.firstName} ${r.middleName ? r.middleName + '. ' : ''}${r.lastName}`;

  const filteredResidents = residents.filter(r =>
    getFullName(r).toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.length > 0
  );

  // ... rest of the component
};
```

- [ ] **Step 3: Update handleProceed to create document via API**

```typescript
const handleProceed = async () => {
  const config = getDocumentConfig(documentType);
  if (!config) {
    alert('Configuration for this document type not found.');
    return;
  }

  if (!selectedResidentId) {
    alert('Please select a resident.');
    return;
  }

  try {
    const resident = residents.find(r => r.id === selectedResidentId);
    if (!resident) return;

    // Find document type ID from config
    const documentTypeConfig = config;

    // Create document via API
    const result = await documentsService.create({
      residentId: selectedResidentId,
      documentTypeId: documentTypeConfig.id,
      purpose: purpose === 'Other' ? otherPurpose : purpose,
    });

    // Set form data for template
    const initialData: Record<string, any> = {
      selectedResident: getFullName(resident),
      purpose: purpose === 'Other' ? otherPurpose : purpose,
      dateIssued: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      barangayName: settings.barangayName,
      municipality: settings.municipality,
      province: settings.province,
      punongBarangay: settings.punongBarangay,
      orNumber: result.order?.orNumber,
      documentNumber: result.documentNumber,
    };

    config.fields.forEach(field => {
      if (field.residentAttribute && resident && (resident as any)[field.residentAttribute]) {
        initialData[field.key] = (resident as any)[field.residentAttribute];
      } else if (field.defaultValue) {
        initialData[field.key] = field.defaultValue;
      }
    });

    setFormData(initialData);
    setActiveConfig(config);
    setStep(2);
  } catch (error) {
    alert('Failed to create document. Please try again.');
  }
};
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/pages/Document.tsx packages/desktop/src/config/documents.tsx
git commit -m "feat(frontend): refactor document page with real data and dynamic forms"
```

---

### Task 5: Update Templates with OR Number

**Files:**
- Modify: `packages/desktop/src/components/templates/BusinessClearanceTemplate.tsx`
- Modify: `packages/desktop/src/components/templates/BusinessPermitTemplate.tsx`
- Modify: `packages/desktop/src/components/templates/IndigencyTemplate.tsx`

**Interfaces:**
- Consumes: `data.orNumber`, `data.documentNumber`
- Produces: Templates display OR Number

- [ ] **Step 1: Update BusinessClearanceTemplate**

Add OR Number to footer section:

```typescript
{/* OR Details */}
<div className="mt-24 text-[9pt] font-mono text-gray-600">
  <div className="grid grid-cols-[100px_1fr] gap-1">
    <span>OR Number:</span>
    <span>{data.orNumber || 'N/A'}</span>
  </div>
  <div className="grid grid-cols-[100px_1fr] gap-1">
    <span>Doc Number:</span>
    <span>{data.documentNumber || 'N/A'}</span>
  </div>
  <div className="grid grid-cols-[100px_1fr] gap-1">
    <span>Amount Paid:</span>
    <span>₱ {data.amountPaid || '0'}.00</span>
  </div>
</div>
```

- [ ] **Step 2: Update BusinessPermitTemplate**

Same OR Number footer update.

- [ ] **Step 3: Update IndigencyTemplate**

Same OR Number footer update.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/components/templates/*.tsx
git commit -m "feat(templates): add OR Number to all document templates"
```

---

### Task 6: Test the Complete Flow

**Files:**
- None (testing only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Working document issuance

- [ ] **Step 1: Start the server**

```bash
pnpm dev:server
```

- [ ] **Step 2: Start the desktop app**

```bash
pnpm dev:desktop
```

- [ ] **Step 3: Test document issuance**

1. Go to Document page
2. Select a real resident from the dropdown
3. Choose "Business Permit" as document type
4. Fill in the purpose
5. Click "Proceed to Editor"
6. Verify dynamic fields appear based on document type
7. Fill in the required fields
8. Click "Issue & Print"
9. Verify OR Number appears on the document
10. Check database for Document + Order records

- [ ] **Step 4: Verify database records**

```bash
pnpm db:studio
```

Check:
- `documents` table has new record with `document_number`
- `orders` table has new record with `or_number`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verify document issuance flow works end-to-end"
```

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | Database schema update | schema.prisma |
| 2 | Backend controller | documentController.ts |
| 3 | Frontend service | documents.ts |
| 4 | Document page refactor | Document.tsx, documents.tsx |
| 5 | Template updates | *.tsx templates |
| 6 | End-to-end testing | None |

## Expected Outcome

After completing all tasks:
- Residents are fetched from real API
- Document + Order records are created on issuance
- OR Number is generated and displayed on documents
- Dynamic form fields adapt based on document type
- Transaction Section can display real data

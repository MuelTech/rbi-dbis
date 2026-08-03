# Demographic PDF Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate PDF reports for residents filtered by demographic criteria for barangay programs.

**Architecture:** Backend endpoint filters residents by criteria, frontend generates PDF with jspdf-autotable.

**Tech Stack:** Express, Prisma, React, jspdf, jspdf-autotable

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Follow existing code patterns

---

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/desktop/package.json` | Add jspdf dependencies |
| `packages/server/src/controllers/reportController.ts` | Filter residents endpoint |
| `packages/server/src/routes/report.ts` | Report routes |
| `packages/desktop/src/services/report.ts` | Report service |
| `packages/desktop/src/utils/pdfGenerator.ts` | PDF generation utility |
| `packages/desktop/src/pages/Dashboard.tsx` | Add PDF button and filters |

---

### Task 1: Install jspdf Dependencies

**Files:**
- Modify: `packages/desktop/package.json`

**Interfaces:**
- Consumes: None
- Produces: jspdf available for use

- [ ] **Step 1: Install dependencies**

```bash
cd packages/desktop
npm install jspdf jspdf-autotable
```

- [ ] **Step 2: Commit**

```bash
git add packages/desktop/package.json packages/desktop/package-lock.json
git commit -m "feat: add jspdf dependencies for PDF generation"
```

---

### Task 2: Backend - Report Controller

**Files:**
- Create: `packages/server/src/controllers/reportController.ts`

**Interfaces:**
- Consumes: Prisma Resident model
- Produces: `getFilteredResidents` function

- [ ] **Step 1: Create reportController.ts**

Create `packages/server/src/controllers/reportController.ts`:

```typescript
import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";

export async function getFilteredResidents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sex = req.query.sex as string;
    const isVoter = req.query.isVoter as string;
    const isPwd = req.query.isPwd as string;
    const isSoloParent = req.query.isSoloParent as string;
    const isFamilyHead = req.query.isFamilyHead as string;
    const studentType = req.query.studentType as string;
    const status = req.query.status as string;
    const ageFrom = parseInt(req.query.ageFrom as string) || 0;
    const ageTo = parseInt(req.query.ageTo as string) || 150;

    const where: Prisma.ResidentWhereInput = {
      statusType: "Alive",
    };

    if (sex) where.sex = sex as any;
    if (isVoter === "true") where.isVoter = true;
    if (isVoter === "false") where.isVoter = false;
    if (isPwd === "true") where.isPwd = true;
    if (isSoloParent === "true") where.isSoloParent = true;
    if (studentType) where.studentType = studentType;
    if (status) where.statusType = status as any;

    // Family Head filter
    if (isFamilyHead === "true") {
      where.familyHead = { isNot: null };
    }

    // Age range filter
    if (ageFrom > 0 || ageTo < 150) {
      const today = new Date();
      const maxDob = new Date(today.getFullYear() - ageFrom, today.getMonth(), today.getDate());
      const minDob = new Date(today.getFullYear() - ageTo, today.getMonth(), today.getDate());
      
      where.dateOfBirth = {
        gte: minDob,
        lte: maxDob,
      };
    }

    const residents = await prisma.resident.findMany({
      where,
      include: {
        familyHead: {
          include: {
            household: true,
            address: true,
          },
        },
        familyMember: {
          include: {
            family: {
              include: {
                household: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    // Map to response format
    const data = residents.map((r, index) => {
      const family = r.familyHead ?? r.familyMember?.family;
      const address = family?.address;
      
      return {
        no: index + 1,
        lastName: r.lastName,
        firstName: r.firstName,
        middleName: r.middleName || "",
        age: computeAge(r.dateOfBirth),
        sex: r.sex,
        address: address
          ? `${address.houseNo} ${address.streetName}, ${address.alleyName}`
          : "",
        contact: r.contactNumber || "",
        status: r.statusType,
      };
    });

    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
}

function computeAge(dateOfBirth: Date | null): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/server && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/reportController.ts
git commit -m "feat(server): add getFilteredResidents endpoint for PDF reports"
```

---

### Task 3: Backend - Report Route

**Files:**
- Create: `packages/server/src/routes/report.ts`
- Modify: `packages/server/src/index.ts`

**Interfaces:**
- Consumes: `getFilteredResidents` function
- Produces: Route registered

- [ ] **Step 1: Create report.ts route**

Create `packages/server/src/routes/report.ts`:

```typescript
import { Router } from "express";
import { getFilteredResidents } from "../controllers/reportController.js";

export const reportRouter = Router();

reportRouter.get("/residents", getFilteredResidents);
```

- [ ] **Step 2: Register route in index.ts**

Add to `packages/server/src/index.ts`:

```typescript
import { reportRouter } from "./routes/report.js";

// After other routes
app.use("/api/report", requireAuth, reportRouter);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd packages/server && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/routes/report.ts packages/server/src/index.ts
git commit -m "feat(server): add /report/residents route"
```

---

### Task 4: Frontend - Report Service

**Files:**
- Create: `packages/desktop/src/services/report.ts`

**Interfaces:**
- Consumes: Backend API response
- Produces: `getFilteredResidents` service function

- [ ] **Step 1: Create report.ts service**

Create `packages/desktop/src/services/report.ts`:

```typescript
import { api } from "./api";

export interface ResidentReport {
  no: number;
  lastName: string;
  firstName: string;
  middleName: string;
  age: number;
  sex: string;
  address: string;
  contact: string;
  status: string;
}

export interface ReportResponse {
  data: ResidentReport[];
  total: number;
}

export interface ReportFilters {
  sex?: string;
  isVoter?: string;
  isPwd?: string;
  isSoloParent?: string;
  isFamilyHead?: string;
  studentType?: string;
  status?: string;
  ageFrom?: number;
  ageTo?: number;
}

export const reportService = {
  getFilteredResidents: (filters: ReportFilters) => {
    const params = new URLSearchParams();
    if (filters.sex) params.set("sex", filters.sex);
    if (filters.isVoter) params.set("isVoter", filters.isVoter);
    if (filters.isPwd) params.set("isPwd", filters.isPwd);
    if (filters.isSoloParent) params.set("isSoloParent", filters.isSoloParent);
    if (filters.isFamilyHead) params.set("isFamilyHead", filters.isFamilyHead);
    if (filters.studentType) params.set("studentType", filters.studentType);
    if (filters.status) params.set("status", filters.status);
    if (filters.ageFrom) params.set("ageFrom", filters.ageFrom.toString());
    if (filters.ageTo) params.set("ageTo", filters.ageTo.toString());
    const qs = params.toString();
    return api.get<ReportResponse>(`/report/residents${qs ? `?${qs}` : ""}`);
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/report.ts
git commit -m "feat(frontend): add report service for PDF generation"
```

---

### Task 5: Frontend - PDF Generator Utility

**Files:**
- Create: `packages/desktop/src/utils/pdfGenerator.ts`

**Interfaces:**
- Consumes: ResidentReport data
- Produces: PDF file download

- [ ] **Step 1: Create pdfGenerator.ts**

Create `packages/desktop/src/utils/pdfGenerator.ts`:

```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ResidentReport } from "@/services/report";

interface PdfOptions {
  title: string;
  data: ResidentReport[];
  generatedBy: string;
}

export function generateResidentReport(options: PdfOptions): void {
  const { title, data, generatedBy } = options;
  
  const doc = new jsPDF("l", "mm", "a4"); // Landscape A4
  
  // Header
  doc.setFontSize(10);
  doc.text("Republic of the Philippines", 148, 15, { align: "center" });
  doc.text("City of Manila", 148, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("BARANGAY 418 ZONE 43 DISTRICT IV", 148, 27, { align: "center" });
  doc.setFontSize(10);
  doc.text("Office of the Barangay Chairman", 148, 32, { align: "center" });
  
  // Title
  doc.setFontSize(14);
  doc.text(title, 148, 45, { align: "center" });
  
  // Table
  const tableData = data.map((r) => [
    r.no.toString(),
    r.lastName,
    r.firstName,
    r.middleName,
    r.age.toString(),
    r.sex,
    r.address,
    r.contact,
    r.status,
    "", // Signature column (empty)
  ]);
  
  autoTable(doc, {
    startY: 55,
    head: [["No.", "Last Name", "First Name", "Middle Name", "Age", "Sex", "Address", "Contact", "Status", "Signature"]],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 50 },
      7: { cellWidth: 25 },
      8: { cellWidth: 18 },
      9: { cellWidth: 25 },
    },
    margin: { top: 55, left: 10, right: 10 },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.text(`Total Count: ${data.length}`, 10, pageHeight - 15);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 10);
    doc.text(`Generated by: ${generatedBy}`, 148, pageHeight - 10, { align: "center" });
  }
  
  // Download
  doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/utils/pdfGenerator.ts
git commit -m "feat(frontend): add PDF generator utility with jspdf"
```

---

### Task 6: Frontend - Dashboard PDF Button

**Files:**
- Modify: `packages/desktop/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `reportService`, `generateResidentReport`
- Produces: PDF button and filter modal

- [ ] **Step 1: Add imports and state**

Add to Dashboard.tsx:

```typescript
import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { reportService } from '@/services/report';
import { generateResidentReport } from '@/utils/pdfGenerator';
import { useAuth } from '@/context/AuthContext';
```

Add state:

```typescript
const [showFilterModal, setShowFilterModal] = useState(false);
const [reportFilters, setReportFilters] = useState({
  sex: '',
  isVoter: '',
  isPwd: '',
  isSoloParent: '',
  isFamilyHead: '',
  studentType: '',
  status: '',
  ageFrom: 0,
  ageTo: 150,
});
const [isGenerating, setIsGenerating] = useState(false);
```

- [ ] **Step 2: Add PDF generation function**

```typescript
const handleGeneratePDF = async (title: string) => {
  setIsGenerating(true);
  try {
    const result = await reportService.getFilteredResidents(reportFilters);
    generateResidentReport({
      title,
      data: result.data,
      generatedBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
    });
    setShowFilterModal(false);
  } catch (err) {
    alert('Failed to generate report');
  } finally {
    setIsGenerating(false);
  }
};
```

- [ ] **Step 3: Add PDF button and filter modal to JSX**

Add a PDF button in the Transaction Section header area:

```tsx
<button
  onClick={() => setShowFilterModal(true)}
  className="bg-red-500 hover:bg-red-600 text-white px-3 xl:px-4 py-1.5 rounded-lg text-[9px] xl:text-[10px] font-bold transition-colors tracking-wide uppercase flex items-center gap-1"
>
  <FileDown size={12} />
  PDF Report
</button>
```

- [ ] **Step 4: Add filter modal JSX**

```tsx
{showFilterModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Generate PDF Report</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Report Title</label>
          <input
            type="text"
            id="reportTitle"
            defaultValue="List of Residents"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sex</label>
            <select
              value={reportFilters.sex}
              onChange={(e) => setReportFilters({ ...reportFilters, sex: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={reportFilters.status}
              onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All</option>
              <option value="Alive">Active</option>
              <option value="Deceased">Deceased</option>
              <option value="MovedOut">Moved Out</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reportFilters.isVoter === 'true'}
              onChange={(e) => setReportFilters({ ...reportFilters, isVoter: e.target.checked ? 'true' : '' })}
              className="rounded"
            />
            <span className="text-sm">Voter</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reportFilters.isPwd === 'true'}
              onChange={(e) => setReportFilters({ ...reportFilters, isPwd: e.target.checked ? 'true' : '' })}
              className="rounded"
            />
            <span className="text-sm">PWD</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reportFilters.isSoloParent === 'true'}
              onChange={(e) => setReportFilters({ ...reportFilters, isSoloParent: e.target.checked ? 'true' : '' })}
              className="rounded"
            />
            <span className="text-sm">Solo Parent</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reportFilters.isFamilyHead === 'true'}
              onChange={(e) => setReportFilters({ ...reportFilters, isFamilyHead: e.target.checked ? 'true' : '' })}
              className="rounded"
            />
            <span className="text-sm">Family Head</span>
          </label>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="From"
              value={reportFilters.ageFrom || ''}
              onChange={(e) => setReportFilters({ ...reportFilters, ageFrom: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="To"
              value={reportFilters.ageTo === 150 ? '' : reportFilters.ageTo}
              onChange={(e) => setReportFilters({ ...reportFilters, ageTo: parseInt(e.target.value) || 150 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowFilterModal(false)}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => handleGeneratePDF(document.getElementById('reportTitle')?.value || 'Report')}
          disabled={isGenerating}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/src/pages/Dashboard.tsx
git commit -m "feat(frontend): add PDF report button and filter modal to Dashboard"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install jspdf | package.json |
| 2 | Backend controller | reportController.ts |
| 3 | Backend route | report.ts, index.ts |
| 4 | Frontend service | report.ts |
| 5 | PDF generator | pdfGenerator.ts |
| 6 | Dashboard UI | Dashboard.tsx |

## Expected Outcome

After completing all tasks:
- Users can click "PDF Report" button on Dashboard
- Filter modal shows with all demographic options
- PDF generates with header, table, and footer
- PDF downloads automatically

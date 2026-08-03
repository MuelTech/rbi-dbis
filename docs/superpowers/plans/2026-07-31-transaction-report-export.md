# Transaction Report Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update CSV and PDF export to fetch ALL filtered transactions instead of just the current page.

**Architecture:** Add a new backend endpoint that returns all filtered transactions without pagination. Update frontend export handlers to call this endpoint.

**Tech Stack:** Express.js, Prisma, React, TanStack Query, xlsx, jspdf, jspdf-autotable

## Global Constraints

- Do NOT kill node processes
- Do NOT commit or push to GitHub until user explicitly approves
- PHP peso sign (₱) not supported — use "PHP" text in PDF exports
- Follow existing code patterns in the codebase

---

### Task 1: Backend Export Endpoint

**Files:**
- Modify: `packages/server/src/controllers/dashboardController.ts`
- Modify: `packages/server/src/routes/dashboard.ts`

**Interfaces:**
- Consumes: Existing `getTransactions` logic as reference
- Produces: `getTransactionsExport` function, `GET /transactions/export` route

- [ ] **Step 1: Add getTransactionsExport function**

Add after the existing `getTransactions` function in `dashboardController.ts`:

```typescript
export async function getTransactionsExport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const period = (req.query.period as string) || "month";
    const from = req.query.from as string;
    const to = req.query.to as string;
    const personnelId = req.query.personnelId as string;

    const now = new Date();
    let startDate: Date;

    if (period === "custom" && from && to) {
      startDate = new Date(from);
      now.setTime(new Date(to).getTime());
    } else if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const where: any = {
      orderDate: {
        gte: startDate,
        lte: now,
      },
    };

    if (personnelId && personnelId !== 'All') {
      where.userId = personnelId;
    }

    const [orders, summary] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { orderDate: "desc" },
        include: {
          user: {
            include: { userInfo: true },
          },
          resident: true,
          document: {
            include: { documentType: true },
          },
        },
      }),
      prisma.order.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const data = orders.map((order) => ({
      id: order.id,
      documentId: order.documentId,
      orNumber: order.orNumber,
      orderDate: order.orderDate,
      amount: Number(order.amount),
      personnel: order.user?.userInfo
        ? `${order.user.userInfo.firstName} ${order.user.userInfo.lastName}`
        : order.user?.username ?? "Unknown",
      resident: `${order.resident.firstName} ${order.resident.lastName}`,
      documentType: order.document?.documentType?.documentName ?? "Unknown",
    }));

    res.json({
      data,
      summary: {
        accumulatedFee: Number(summary._sum.amount) || 0,
        totalTransactions: summary._count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Add route**

Add to `packages/server/src/routes/dashboard.ts`:

```typescript
import { getTransactionsExport } from "../controllers/dashboardController";

// Add before the existing /transactions route
dashboardRouter.get("/transactions/export", getTransactionsExport);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project packages/server/tsconfig.json`
Expected: Only pre-existing errors (householdController, userController), no new errors

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/controllers/dashboardController.ts packages/server/src/routes/dashboard.ts
git commit -m "feat: add transactions export endpoint"
```

---

### Task 2: Frontend Service

**Files:**
- Modify: `packages/desktop/src/services/dashboard.ts`

**Interfaces:**
- Consumes: Backend `GET /transactions/export` endpoint
- Produces: `getTransactionsExport()` function

- [ ] **Step 1: Add getTransactionsExport function**

Add after the existing `getTransactions` function in `dashboard.ts`:

```typescript
getTransactionsExport: (params: {
  period?: string;
  from?: string;
  to?: string;
  personnelId?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.personnelId) searchParams.set("personnelId", params.personnelId);
  const qs = searchParams.toString();
  return api.get<TransactionResponse>(`/dashboard/transactions/export${qs ? `?${qs}` : ""}`);
},
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project packages/desktop/tsconfig.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/dashboard.ts
git commit -m "feat: add transactions export service function"
```

---

### Task 3: Update Export Handlers

**Files:**
- Modify: `packages/desktop/src/components/layout/TransactionSection.tsx`

**Interfaces:**
- Consumes: `dashboardService.getTransactionsExport()` from Task 2
- Produces: Updated `handleExportCSV` and `handleExportPDF` functions

- [ ] **Step 1: Add loading state for exports**

Add state after the existing state declarations:

```typescript
const [isExporting, setIsExporting] = useState(false);
```

- [ ] **Step 2: Update handleExportCSV**

Replace the existing `handleExportCSV` function:

```typescript
const handleExportCSV = async () => {
  setIsExporting(true);
  try {
    const exportData = await dashboardService.getTransactionsExport({
      period: activeTab === 'Custom' ? undefined : activeTab.toLowerCase(),
      personnelId: selectedPersonnelId === 'All' ? undefined : selectedPersonnelId,
      from: activeTab === 'Custom' ? startDate : undefined,
      to: activeTab === 'Custom' ? endDate : undefined,
    });

    const csvData = exportData.data.map((t) => ({
      'OR Number': t.orNumber,
      'Date Issued': new Date(t.orderDate).toLocaleDateString('en-GB'),
      'Personnel': t.personnel,
      'Resident': t.resident,
      'Type': t.documentType,
      'Fee': t.amount,
    }));

    csvData.push({
      'OR Number': '',
      'Date Issued': '',
      'Personnel': '',
      'Resident': 'TOTAL',
      'Type': `${exportData.summary.totalTransactions} transactions`,
      'Fee': exportData.summary.accumulatedFee,
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(csvData);

    ws['!cols'] = [
      { wch: 18 },
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `Transactions_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
  } finally {
    setIsExporting(false);
  }
};
```

- [ ] **Step 3: Update handleExportPDF**

Replace the existing `handleExportPDF` function:

```typescript
const handleExportPDF = async () => {
  setIsExporting(true);
  try {
    const exportData = await dashboardService.getTransactionsExport({
      period: activeTab === 'Custom' ? undefined : activeTab.toLowerCase(),
      personnelId: selectedPersonnelId === 'All' ? undefined : selectedPersonnelId,
      from: activeTab === 'Custom' ? startDate : undefined,
      to: activeTab === 'Custom' ? endDate : undefined,
    });

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(10);
    doc.text('Republic of the Philippines', pageWidth / 2, 15, { align: 'center' });
    doc.text('City of Manila', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('BARANGAY 418 ZONE 43 DISTRICT IV', pageWidth / 2, 27, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Office of the Barangay Chairman', pageWidth / 2, 32, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Document Transactions Report', pageWidth / 2, 45, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Period: ${activeTab}`, 10, 55);
    doc.text(`Personnel: ${selectedPersonnel}`, 10, 60);

    const tableData = exportData.data.map((t) => [
      t.orNumber,
      new Date(t.orderDate).toLocaleDateString('en-GB'),
      t.personnel,
      t.resident,
      t.documentType,
      `PHP ${t.amount}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['OR Number', 'Date', 'Personnel', 'Resident', 'Type', 'Fee']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 15 },
      },
      margin: { top: 70, left: 10, right: 10 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Transactions: ${exportData.summary.totalTransactions}`, 10, finalY + 10);
    doc.text(`Accumulated Fee: PHP ${exportData.summary.accumulatedFee.toLocaleString()}`, 10, finalY + 16);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 10);
      doc.text(`Generated by: ${user ? `${user.firstName} ${user.lastName}` : 'Unknown'}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
    }

    doc.save(`Transactions_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  } finally {
    setIsExporting(false);
  }
};
```

- [ ] **Step 4: Update export buttons with loading state**

Replace the CSV and PDF buttons:

```typescript
<button
  onClick={handleExportCSV}
  disabled={isExporting}
  className="bg-green-400 hover:bg-green-500 text-white px-3 xl:px-4 py-1.5 rounded-lg text-[9px] xl:text-[10px] font-bold transition-colors tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isExporting ? 'Exporting...' : 'CSV'}
</button>
<button
  onClick={handleExportPDF}
  disabled={isExporting}
  className="bg-red-500 hover:bg-red-600 text-white px-3 xl:px-4 py-1.5 rounded-lg text-[9px] xl:text-[10px] font-bold transition-colors tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isExporting ? 'Exporting...' : 'PDF'}
</button>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project packages/desktop/tsconfig.json`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/src/components/layout/TransactionSection.tsx
git commit -m "feat: update transaction export to fetch all filtered data"
```

---

### Task 4: End-to-End Testing

**Files:**
- None (manual testing)

- [ ] **Step 1: Restart backend server**

- [ ] **Step 2: Test CSV export**
  1. Open Dashboard
  2. Verify TransactionSection loads with Day period
  3. Click CSV button
  4. Verify file downloads with all transactions for the period
  5. Open CSV in Excel — verify columns and totals row

- [ ] **Step 3: Test PDF export**
  1. Click PDF button
  2. Verify PDF downloads
  3. Open PDF — verify header, table, totals, footer
  4. Verify table spans multiple pages if >20 rows

- [ ] **Step 4: Test with filters**
  1. Change period to Week
  2. Select a specific personnel
  3. Export CSV and PDF
  4. Verify only filtered data is exported

- [ ] **Step 5: Test with search**
  1. Type a name in search box
  2. Export CSV and PDF
  3. Verify search results are exported (search not shown in header)

- [ ] **Step 6: Verify loading state**
  1. Click CSV or PDF button
  2. Verify button shows "Exporting..." while fetching
  3. Verify button is disabled during export

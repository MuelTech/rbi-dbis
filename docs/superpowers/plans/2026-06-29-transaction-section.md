# Transaction Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock data in TransactionSection with real transaction data from the Order table.

**Architecture:** Backend endpoint queries Order table with date filters, frontend fetches and displays data with time period filters (Day/Week/Month/Custom).

**Tech Stack:** Express, Prisma, React, TanStack Query, TypeScript

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Follow `.agent/rules/design-system.mdc` for UI patterns
- Follow `.agent/rules/api-communication.mdc` for API contracts

---

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/server/src/controllers/dashboardController.ts` | Add getTransactions function |
| `packages/server/src/routes/dashboard.ts` | Add /transactions route |
| `packages/desktop/src/services/dashboard.ts` | Add getTransactions service |
| `packages/desktop/src/components/layout/TransactionSection.tsx` | Replace mock data with API calls |

---

### Task 1: Backend - Add Transactions Endpoint

**Files:**
- Modify: `packages/server/src/controllers/dashboardController.ts`

**Interfaces:**
- Consumes: Prisma Order model
- Produces: `getTransactions` function

- [ ] **Step 1: Add getTransactions function**

Add this function to `dashboardController.ts`:

```typescript
export async function getTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const period = (req.query.period as string) || "month";
    const from = req.query.from as string;
    const to = req.query.to as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));

    // Calculate date range based on period
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
      // Default: month
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const where = {
      orderDate: {
        gte: startDate,
        lte: now,
      },
    };

    const skip = (page - 1) * pageSize;

    const [total, orders, summary] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
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
      orNumber: order.orNumber,
      orderDate: order.orderDate,
      amount: Number(order.amount),
      personnel: order.user?.userInfo
        ? `${order.user.userInfo.firstName} ${order.user.userInfo.lastName}`
        : order.user?.username ?? "Unknown",
      resident: `${order.resident.firstName} ${order.resident.lastName}`,
      documentType: order.document?.documentType?.documentName ?? "Unknown",
    }));

    const totalPages = Math.ceil(total / pageSize);

    res.json({
      data,
      meta: { page, pageSize, total, totalPages },
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/server && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/dashboardController.ts
git commit -m "feat(server): add getTransactions endpoint for transaction section"
```

---

### Task 2: Backend - Add Route

**Files:**
- Modify: `packages/server/src/routes/dashboard.ts`

**Interfaces:**
- Consumes: `getTransactions` function
- Produces: Route registered

- [ ] **Step 1: Add route**

Add this line to the dashboard router:

```typescript
dashboardRouter.get("/transactions", getTransactions);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/server && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/routes/dashboard.ts
git commit -m "feat(server): add /transactions route to dashboard"
```

---

### Task 3: Frontend - Add Service

**Files:**
- Modify: `packages/desktop/src/services/dashboard.ts`

**Interfaces:**
- Consumes: Backend API response
- Produces: `getTransactions` service function

- [ ] **Step 1: Add Transaction interface and service**

Add to `dashboard.ts`:

```typescript
export interface Transaction {
  id: string;
  orNumber: string;
  orderDate: string;
  amount: number;
  personnel: string;
  resident: string;
  documentType: string;
}

export interface TransactionResponse {
  data: Transaction[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  summary: { accumulatedFee: number; totalTransactions: number };
}

export const dashboardService = {
  // ... existing methods

  getTransactions: (params: {
    period?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set("period", params.period);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    const qs = searchParams.toString();
    return api.get<TransactionResponse>(`/dashboard/transactions${qs ? `?${qs}` : ""}`);
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/dashboard.ts
git commit -m "feat(frontend): add getTransactions service"
```

---

### Task 4: Frontend - Refactor TransactionSection

**Files:**
- Modify: `packages/desktop/src/components/layout/TransactionSection.tsx`

**Interfaces:**
- Consumes: `dashboardService.getTransactions`
- Produces: Functional TransactionSection component

- [ ] **Step 1: Replace mock data with API calls**

Remove the `MOCK_DATA` constant and replace with TanStack Query:

```typescript
import { useQuery } from '@tanstack/react-query';
import { dashboardService, Transaction } from '@/services/dashboard';

// Remove MOCK_DATA constant

const TransactionSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Month');
  const [currentPage, setCurrentPage] = useState(1);
  // ... other state

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { period: activeTab, page: currentPage }],
    queryFn: () => dashboardService.getTransactions({
      period: activeTab.toLowerCase(),
      page: currentPage,
      pageSize: itemsPerPage,
    }),
  });

  const transactions = data?.data ?? [];
  const summary = data?.summary ?? { accumulatedFee: 0, totalTransactions: 0 };
  const totalPages = data?.meta.totalPages ?? 0;

  // ... rest of component using transactions instead of MOCK_DATA
};
```

- [ ] **Step 2: Update table headers**

Replace the table headers:

```tsx
<thead ref={headerRef} className="sticky top-0 bg-white z-10">
  <tr className="border-b border-gray-100">
    <th className="w-[15%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">OR Number</th>
    <th className="w-[15%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Date Issued</th>
    <th className="w-[12%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Personnel</th>
    <th className="w-[18%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Resident</th>
    <th className="w-[20%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Type</th>
    <th className="w-[10%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Fee</th>
    <th className="w-[10%] text-center py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Action</th>
  </tr>
</thead>
```

- [ ] **Step 3: Update table body**

Replace the table body mapping:

```tsx
<tbody>
  {transactions.map((t) => (
    <tr key={t.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors group" style={{ height: `${rowHeight}px` }}>
      <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 font-medium truncate">{t.orNumber}</td>
      <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate">{new Date(t.orderDate).toLocaleDateString('en-GB')}</td>
      <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate">{t.personnel}</td>
      <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate">{t.resident}</td>
      <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate" title={t.documentType}>{t.documentType}</td>
      <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-900 font-bold truncate">₱{t.amount}</td>
      <td className="px-3 xl:px-4 text-center">
        <button className="text-blue-500 border-2 border-blue-500 rounded-full px-3 xl:px-4 py-1 text-[10px] xl:text-[11px] font-bold hover:bg-blue-50 transition-colors">
          View
        </button>
      </td>
    </tr>
  ))}
  {Array.from({ length: emptyRows }).map((_, index) => (
    <tr key={`empty-${index}`} className="border-b border-gray-50 last:border-none" style={{ height: `${rowHeight}px` }}>
      <td colSpan={7}>&nbsp;</td>
    </tr>
  ))}
</tbody>
```

- [ ] **Step 4: Update summary cards**

Replace the hardcoded summary values:

```tsx
<SummaryCard 
  title="Accumulated Fee" 
  value={`₱${summary.accumulatedFee.toLocaleString()}`} 
  icon={Coins} 
  iconBg="bg-orange-100" 
  iconColor="text-orange-500"
/>
<SummaryCard 
  title="Total Transactions" 
  value={summary.totalTransactions} 
  icon={FileText} 
  iconBg="bg-teal-100" 
  iconColor="text-teal-500"
/>
```

- [ ] **Step 5: Update pagination**

Replace the pagination to use API data:

```tsx
<div className="flex items-center justify-between mt-auto pt-[clamp(0.75rem,1.5vh,1.5rem)] border-t border-gray-50">
   <span className="text-[10px] xl:text-[11px] text-gray-400 font-medium">
     Showing {transactions.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + transactions.length, data?.meta.total ?? 0)} of {data?.meta.total ?? 0}
   </span>
   {/* ... pagination buttons */}
</div>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd packages/desktop && npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add packages/desktop/src/components/layout/TransactionSection.tsx
git commit -m "feat(frontend): refactor TransactionSection to use real data"
```

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | Backend endpoint | dashboardController.ts |
| 2 | Backend route | dashboard.ts |
| 3 | Frontend service | dashboard.ts |
| 4 | Frontend component | TransactionSection.tsx |

## Expected Outcome

After completing all tasks:
- TransactionSection displays real transaction data
- Time period filters work (Day/Week/Month)
- Summary cards show real totals
- Pagination works correctly

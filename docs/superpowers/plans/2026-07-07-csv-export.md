# CSV Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CSV export functionality to Residents page using existing filters.

**Architecture:** When CSV button is clicked, generate CSV file from current filtered data and download.

**Tech Stack:** React, xlsx (already installed)

## Global Constraints

- Node.js 18+
- TypeScript strict mode

---

### Task 1: Add CSV Export Function

**Files:**
- Modify: `packages/desktop/src/pages/Residents.tsx`

**Interfaces:**
- Consumes: `reportService`
- Produces: CSV file download

- [ ] **Step 1: Add xlsx import**

Add to imports:
```typescript
import * as XLSX from 'xlsx';
```

- [ ] **Step 2: Add handleGenerateCSV function**

Add this function after handleGeneratePDF:
```typescript
const handleGenerateCSV = async () => {
    try {
        // Build filters from active page filters
        const filters: any = {};
        
        if (activeFilters.sex.length > 0) {
            filters.sex = activeFilters.sex[0];
        }
        if (activeFilters.voter.includes('Voter')) {
            filters.isVoter = 'true';
        } else if (activeFilters.voter.includes('Non-Voter')) {
            filters.isVoter = 'false';
        }
        if (selectedStatuses.length > 0 && selectedStatuses.length < 3) {
            filters.status = selectedStatuses[0] === 'Active' ? 'Alive' : selectedStatuses[0];
        }
        
        const result = await reportService.getFilteredResidents(filters);
        
        // Prepare data for CSV
        const csvData = result.data.map((r) => ({
            'No.': r.no,
            'Name': `${r.lastName}, ${r.firstName} ${r.middleName}`,
            'Sex': r.sex,
            'Address': r.address,
            'Contact': r.contact,
            'Status': r.status,
        }));
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // No.
            { wch: 40 },  // Name
            { wch: 8 },   // Sex
            { wch: 50 },  // Address
            { wch: 15 },  // Contact
            { wch: 12 },  // Status
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Residents');
        
        // Download
        XLSX.writeFile(wb, `Residents_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
        alert('Failed to generate CSV');
    }
};
```

- [ ] **Step 3: Update CSV button onClick**

Find the CSV button and update it:
```tsx
<button 
    onClick={handleGenerateCSV}
    className="bg-[#22C55E] hover:bg-green-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all uppercase"
>CSV</button>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/pages/Residents.tsx
git commit -m "feat(residents): add CSV export functionality"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add CSV export | Residents.tsx |

## Expected Outcome

After completing the task:
- CSV button generates CSV file using current filters
- CSV downloads automatically
- Columns: No, Name, Sex, Address, Contact, Status

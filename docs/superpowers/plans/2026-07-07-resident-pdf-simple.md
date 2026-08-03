# Resident PDF Report (Simple) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate PDF report from Residents page using existing filters without a modal.

**Architecture:** When PDF button is clicked, use current active filters (Status, Sex, Voter) to generate report immediately.

**Tech Stack:** React, jspdf, jspdf-autotable

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Follow existing code patterns

---

### Task 1: Simplify PDF Report (No Modal)

**Files:**
- Modify: `packages/desktop/src/pages/Residents.tsx`

**Interfaces:**
- Consumes: `reportService`, `generateResidentReport`
- Produces: PDF generation on button click

- [ ] **Step 1: Remove modal-related state**

Remove these state variables:
```typescript
const [showFilterModal, setShowFilterModal] = useState(false);
const [reportFilters, setReportFilters] = useState({...});
const [isGenerating, setIsGenerating] = useState(false);
```

- [ ] **Step 2: Simplify handleGeneratePDF**

Replace the function with:
```typescript
const handleGeneratePDF = async () => {
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
        generateResidentReport({
            title: `List of Residents - ${new Date().toLocaleDateString()}`,
            data: result.data,
            generatedBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        });
    } catch (err) {
        alert('Failed to generate report');
    }
};
```

- [ ] **Step 3: Update PDF button**

Replace the button onClick:
```tsx
<button 
    onClick={handleGeneratePDF}
    className="bg-[#EF4444] hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all uppercase"
>PDF</button>
```

- [ ] **Step 4: Remove filter modal JSX**

Remove the entire `{showFilterModal && (...)}` block at the end of the component.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/src/pages/Residents.tsx
git commit -m "feat(residents): simplify PDF report to use existing filters"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Simplify PDF report | Residents.tsx |

## Expected Outcome

After completing the task:
- PDF button generates report immediately using current filters
- No modal popup
- Report title auto-generated with current date
- Filters from Residents page are applied to report

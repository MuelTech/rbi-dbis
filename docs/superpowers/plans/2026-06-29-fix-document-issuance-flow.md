# Fix Document Issuance Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix document issuance flow so transactions are only created when user clicks "Issue & Print", and reset to step 1 after printing.

**Architecture:** Move API call from handleProceed to handlePrint, add resetForm function, ensure proper flow.

**Tech Stack:** React, TanStack Query, TypeScript

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Follow existing code patterns

---

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/desktop/src/pages/Document.tsx` | Fix issuance flow |

---

### Task 1: Fix Document Issuance Flow

**Files:**
- Modify: `packages/desktop/src/pages/Document.tsx`

**Interfaces:**
- Consumes: `documentsService.create`
- Produces: Fixed flow with reset

- [ ] **Step 1: Read the current file**

Read `packages/desktop/src/pages/Document.tsx` to understand the current structure.

- [ ] **Step 2: Add resetForm function**

Add this function after the state declarations:

```typescript
const resetForm = () => {
  setSearchQuery('');
  setSelectedResident('');
  setSelectedResidentId('');
  setPurpose('');
  setOtherPurpose('');
  setDocumentType('Barangay Business Clearance');
  setActiveConfig(null);
  setFormData({});
};
```

- [ ] **Step 3: Update handleProceed to NOT create transaction**

Replace the `handleProceed` function to only set config and move to step 2 without API call:

```typescript
const handleProceed = () => {
  const config = getDocumentConfig(documentType);
  if (!config) {
    alert('Configuration not found.');
    return;
  }
  if (!selectedResidentId) {
    alert('Please select a resident.');
    return;
  }

  const resident = residents.find(r => r.id === selectedResidentId);
  if (!resident) return;

  // Set config and move to step 2 - NO API call
  setActiveConfig(config);
  
  // Initialize form data with defaults only
  const initialData: Record<string, any> = {
    selectedResident: getFullName(resident),
    purpose: purpose === 'Other' ? otherPurpose : purpose,
    barangayName: settings.barangayName,
    municipality: settings.municipality,
    province: settings.province,
    punongBarangay: settings.punongBarangay,
  };

  config.fields.forEach(field => {
    if (field.residentAttribute) {
      if (field.residentAttribute === 'address' && resident.household) {
        initialData[field.key] = `${resident.household.streetName}, ${resident.household.alley}, Sampaloc, Manila`;
      }
    } else if (field.defaultValue) {
      initialData[field.key] = field.defaultValue;
    }
  });

  setFormData(initialData);
  setStep(2);
};
```

- [ ] **Step 4: Update handlePrint to create transaction**

Replace the `handlePrint` function to create transaction and reset:

```typescript
const handlePrint = async () => {
  if (!selectedResidentId || !activeConfig) return;

  try {
    // Create transaction now
    const result = await documentsService.create({
      residentId: selectedResidentId,
      documentTypeId: activeConfig.id,
      purpose: purpose === 'Other' ? otherPurpose : purpose,
    });

    // Add OR Number to form data for display
    setFormData(prev => ({
      ...prev,
      orNumber: result.order?.orNumber ?? '',
    }));

    // Print
    window.print();

    // Reset after print
    setTimeout(() => {
      resetForm();
      setStep(1);
    }, 500);
  } catch (err) {
    alert('Failed to create document. Please try again.');
  }
};
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/src/pages/Document.tsx
git commit -m "fix(document): create transaction on Issue & Print, reset to step 1 after"
```

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | Fix document issuance flow | Document.tsx |

## Expected Outcome

After completing the task:
- Transaction is only created when user clicks "Issue & Print"
- No orphaned transactions if user cancels
- Form resets to step 1 after printing
- Proper flow: Step 1 → Step 2 → Issue & Print → Back to Step 1

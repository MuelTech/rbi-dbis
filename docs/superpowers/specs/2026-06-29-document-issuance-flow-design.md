# Document Issuance Flow Design

## Overview

Fix the document issuance flow so transactions are only created when the user clicks "Issue & Print", and reset to step 1 after printing.

## Current Problem

- Transaction is created immediately when proceeding to step 2
- If user cancels, orphaned transaction remains in database
- No proper reset after issuing document

## Correct Flow

```
Step 1: Select resident, document type, purpose
        ↓
        Click "Proceed to Editor"
        ↓
Step 2: Fill document details, preview template
        ↓
        Click "Issue & Print"
        ↓
        Transaction CREATED in database
        ↓
        Print dialog opens
        ↓
        After printing completes
        ↓
        Back to Step 1 (form reset, ready for next document)
```

## Changes Required

### 1. Remove Transaction Creation from Step 2

**File:** `packages/desktop/src/pages/Document.tsx`

Move the API call from `handleProceed` to `handlePrint`:

**Before (wrong):**
```typescript
const handleProceed = async () => {
  // Creates transaction immediately ❌
  const result = await documentsService.create({...});
  setStep(2);
};
```

**After (correct):**
```typescript
const handleProceed = () => {
  // Just preview - no API call
  setStep(2);
};

const handlePrint = async () => {
  // Create transaction only when printing
  const result = await documentsService.create({...});
  window.print();
  // After print, reset to step 1
  setTimeout(() => {
    setStep(1);
    resetForm();
  }, 500);
};
```

### 2. Add Reset Function

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

### 3. Update handleProceed to Not Create Transaction

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

  // Just set config and move to step 2 - NO API call
  setActiveConfig(config);
  
  // Initialize form data with defaults only
  const resident = residents.find(r => r.id === selectedResidentId);
  const initialData = {
    selectedResident: resident ? getFullName(resident) : '',
    purpose: purpose === 'Other' ? otherPurpose : purpose,
    barangayName: settings.barangayName,
    // ... other defaults
  };
  
  setFormData(initialData);
  setStep(2);
};
```

### 4. Update handlePrint to Create Transaction

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

## Summary

| Step | Action | Transaction Created? |
|------|--------|---------------------|
| Step 1 | Fill details | ❌ No |
| Click "Proceed" | Preview document | ❌ No |
| Step 2 | Edit document details | ❌ No |
| Click "Issue & Print" | Save to database | ✅ Yes |
| After print | Reset to Step 1 | - |

## Testing

1. Go to Document page
2. Select resident and document type
3. Click "Proceed" - verify no transaction created in database
4. Fill document details in step 2
5. Click "Issue & Print"
6. Verify transaction is created in database
7. Verify print dialog opens
8. Verify form resets to step 1 after printing

# Task 27 Report: Update TransactionViewModal to use formData

## Status: DONE

## Changes Made

Updated `TransactionViewModal.tsx` to use `documentData.formData` instead of manually constructing template data from individual document fields.

### Before:
```typescript
const templateData = documentData ? {
  selectedResident: transaction.resident,
  purpose: documentData.purpose || '',
  dateIssued: ...,
  barangayName: settings.barangayName,
  municipality: settings.municipality,
  province: settings.province,
  punongBarangay: settings.punongBarangay,
  orNumber: transaction.orNumber,
  validityPeriod: documentData.validityPeriod || '',
} : null;
```

### After:
```typescript
const templateData = documentData ? {
  ...documentData.formData,
  selectedResident: transaction.resident,
  orNumber: transaction.orNumber,
  dateIssued: ...,
  barangayName: settings.barangayName,
  municipality: settings.municipality,
  province: settings.province,
  punongBarangay: settings.punongBarangay,
} : null;
```

## Commits Created

- `a264229` feat(frontend): use formData for template rendering in View modal

## Verification

- TypeScript compilation passed with no errors
- File modified: `packages/desktop/src/components/ui/TransactionViewModal.tsx`

## Concerns

None. The change aligns with how formData is already being used in other parts of the application (e.g., document creation).

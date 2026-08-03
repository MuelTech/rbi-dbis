# Task 22: Fix Document Issuance Flow

**Status**: DONE

## Summary
Fixed the document issuance flow so transactions are only created when the user clicks "Issue & Print", and the form resets to step 1 after printing.

## Changes Made

### `packages/desktop/src/pages/Document.tsx`

1. **Added `resetForm` function** — resets all form state fields back to defaults.

2. **Updated `handleProceed`** — now only validates inputs, sets the active config, initializes form data with defaults, and moves to step 2. No API call is made.

3. **Updated `handlePrint`** — now creates the transaction via `documentsService.create`, adds the OR number to form data, triggers `window.print()`, then resets to step 1 after a 500ms delay.

4. **Removed unused code** — removed `getDocumentTypeId` helper and `docTypes` query since they were only used by the old `handleProceed` flow.

5. **Fixed type error** — the task description referenced `resident.household` which doesn't exist on the `Resident` type. Used the generic attribute lookup pattern instead (`resident[field.residentAttribute]`) which matches the original code's approach and works with `resident.address`.

## Commits
- `958cd0f` — `fix(document): create transaction on Issue & Print, reset to step 1 after`

## Concerns
- The address field access depends on the `residentAttribute` config values matching actual `Resident` properties. If document configs reference attributes not on the `Resident` type, those fields will silently be empty.

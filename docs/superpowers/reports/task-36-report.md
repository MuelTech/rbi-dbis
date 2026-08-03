# Task 36: Add CSV export to Residents page

## Status
DONE

## Summary
Added CSV export functionality to the Residents page using the `xlsx` library. The CSV button now fetches filtered resident data (respecting active sex, voter, and status filters) and generates a downloadable `.csv` file with columns: No., Name, Sex, Address, Contact, Status.

## Changes
- **Import**: Added `import * as XLSX from 'xlsx';`
- **Function**: Added `handleGenerateCSV()` after `handleGeneratePDF()`, mirroring the same filter logic
- **Button**: Updated the CSV button to call `handleGenerateCSV` on click with green styling

## TypeScript Check
`npx tsc --noEmit` passed with no errors.

## Commit
`401c58b` — `feat(residents): add CSV export functionality`

## Concerns
None.

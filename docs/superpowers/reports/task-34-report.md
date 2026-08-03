# Task 34: Simplify PDF Report - No Modal, Use Existing Filters

**Status**: DONE

## Summary

Simplified the PDF report feature on the Residents page by removing the filter modal and generating PDFs directly using the existing page filters.

## Changes Made

### `packages/desktop/src/pages/Residents.tsx`

1. **Removed modal-related state variables**: Deleted `showFilterModal`, `reportFilters`, and `isGenerating` state declarations (lines 70-83).
2. **Replaced `handleGeneratePDF` function**: Simplified to use existing `activeFilters` and `selectedStatuses` directly instead of separate report filters. Removed the `title` parameter — title is now auto-generated with the current date.
3. **Updated PDF button**: Changed `onClick` from `() => setShowFilterModal(true)` to `handleGeneratePDF`.
4. **Removed entire filter modal JSX**: Deleted the `{showFilterModal && (...)}` block (~130 lines of modal UI with title, sex, status, voter, PWD, solo parent, family head, and age range fields).

## TypeScript Check

`tsc --noEmit` passed with no errors.

## Commits

- `f8d2907` — `feat(residents): simplify PDF report to use existing filters` on branch `feature/resident-pdf-report`

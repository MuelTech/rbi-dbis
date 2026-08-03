# Task 2: Backend - Report Controller

**Status**: DONE

## Summary

Created `packages/server/src/controllers/reportController.ts` with the `getFilteredResidents` endpoint that filters residents by demographic criteria (sex, voter status, PWD status, solo parent status, family head, student type, status, age range).

## What Was Done

- Created `reportController.ts` with:
  - `getFilteredResidents()` — accepts query params for filtering and returns resident data with computed age and formatted address
  - `computeAge()` — helper to compute age from date of birth
- TypeScript compilation verified — no new errors introduced (2 pre-existing errors in other files remain)
- Commit: `feat(server): add getFilteredResidents endpoint for PDF reports`

## Files Touched

- `packages/server/src/controllers/reportController.ts` (created)

## Notes

- Pre-existing TS errors in `householdController.ts` (line 205) and `userController.ts` (line 81) are unrelated to this change.

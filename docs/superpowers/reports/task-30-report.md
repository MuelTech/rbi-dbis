# Task 3: Backend - Report Route

## Status: DONE

## Changes Made

1. **Created `packages/server/src/routes/report.ts`**: New route file that exports `reportRouter` with a single GET `/residents` endpoint wired to `getFilteredResidents` from `reportController.ts`.

2. **Modified `packages/server/src/index.ts`**: Added import for `reportRouter` and registered it at `/api/report` with `requireAuth` middleware.

## TypeScript Compilation

Ran `npx tsc --noEmit -p packages/server/tsconfig.json`. The only errors found are **pre-existing** in `householdController.ts` (line 205) and `userController.ts` (line 81) — neither related to this change.

## Commits

- `feat(server): add /report/residents route`

## Concerns

- None. The route is straightforward and follows the existing pattern used by all other route files in the project.

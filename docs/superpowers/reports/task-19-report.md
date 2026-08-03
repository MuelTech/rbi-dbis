# Task 2: Backend - Add Route

**Status**: DONE

## What was done

Added the `/transactions` GET route to the dashboard router in `packages/server/src/routes/dashboard.ts`.

Changes:
- Imported `getTransactions` from `dashboardController.js`
- Added `dashboardRouter.get("/transactions", getTransactions);`

## Commits

- `77ed5db` — `feat(server): add /transactions route to dashboard`

## TypeScript compilation

`tsc --noEmit` was run. Pre-existing errors in `householdController.ts` (line 205) and `userController.ts` (line 81) are unrelated to this change. No new errors introduced.

## Concerns

None. The change is minimal and correct.

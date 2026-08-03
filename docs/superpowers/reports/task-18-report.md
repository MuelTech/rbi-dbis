# Task 18 Report: Backend - Add getTransactions endpoint

## Status: DONE

## Commits created
- `feat(server): add getTransactions endpoint for transaction section`

## What was done
Added `getTransactions` function to `packages/server/src/controllers/dashboardController.ts`. The function:
- Accepts `period` (day/week/month/custom), `from`, `to`, `page`, `pageSize` query params
- Queries the `Order` table with date filters and includes related `user.userInfo`, `resident`, and `document.documentType`
- Returns paginated data with metadata and summary (accumulated fee + total transactions)

## Concerns
- Pre-existing TypeScript errors exist in `householdController.ts` (line 205) and `userController.ts` (line 81) — unrelated to this change
- No new TS errors introduced by this function

## Files touched
- `packages/server/src/controllers/dashboardController.ts`

# Task 14 Report: Backend Controller Update

## Status: DONE

## What Was Done

Removed all `documentNumber` generation and usage from `documentController.ts`:

1. **Removed the DOC-XXXXX generation block** — the `prisma.document.findFirst` query, sequence calculation, and `documentNumber` variable construction (~16 lines)
2. **Removed `documentNumber` from the transaction create data** — `tx.document.create` now only passes `issueDate`, `purpose`, `validityPeriod`, and `documentTypeId`
3. **Removed `documentNumber` from the audit log** — `logCreate` now only logs `purpose` and `orNumber`

## Commits

- `6d12dcb` feat(server): remove document number generation, keep OR number only

## TypeScript Verification

`tsc --noEmit` passes for the server package. Two pre-existing errors in unrelated files (`householdController.ts` and `userController.ts`) are not caused by this change.

## Concerns

- The `documentNumber` column still exists in the Prisma schema and DB — it will just be `null` for new documents. If the schema needs updating to remove the column entirely, that's a separate DB migration task.

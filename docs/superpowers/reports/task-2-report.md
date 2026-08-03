# Task 2 Report: Backend - Document Controller Update

**Status**: DONE  
**Date**: 2026-06-29

## Summary

Updated `packages/server/src/controllers/documentController.ts` with a new `createDocument` implementation that generates unique OR numbers and document numbers, creates Document + Order records in a transaction, and logs the creation.

## Changes Made

### `packages/server/src/controllers/documentController.ts`

Replaced the simple `createDocument` function with a full implementation:

1. **Input validation**: Returns 400 if `residentId` or `documentTypeId` are missing from the request body
2. **Document type lookup**: Returns 404 if the specified document type doesn't exist
3. **OR number generation**: Queries the last Order's OR number, extracts the sequence, increments it, and formats as `YYYY-418-XXXXX` (e.g., `2026-418-00001`). Resets sequence to 1 if the year changes.
4. **Document number generation**: Queries the last Document's document number, extracts the sequence, increments it, and formats as `DOC-XXXXX` (e.g., `DOC-00001`)
5. **Transaction**: Creates both Document and Order records atomically in a `$transaction`
6. **Audit logging**: Calls `logCreate` with the document details if a userId is present
7. **Response**: Returns the full document with `documentType`, `order`, and `signers` relations included

## TypeScript Compilation

New code compiles cleanly. Three pre-existing errors remain in `getDocuments` (line 12) and `getDocumentById` (lines 28-29) where the code tries to `include: { resident: true }` on Document — but Document has no direct `resident` relation (it connects through Order). These are unrelated to this task.

## Concerns

- **Pre-existing TS errors**: `getDocuments` and `getDocumentById` reference `resident` in the include, which doesn't exist on the Document model. These should be fixed separately (Document → Order → Resident).
- **Race condition on OR/doc numbers**: The sequence generation is not atomic — two concurrent requests could read the same last number and produce duplicates. For a single-user barangay system this is acceptable, but a sequence table or unique constraint retry would be safer at scale.
- **No `residentId` validation**: The code doesn't verify the resident actually exists. Prisma will throw a foreign key error, which will bubble up as a 500. A 404 check could be added.

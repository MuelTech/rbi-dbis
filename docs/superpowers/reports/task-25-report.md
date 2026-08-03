# Task 25 Report: Update Frontend Service Types

## Status: DONE

## Changes Made
Updated `packages/desktop/src/services/documents.ts`:
- Added `formData: Record<string, any> | null` to `DocumentRecord` interface
- Added `formData?: Record<string, any>` to `CreateDocumentPayload` interface

## TypeScript Verification
Ran `npx tsc --noEmit` from `packages/desktop` — no errors.

## Commits
- `2d3b348` feat(frontend): add formData to document service types

## Concerns
None. The types now align with the backend `DocumentResponseDto` which includes `formData`.

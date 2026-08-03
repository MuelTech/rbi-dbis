# Task 26 Report: Update Document page to pass formData

## Status: DONE

## Summary
Updated the \handleConfirmIssue\ function in \packages/desktop/src/pages/Document.tsx\ to pass \ormData\ when creating a document via \documentsService.create()\.

## Changes Made
- Added \ormData\ parameter to the \documentsService.create()\ call in the \handleConfirmIssue\ function (line 177-181)

## Verification
- TypeScript compilation: PASSED (no errors)

## Commits
- \eat(frontend): pass formData when creating document\

## Concerns
None


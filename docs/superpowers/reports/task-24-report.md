# Task 24: Update document controller to save formData

**Status**: DONE

## Summary

Updated `createDocument` in `documentController.ts` to include `formData` when creating a document. The field is destructured from `req.body` and saved to the database via Prisma's `document.create`.

## Changes

- **`packages/server/src/controllers/documentController.ts`**: Added `formData` to the destructured body fields and included it in the `tx.document.create` call as `formData: formData || null`.

## Commit

```
d554609 feat(server): save formData when creating document
```

## Notes

- Pre-existing TypeScript errors exist in `householdController.ts` and `userController.ts` (unrelated to this change).

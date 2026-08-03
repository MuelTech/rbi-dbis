# Task 5: Update Templates with OR Number

**Status**: DONE

## Summary

Updated the footer/OR Details section in all three document templates to display dynamic OR Number, Document Number, and Amount Paid values from `data.orNumber`, `data.documentNumber`, and `data.amountPaid`.

## Files Modified

- `packages/desktop/src/components/templates/BusinessClearanceTemplate.tsx` — Replaced hardcoded OR Number (`1234567`), Amount Paid, and Date Issued with dynamic values; added Doc Number field
- `packages/desktop/src/components/templates/BusinessPermitTemplate.tsx` — Replaced BUS. NO. and Amount Paid with OR Number, Doc Number, and Amount Paid fields
- `packages/desktop/src/components/templates/IndigencyTemplate.tsx` — Replaced Control No and Amount Paid with OR Number, Doc Number, and Amount Paid fields

## Changes Per Template

### BusinessClearanceTemplate
- OR Number now reads `data.orNumber || 'N/A'` (was hardcoded `1234567`)
- Added Doc Number row from `data.documentNumber || 'N/A'`
- Amount Paid now falls back to `'0'` if missing
- Removed Date Issued field (not part of the OR Details requirement)

### BusinessPermitTemplate
- OR Number replaces BUS. NO. field
- Added Doc Number row from `data.documentNumber || 'N/A'`
- Amount Paid retains existing fallback

### IndigencyTemplate
- OR Number replaces Control No field
- Added Doc Number row from `data.documentNumber || 'N/A'`
- Amount Paid retains existing fallback

## TypeScript Verification

Ran `npx tsc --noEmit` in `packages/desktop/` — compiled with zero errors.

## Commit

- **Commit**: `be0059c`
- **Message**: `feat(templates): add OR Number to all document templates`
- **Branch**: `feature/business-permit-template`

## Concerns

- Templates use `data: any` typing — no type safety for the new fields. The `orNumber` and `documentNumber` fields will work at runtime but have no compile-time guarantees.

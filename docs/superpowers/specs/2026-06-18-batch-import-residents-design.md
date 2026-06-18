# Batch Import Residents Design

## Overview

Make the Batch Import Residents feature functional by replacing the simulated `setTimeout` import with a real API call. The import template is restructured from flat resident rows to family-grouped rows matching the full registration fields.

## Template Structure

32 columns organized by category. Rows are grouped by `family_id`. Head row contains all fields; member rows only contain resident fields.

### Columns

**Structure (head row only):**
1. `family_id` (required) — groups rows into families
2. `relationship` (required) — "Head" for first row, relationship for members
3. `block` (required) — block number
4. `household_number` (required) — household number
5. `house_number` (required) — house number
6. `street_name` (required) — street name
7. `alley` (required) — alley name

**Pets (head row only, optional):**
8. `has_pets` — Yes / No
9. `number_of_dogs` — number
10. `number_of_cats` — number
11. `other_animals` — description

**Vehicles (head row only, optional):**
12. `has_vehicles` — Yes / No
13. `number_of_motorcycles` — number
14. `motorcycle_plate_numbers` — plate numbers
15. `number_of_other_vehicles` — number
16. `vehicle_plate_numbers` — plate numbers

**Personal Information (all rows):**
17. `last_name` (required)
18. `first_name` (required)
19. `middle_name`
20. `suffix` — Jr., Sr., III
21. `date_of_birth` (required) — YYYY-MM-DD
22. `place_of_birth`
23. `civil_status` — Single / Married / Widowed / Separated
24. `sex` (required) — Male / Female

**Contact & Background (all rows):**
25. `contact_number` — 09XXXXXXXXX
26. `occupation` — Employed / Self-Employed / Unemployed / Student
27. `is_student` — Yes / No
28. `education_level` — Elementary / High School / College / Vocational
29. `is_voter` — Yes / No
30. `is_pwd` — Yes / No
31. `is_solo_parent` — Yes / No
32. `is_owner` — Yes / No (head only)

### Row Grouping Rules

- Head row (`relationship = "Head"`): all columns present
- Member rows: only `family_id`, `relationship`, and columns 17-32
- Empty `relationship`: continuation of previous family's members

## Backend

### New Endpoint: `POST /api/residents/batch`

**Request:**
```json
{
  "families": [
    {
      "household": { "block": "1", "household_number": "001" },
      "address": { "house_number": "123", "street_name": "Main St", "alley": "Alley A" },
      "pet": { "has_pets": true, "number_of_dogs": 2, "number_of_cats": 1 },
      "vehicle": { "has_vehicles": true, "number_of_motorcycles": 1, "motorcycle_plate_numbers": "ABC123" },
      "head": { "last_name": "Dela Cruz", "first_name": "Juan", ... },
      "members": [
        { "relationship": "Spouse", "last_name": "Dela Cruz", "first_name": "Maria", ... }
      ]
    }
  ],
  "duplicateAction": "skip" | "overwrite"
}
```

**Response:**
```json
{
  "created": 5,
  "updated": 0,
  "skipped": 1,
  "families": 2,
  "errors": []
}
```

**Logic:**
1. For each family, run in a transaction:
   - Find or create Block
   - Create Household
   - Create Address
   - For each resident (head + members):
     - Check duplicate: `lastName + firstName + dateOfBirth`
     - If exists and skip → add to skipped list
     - If exists and overwrite → update record
     - If not exists → insert new record
   - Create Family with headPersonId, householdId, addressId
   - Create FamilyMember records for each member
   - Create FamilyPet if has_pets
   - Create FamilyVehicle if has_vehicles
2. Return aggregate counts

## Frontend

### BatchImportModal Changes

1. **Step 1 (Upload):** Updated template with 32 columns
2. **Step 2 (Preview):** Parse grouped rows by `family_id`, show families instead of flat residents
3. **Step 3 (Import):** Replace `setTimeout` with `POST /api/residents/batch` API call
4. **Step 4 (Results):** Show created/updated/skipped counts

### Parsing Logic

```
For each row in spreadsheet:
  if family_id is new → start new family
  if relationship == "Head" → add as head with household/address/pet/vehicle
  else → add as member
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `packages/server/src/controllers/residentController.ts` | Add `batchImportResidents` |
| `packages/server/src/routes/residents.ts` | Add `POST /batch` route |
| `packages/desktop/src/services/residents.ts` | Add `batchImport` method |
| `packages/desktop/src/components/ui/BatchImportModal.tsx` | Rewrite import logic, update template, parse grouped rows |

# Batch Import Residents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Batch Import Residents feature functional by replacing simulated import with real API calls, using family-grouped Excel rows matching all registration fields.

**Architecture:** New `POST /api/residents/batch` endpoint processes families in transactions. Frontend BatchImportModal parses grouped rows by `family_id`, sends structured data to the endpoint.

**Tech Stack:** Prisma 6, MySQL, Express 5, React 19, TanStack Query 5, Tailwind CSS, xlsx library

## Global Constraints

- TanStack Query mandatory for all server-state fetching
- Mutations must call `invalidateQueries` on success
- Tailwind CSS utility classes only (no CSS files)
- Icons: lucide-react only
- Server source uses `.js` extensions in import paths
- Duplicate detection: `lastName + firstName + dateOfBirth`
- Transaction per family (all-or-nothing per family)

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `packages/server/src/controllers/residentController.ts` | Modify | Add `batchImportResidents` |
| `packages/server/src/routes/residents.ts` | Modify | Add `POST /batch` route |
| `packages/desktop/src/services/residents.ts` | Modify | Add `batchImport` method |
| `packages/desktop/src/components/ui/BatchImportModal.tsx` | Rewrite | Real import, grouped row parsing, updated template |

---

### Task 1: Add Batch Import Endpoint

**Files:**
- Modify: `packages/server/src/controllers/residentController.ts`
- Modify: `packages/server/src/routes/residents.ts`

**Interfaces:**
- Consumes: `prisma` from `@rbi/db`
- Produces: `batchImportResidents(req, res, next)` function

- [ ] **Step 1: Add batchImportResidents function**

Add at the end of `packages/server/src/controllers/residentController.ts`:

```typescript
export async function batchImportResidents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { families, duplicateAction = "skip" } = req.body;

    if (!Array.isArray(families) || families.length === 0) {
      res.status(400).json({ error: "families array is required" });
      return;
    }

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const fam of families) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Find or create Block
          let block = await tx.block.findFirst({
            where: { blockNumber: fam.household?.block },
          });
          if (!block) {
            block = await tx.block.create({
              data: { blockNumber: fam.household?.block },
            });
          }

          // 2. Create Household
          const hhNum = String(fam.household?.household_number ?? "").padStart(3, "0");
          const createdHousehold = await tx.household.create({
            data: {
              brgyHouseholdNo: hhNum,
              blockId: block.id,
            },
          });

          // 3. Create Address
          const createdAddress = await tx.address.create({
            data: {
              houseNo: fam.address?.house_number ?? "",
              streetName: fam.address?.street_name ?? "",
              alleyName: fam.address?.alley ?? "",
            },
          });

          // 4. Process Head Resident
          const head = fam.head;
          const headData = {
            lastName: head.last_name,
            firstName: head.first_name,
            middleName: head.middle_name || null,
            suffix: head.suffix || null,
            placeOfBirth: head.place_of_birth || null,
            dateOfBirth: head.date_of_birth ? new Date(head.date_of_birth) : null,
            sex: head.sex,
            civilStatus: head.civil_status || null,
            isVoter: head.is_voter === "Yes" || head.is_voter === true,
            isPwd: head.is_pwd === "Yes" || head.is_pwd === true,
            isSoloParent: head.is_solo_parent === "Yes" || head.is_solo_parent === true,
            isOwner: head.is_owner === "Yes" || head.is_owner === true,
            occupationType: head.occupation || null,
            contactNumber: head.contact_number || null,
            studentType: head.is_student === "Yes" ? (head.education_level || "Student") : null,
          };

          // Check duplicate for head
          const existingHead = await tx.resident.findFirst({
            where: {
              lastName: headData.lastName,
              firstName: headData.firstName,
              dateOfBirth: headData.dateOfBirth,
            },
          });

          let headResident;
          if (existingHead) {
            if (duplicateAction === "overwrite") {
              headResident = await tx.resident.update({
                where: { id: existingHead.id },
                data: headData,
              });
              totalUpdated++;
            } else {
              totalSkipped++;
              return; // Skip this family
            }
          } else {
            headResident = await tx.resident.create({ data: headData });
            totalCreated++;
          }

          // 5. Create Family
          const family = await tx.family.create({
            data: {
              familyName: headData.lastName,
              householdId: createdHousehold.id,
              headPersonId: headResident.id,
              addressId: createdAddress.id,
            },
          });

          // 6. Create Pet if exists
          if (fam.pet?.has_pets === "Yes" || fam.pet?.has_pets === true) {
            await tx.familyPet.create({
              data: {
                familyId: family.id,
                isPetOwner: true,
                numberOfDogs: Number(fam.pet.number_of_dogs) || 0,
                numberOfCats: Number(fam.pet.number_of_cats) || 0,
                others: fam.pet.other_animals || null,
              },
            });
          }

          // 7. Create Vehicle if exists
          if (fam.vehicle?.has_vehicles === "Yes" || fam.vehicle?.has_vehicles === true) {
            await tx.familyVehicle.create({
              data: {
                familyId: family.id,
                numberOfMotorcycles: Number(fam.vehicle.number_of_motorcycles) || 0,
                motorcyclePlateNumber: fam.vehicle.motorcycle_plate_numbers || null,
                numberOfVehicles: Number(fam.vehicle.number_of_other_vehicles) || 0,
                vehiclePlateNumber: fam.vehicle.vehicle_plate_numbers || null,
              },
            });
          }

          // 8. Process Members
          const members = fam.members ?? [];
          for (const m of members) {
            const memberData = {
              lastName: m.last_name,
              firstName: m.first_name,
              middleName: m.middle_name || null,
              suffix: m.suffix || null,
              placeOfBirth: m.place_of_birth || null,
              dateOfBirth: m.date_of_birth ? new Date(m.date_of_birth) : null,
              sex: m.sex,
              civilStatus: m.civil_status || null,
              isVoter: m.is_voter === "Yes" || m.is_voter === true,
              isPwd: m.is_pwd === "Yes" || m.is_pwd === true,
              isSoloParent: m.is_solo_parent === "Yes" || m.is_solo_parent === true,
              occupationType: m.occupation || null,
              contactNumber: m.contact_number || null,
              studentType: m.is_student === "Yes" ? (m.education_level || "Student") : null,
            };

            // Check duplicate for member
            const existingMember = await tx.resident.findFirst({
              where: {
                lastName: memberData.lastName,
                firstName: memberData.firstName,
                dateOfBirth: memberData.dateOfBirth,
              },
            });

            let memberResident;
            if (existingMember) {
              if (duplicateAction === "overwrite") {
                memberResident = await tx.resident.update({
                  where: { id: existingMember.id },
                  data: memberData,
                });
                totalUpdated++;
              } else {
                totalSkipped++;
                continue; // Skip this member
              }
            } else {
              memberResident = await tx.resident.create({ data: memberData });
              totalCreated++;
            }

            await tx.familyMember.create({
              data: {
                familyId: family.id,
                residentId: memberResident.id,
                relationshipType: m.relationship,
              },
            });
          }
        });
      } catch (err: any) {
        errors.push(`Family ${fam.head?.last_name ?? "unknown"}: ${err.message}`);
      }
    }

    res.json({
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      families: families.length,
      errors,
    });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Add route**

In `packages/server/src/routes/residents.ts`, add:

```typescript
import {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  batchImportResidents,
} from "../controllers/residentController.js";

// ... existing routes ...

residentRouter.post("/batch", batchImportResidents);
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/residentController.ts packages/server/src/routes/residents.ts
git commit -m "feat(server): add batch import residents endpoint"
```

---

### Task 2: Add Frontend Batch Import Service

**Files:**
- Modify: `packages/desktop/src/services/residents.ts`

**Interfaces:**
- Consumes: `api` from `./api`
- Produces: `residentsService.batchImport(data)` method

- [ ] **Step 1: Add batchImport method**

In `packages/desktop/src/services/residents.ts`, add to the `residentsService` object:

```typescript
  batchImport: (data: { families: any[]; duplicateAction: "skip" | "overwrite" }) =>
    api.post<{ created: number; updated: number; skipped: number; families: number; errors: string[] }>("/residents/batch", data),
```

- [ ] **Step 2: Commit**

```bash
git add packages/desktop/src/services/residents.ts
git commit -m "feat(desktop): add batchImport service method"
```

---

### Task 3: Rewrite BatchImportModal — Template and Parsing

**Files:**
- Modify: `packages/desktop/src/components/ui/BatchImportModal.tsx`

**Interfaces:**
- Consumes: `residentsService.batchImport` from services
- Produces: Functional 3-step import flow with real API call

- [ ] **Step 1: Update TEMPLATE_COLUMNS**

Replace the existing `TEMPLATE_COLUMNS` constant:

```typescript
const TEMPLATE_COLUMNS = [
  'family_id',
  'relationship',
  'block',
  'household_number',
  'house_number',
  'street_name',
  'alley',
  'has_pets',
  'number_of_dogs',
  'number_of_cats',
  'other_animals',
  'has_vehicles',
  'number_of_motorcycles',
  'motorcycle_plate_numbers',
  'number_of_other_vehicles',
  'vehicle_plate_numbers',
  'last_name',
  'first_name',
  'middle_name',
  'suffix',
  'date_of_birth',
  'place_of_birth',
  'civil_status',
  'sex',
  'contact_number',
  'occupation',
  'is_student',
  'education_level',
  'is_voter',
  'is_pwd',
  'is_solo_parent',
  'is_owner',
];
```

- [ ] **Step 2: Update REQUIRED_FIELDS**

```typescript
const REQUIRED_FIELDS = ['family_id', 'relationship', 'last_name', 'first_name', 'date_of_birth', 'sex'];
```

- [ ] **Step 3: Update validateRow function**

Replace the existing `validateRow` function:

```typescript
function validateRow(row: Record<string, string>, isHead: boolean): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push({ field, message: `Missing required field: ${field}` });
    }
  }

  // Household fields required for head
  if (isHead) {
    const headRequired = ['block', 'household_number', 'house_number', 'street_name', 'alley'];
    for (const field of headRequired) {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({ field, message: `Missing required field for head: ${field}` });
      }
    }
  }

  // Date format
  if (row.date_of_birth && row.date_of_birth.toString().trim() !== '') {
    const parsed = Date.parse(row.date_of_birth);
    if (isNaN(parsed)) {
      errors.push({ field: 'date_of_birth', message: 'Invalid date format' });
    } else if (new Date(parsed) > new Date()) {
      errors.push({ field: 'date_of_birth', message: 'Birthdate is in the future' });
    }
  }

  // Sex
  if (row.sex && !['male', 'female'].includes(row.sex.toLowerCase().trim())) {
    errors.push({ field: 'sex', message: 'Sex must be "Male" or "Female"' });
  }

  // Civil status
  const validCivilStatus = ['single', 'married', 'widowed', 'separated'];
  if (row.civil_status && row.civil_status.trim() !== '' && !validCivilStatus.includes(row.civil_status.toLowerCase().trim())) {
    errors.push({ field: 'civil_status', message: 'Invalid civil status' });
  }

  // Contact number — PH format
  if (row.contact_number && row.contact_number.trim() !== '') {
    const cleaned = row.contact_number.replace(/[\s\-()]/g, '');
    if (!/^(09|\+639)\d{9}$/.test(cleaned)) {
      errors.push({ field: 'contact_number', message: 'Invalid PH contact number' });
    }
  }

  // is_voter
  if (row.is_voter && row.is_voter.trim() !== '' && !['yes', 'no'].includes(row.is_voter.toLowerCase().trim())) {
    errors.push({ field: 'is_voter', message: 'Must be "Yes" or "No"' });
  }

  // is_pwd
  if (row.is_pwd && row.is_pwd.trim() !== '' && !['yes', 'no'].includes(row.is_pwd.toLowerCase().trim())) {
    errors.push({ field: 'is_pwd', message: 'Must be "Yes" or "No"' });
  }

  // is_solo_parent
  if (row.is_solo_parent && row.is_solo_parent.trim() !== '' && !['yes', 'no'].includes(row.is_solo_parent.toLowerCase().trim())) {
    errors.push({ field: 'is_solo_parent', message: 'Must be "Yes" or "No"' });
  }

  // is_owner
  if (row.is_owner && row.is_owner.trim() !== '' && !['yes', 'no'].includes(row.is_owner.toLowerCase().trim())) {
    errors.push({ field: 'is_owner', message: 'Must be "Yes" or "No"' });
  }

  // has_pets
  if (row.has_pets && row.has_pets.trim() !== '' && !['yes', 'no'].includes(row.has_pets.toLowerCase().trim())) {
    errors.push({ field: 'has_pets', message: 'Must be "Yes" or "No"' });
  }

  // has_vehicles
  if (row.has_vehicles && row.has_vehicles.trim() !== '' && !['yes', 'no'].includes(row.has_vehicles.toLowerCase().trim())) {
    errors.push({ field: 'has_vehicles', message: 'Must be "Yes" or "No"' });
  }

  return errors;
}
```

- [ ] **Step 4: Add parseGroupedRows function**

Add this function after `validateRow`:

```typescript
interface ImportFamily {
  family_id: string;
  household: Record<string, string>;
  address: Record<string, string>;
  pet: Record<string, string> | null;
  vehicle: Record<string, string> | null;
  head: Record<string, string>;
  members: Record<string, string>[];
}

function parseGroupedRows(rows: Record<string, string>[]): ImportFamily[] {
  const familyMap = new Map<string, ImportFamily>();

  for (const row of rows) {
    const familyId = (row.family_id || "").trim();
    if (!familyId) continue;

    if (!familyMap.has(familyId)) {
      familyMap.set(familyId, {
        family_id: familyId,
        household: {
          block: row.block || "",
          household_number: row.household_number || "",
        },
        address: {
          house_number: row.house_number || "",
          street_name: row.street_name || "",
          alley: row.alley || "",
        },
        pet: (row.has_pets === "Yes" || row.has_pets === "yes") ? {
          has_pets: row.has_pets,
          number_of_dogs: row.number_of_dogs || "0",
          number_of_cats: row.number_of_cats || "0",
          other_animals: row.other_animals || "",
        } : null,
        vehicle: (row.has_vehicles === "Yes" || row.has_vehicles === "yes") ? {
          has_vehicles: row.has_vehicles,
          number_of_motorcycles: row.number_of_motorcycles || "0",
          motorcycle_plate_numbers: row.motorcycle_plate_numbers || "",
          number_of_other_vehicles: row.number_of_other_vehicles || "0",
          vehicle_plate_numbers: row.vehicle_plate_numbers || "",
        } : null,
        head: row,
        members: [],
      });
    }

    const family = familyMap.get(familyId)!;
    if (row.relationship?.toLowerCase() === "head") {
      family.head = row;
      // Update household/address/pet/vehicle from head row
      family.household = { block: row.block || "", household_number: row.household_number || "" };
      family.address = { house_number: row.house_number || "", street_name: row.street_name || "", alley: row.alley || "" };
      if (row.has_pets === "Yes" || row.has_pets === "yes") {
        family.pet = { has_pets: row.has_pets, number_of_dogs: row.number_of_dogs || "0", number_of_cats: row.number_of_cats || "0", other_animals: row.other_animals || "" };
      }
      if (row.has_vehicles === "Yes" || row.has_vehicles === "yes") {
        family.vehicle = { has_vehicles: row.has_vehicles, number_of_motorcycles: row.number_of_motorcycles || "0", motorcycle_plate_numbers: row.motorcycle_plate_numbers || "", number_of_other_vehicles: row.number_of_other_vehicles || "0", vehicle_plate_numbers: row.vehicle_plate_numbers || "" };
      }
    } else {
      family.members.push(row);
    }
  }

  return Array.from(familyMap.values());
}
```

- [ ] **Step 5: Add importResidentSummary interface and update Step 2 rendering**

Add a new interface and update the preview step to show families:

```typescript
interface FamilySummary {
  family_id: string;
  headName: string;
  memberCount: number;
  status: 'success' | 'error';
  message: string;
}
```

- [ ] **Step 6: Replace handleImport with real API call**

Replace the existing `handleImport` function:

```typescript
const handleImport = useCallback(async () => {
  setImporting(true);

  try {
    // Parse grouped rows
    const families = parseGroupedRows(parsedRows.filter(r => r.status === 'success').map(r => r.data));

    const result = await residentsService.batchImport({
      families,
      duplicateAction,
    });

    setImportResult({
      success: result.created,
      duplicates: result.skipped,
      errors: result.errors.length,
    });

    setImporting(false);
    setStep(3);
  } catch (err: any) {
    setImportResult({
      success: 0,
      duplicates: 0,
      errors: 1,
    });
    setImporting(false);
    setStep(3);
  }
}, [parsedRows, duplicateAction]);
```

- [ ] **Step 7: Update renderStep2 to show family preview**

Replace the data table in `renderStep2` to show families instead of flat rows. Each family shows: family_id, head name, member count, status.

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit` from `packages/desktop`

- [ ] **Step 9: Commit**

```bash
git add packages/desktop/src/components/ui/BatchImportModal.tsx
git commit -m "feat(desktop): rewrite BatchImportModal with real API import and family grouping"
```

---

### Task 4: Verify End-to-End

- [ ] **Step 1: Test with sample Excel file**

Create a test Excel with:
- 2 families
- Family 1: head + 2 members
- Family 2: head only

- [ ] **Step 2: Start server and desktop**

```bash
pnpm dev:server
pnpm dev:desktop
```

- [ ] **Step 3: Test flow**

1. Go to Residents page
2. Click "Batch Import"
3. Upload test Excel file
4. Verify preview shows families with status
5. Click Import
6. Verify results show created/skipped counts
7. Check residents list shows new records
8. Check household/family relationships exist in DB

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: batch import end-to-end verification fixes"
```

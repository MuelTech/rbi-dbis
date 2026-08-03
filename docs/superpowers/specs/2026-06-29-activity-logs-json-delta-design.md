# Activity Logs - JSON Delta Design

## Overview

Implement functional Activity Logs using the **JSON Delta approach** — grouping multiple field changes from a single action into one log entry with a JSON object containing all changes.

## Current State

- **Backend bug:** `activityLogController.ts` calls `prisma.activityLog` (non-existent) instead of `prisma.auditTrail`
- **Frontend:** Uses hardcoded `MOCK_LOGS` array
- **No auto-logging:** Changes are not recorded automatically

## Design Decision: JSON Delta

### Why JSON Delta?

1. **One row per action** — User edits 5 fields = 1 log entry (not 5)
2. **Compact storage** — JSON object stores all changes efficiently
3. **Easy UI display** — Single row with expandable details
4. **Sufficient for barangay scale** — No enterprise-grade granularity needed

### Schema Change

The existing `AuditTrail` schema will be extended:

```prisma
model AuditTrail {
  id         String   @id @default(cuid())
  tableName  String   @map("table_name") @db.VarChar(50)
  recordId   String   @map("record_id")
  actionType String   @map("action_type") @db.VarChar(50) // CREATE, UPDATE, ARCHIVE
  timestamp  DateTime @default(now())
  
  // JSON Delta fields
  changes    Json?    @db.Json  // { fieldName: [oldValue, newValue] }
  summary    String?  @db.VarChar(255) // "Updated 3 fields: lastName, firstName, contactNumber"
  
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id])

  @@map("audit_trails")
}
```

**Removed fields:** `fieldName`, `oldValue`, `newValue` (replaced by `changes` JSON)

### Backend Implementation

1. **Audit Service** (`packages/server/src/services/auditService.ts`)
   - `logCreate(tableName, recordId, userId, newData)`
   - `logUpdate(tableName, recordId, userId, oldData, newData)` — computes diff, stores JSON delta
   - `logArchive(tableName, recordId, userId)`

2. **Controller Fix** (`packages/server/src/controllers/activityLogController.ts`)
   - Fix `prisma.activityLog` → `prisma.auditTrail`
   - Return data with `changes` JSON and `summary`

### Frontend Implementation

1. **Service Update** (`packages/desktop/src/services/activityLogs.ts`)
   - Fetch from real API endpoint

2. **ActivityLogs Page** (`packages/desktop/src/pages/ActivityLogs.tsx`)
   - Remove `MOCK_LOGS`
   - Fetch from API
   - Display `summary` column
   - Expandable row to show `changes` JSON detail

### Data Flow

```
User edits form → Controller calls auditService.logUpdate()
                 → Service computes diff between old/new data
                 → Stores JSON: { "lastName": ["Santos","Cruz"], ... }
                 → Generates summary: "Updated 3 fields: lastName, firstName, contactNumber"

Activity Logs page → Fetches from /api/activity-logs
                   → Displays table with summary column
                   → Click to expand shows field-level changes
```

## Files to Modify

### Backend
1. `packages/db/prisma/schema.prisma` — Update AuditTrail model
2. `packages/server/src/services/auditService.ts` — NEW: Audit logging service
3. `packages/server/src/controllers/activityLogController.ts` — Fix model reference
4. `packages/server/src/controllers/residentController.ts` — Add audit calls
5. `packages/server/src/controllers/familyController.ts` — Add audit calls
6. `packages/server/src/controllers/userController.ts` — Add audit calls

### Frontend
1. `packages/desktop/src/services/activityLogs.ts` — Update interface
2. `packages/desktop/src/pages/ActivityLogs.tsx` — Fetch real data, display changes

## Migration Required

Run `pnpm db:migrate` after schema change to add `changes` and `summary` columns.

## Testing

1. Create/update/delete a resident
2. Check Activity Logs page shows the action
3. Expand row to verify field changes are displayed correctly

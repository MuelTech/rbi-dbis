# SSE Progress Tracking for Backup/Restore

## Problem
Current backup/restore operations block with a spinner. No visibility into progress for large datasets.

## Solution
Replace synchronous JSON responses with Server-Sent Events (SSE) that stream progress updates as each table is processed.

## Backend

### Backup (`GET /api/settings/backup`)
- Sequential table fetches (not `Promise.all`) to emit progress per table
- SSE stream with `Content-Type: text/event-stream`
- Events: `progress` (per table) → `complete` (full JSON)
- 8 tables: settings, residents, families, households, blocks, users, documents, documentTypes

### Restore (`POST /api/settings/restore`)
- Same SSE pattern
- Progress emitted after each table clear+insert cycle
- Still wrapped in `prisma.$transaction` for atomicity
- Events: `progress` (per table) → `complete` (success)

### SSE Event Format
```
event: progress
data: {"step":"Fetching residents...","current":2,"total":8,"percent":25}

event: complete
data: {"version":1,"exportedAt":"...","data":{...}}
```

## Frontend

### `settingsService.ts`
- `backupWithProgress(onProgress)` — fetch + ReadableStream SSE parser
- `restoreWithProgress(data, onProgress)` — same pattern for restore

### `Settings.tsx`
- Progress state: `{ step: string, percent: number } | null`
- Progress bar UI replaces spinner during operations
- Same button layout, progress bar appears inline

## Files Modified
- `packages/server/src/controllers/settingsController.ts` — backupData, restoreData
- `packages/desktop/src/services/settings.ts` — new SSE functions
- `packages/desktop/src/pages/Settings.tsx` — progress UI

## Not Changed
- Database schema
- Routes
- Backup JSON format
- Restore transaction logic

# Settings Page Functional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Settings page persist data to the database via API, replacing the current purely-local-state implementation.

**Architecture:** Single-row JSON settings model. One `BarangaySetting` row stores all settings (barangay info, officials, fees, purposes) as a JSON blob. Server exposes GET/PUT endpoints. Frontend uses TanStack Query to fetch and mutate.

**Tech Stack:** Prisma 6, MySQL, Express 5, React 19, TanStack Query 5, Tailwind CSS

## Global Constraints

- TanStack Query mandatory for all server-state fetching (no manual useEffect+useState)
- Query keys: `['settings']`
- Mutations must call `invalidateQueries` on success
- Tailwind CSS utility classes only (no CSS files)
- Icons: lucide-react only
- Server source uses `.js` extensions in import paths

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `packages/db/prisma/schema.prisma` | Modify | Add `BarangaySetting` model |
| `packages/server/src/controllers/settingsController.ts` | Create | GET/PUT settings endpoints |
| `packages/server/src/routes/settings.ts` | Create | Express router for /api/settings |
| `packages/server/src/index.ts` | Modify | Register settings router |
| `packages/desktop/src/services/settings.ts` | Create | API client for settings |
| `packages/desktop/src/services/index.ts` | Modify | Export settingsService |
| `packages/desktop/src/pages/Settings.tsx` | Modify | Use TanStack Query, remove local-only state |

---

### Task 1: Add BarangaySetting Model to Prisma Schema

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Produces: `BarangaySetting` model with `id`, `data` (JSON), `createdAt`, `updatedAt`

- [ ] **Step 1: Add model to schema.prisma before the Enums section**

```prisma
// ─── BarangaySetting ──────────────────────────────────────────────────────

model BarangaySetting {
  id        String   @id @default(cuid())
  data      Json
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("barangay_settings")
}
```

- [ ] **Step 2: Generate Prisma client**

Run: `pnpm db:generate`
Expected: Prisma client generated successfully

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/schema.prisma
git commit -m "feat(db): add BarangaySetting model for persisting settings"
```

---

### Task 2: Create Settings Controller

**Files:**
- Create: `packages/server/src/controllers/settingsController.ts`

**Interfaces:**
- Consumes: `prisma` from `@rbi/db`
- Produces: `getSettings(req, res, next)`, `updateSettings(req, res, next)`

- [ ] **Step 1: Create the controller file**

```typescript
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";

const DEFAULT_SETTINGS = {
  slogan: "Serbisyong Tapat, Para sa Lahat",
  barangayName: "Barangay 418",
  municipality: "Manila City",
  province: "Metro Manila",
  telephone: "8921-1234",
  punongBarangay: "Juan Dela Cruz",
  councilor1: "Pedro Penduko",
  councilor2: "Maria Makiling",
  councilor3: "Jose Rizal",
  councilor4: "Andres Bonifacio",
  councilor5: "Emilio Aguinaldo",
  councilor6: "Gabriela Silang",
  councilor7: "Melchora Aquino",
  skChairman: "Kabataan Pagasa",
  treasurer: "Yaman Bayan",
  secretary: "Sulat Kamay",
  clearanceFee: "200",
  residencyFee: "150",
  businessFee: "500",
  ownershipFee: "300",
  purposes: [
    "Employment application",
    "School enrollment",
    "Legal documents",
    "Job application",
    "Scholarship application",
    "Housing program applications",
    "Business permit requirements",
  ],
};

export async function getSettings(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let setting = await prisma.barangaySetting.findFirst();
    if (!setting) {
      setting = await prisma.barangaySetting.create({
        data: { data: DEFAULT_SETTINGS },
      });
    }
    res.json(setting.data);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let setting = await prisma.barangaySetting.findFirst();
    if (setting) {
      await prisma.barangaySetting.update({
        where: { id: setting.id },
        data: { data: req.body },
      });
    } else {
      await prisma.barangaySetting.create({
        data: { data: req.body },
      });
    }
    res.json(req.body);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/controllers/settingsController.ts
git commit -m "feat(server): add settings controller with get/update endpoints"
```

---

### Task 3: Create Settings Route

**Files:**
- Create: `packages/server/src/routes/settings.ts`

**Interfaces:**
- Consumes: `getSettings`, `updateSettings` from controller
- Produces: `settingsRouter` (Express Router)

- [ ] **Step 1: Create the route file**

```typescript
import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";

export const settingsRouter = Router();

settingsRouter.get("/", getSettings);
settingsRouter.put("/", updateSettings);
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/routes/settings.ts
git commit -m "feat(server): add settings route"
```

---

### Task 4: Register Settings Route in Server

**Files:**
- Modify: `packages/server/src/index.ts`

**Interfaces:**
- Consumes: `settingsRouter` from routes/settings

- [ ] **Step 1: Add import and mount**

Add import after line 14 (archivedRouter import):
```typescript
import { settingsRouter } from "./routes/settings.js";
```

Add mount after line 38 (dashboard router mount):
```typescript
app.use("/api/settings", requireAuth, settingsRouter);
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/index.ts
git commit -m "feat(server): register settings route on /api/settings"
```

---

### Task 5: Create Frontend Settings Service

**Files:**
- Create: `packages/desktop/src/services/settings.ts`

**Interfaces:**
- Consumes: `api` from `./api`
- Produces: `settingsService.get()`, `settingsService.update(data)`

- [ ] **Step 1: Create the service file**

```typescript
import { api } from "./api";

export interface BarangaySettings {
  slogan: string;
  barangayName: string;
  municipality: string;
  province: string;
  telephone: string;
  punongBarangay: string;
  councilor1: string;
  councilor2: string;
  councilor3: string;
  councilor4: string;
  councilor5: string;
  councilor6: string;
  councilor7: string;
  skChairman: string;
  treasurer: string;
  secretary: string;
  clearanceFee: string;
  residencyFee: string;
  businessFee: string;
  ownershipFee: string;
  purposes: string[];
}

export const settingsService = {
  get: () => api.get<BarangaySettings>("/settings"),
  update: (data: BarangaySettings) =>
    api.put<BarangaySettings>("/settings", data),
};
```

- [ ] **Step 2: Export from services/index.ts**

Add to `packages/desktop/src/services/index.ts`:
```typescript
export { settingsService } from "./settings";
export type { BarangaySettings } from "./settings";
```

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/services/settings.ts packages/desktop/src/services/index.ts
git commit -m "feat(desktop): add settings service with get/update methods"
```

---

### Task 6: Refactor Settings.tsx to Use TanStack Query

**Files:**
- Modify: `packages/desktop/src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `settingsService`, `BarangaySettings` from services/settings
- Produces: Functional Settings page with real API persistence

- [ ] **Step 1: Replace entire Settings.tsx**

Key changes:
- Import `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`
- Import `settingsService`, `BarangaySettings` from `@/services/settings`
- Remove `initialSettings` and `initialPurposes` hardcoded constants
- Remove `pristineData` / `pristinePurposes` state (dirty tracking via query data comparison)
- Add `useQuery` for fetching settings
- Add `useMutation` for saving settings
- `handleSave` calls `saveMutation.mutateAsync(formData)`
- `handleAddPurpose` / `handleRemovePurpose` update local `formData` state (optimistic UI)
- Form initializes from `data` returned by `useQuery`
- Show loading skeleton while `isLoading`
- Disable save button while `saveMutation.isPending`

- [ ] **Step 2: Run lint/typecheck**

Run: `pnpm --filter @rbi/desktop lint` (or equivalent)
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/pages/Settings.tsx
git commit -m "feat(desktop): refactor Settings page to use TanStack Query with real API"
```

---

### Task 7: Verify End-to-End

- [ ] **Step 1: Start server and desktop**

Run: `pnpm dev:server` and `pnpm dev:desktop`

- [ ] **Step 2: Test Settings page**

- Navigate to Settings page
- Verify data loads from API (not hardcoded)
- Edit barangay name, save, refresh page — data persists
- Add/remove purposes, save — persists
- Edit fees, save — persists

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: settings page end-to-end verification fixes"
```

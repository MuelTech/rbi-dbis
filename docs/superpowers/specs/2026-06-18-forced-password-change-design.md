# Forced Password Change on First Login

## Overview

When a new account is created, the admin assigns a default password (`brgy418`) and optionally forces the user to change it on first login. Users with `mustChangePassword: true` see a full-screen password change page and cannot access the app until they set a new password.

## Database

Add `mustChangePassword` boolean to `User` model:

```prisma
model User {
  ...
  mustChangePassword Boolean @default(false) @map("must_change_password")
  ...
}
```

Run migration: `pnpm db:migrate`

## Backend

### Login Response

`POST /api/auth/login` response includes `mustChangePassword`:

```json
{
  "token": "...",
  "user": {
    "id": "...",
    "username": "...",
    "mustChangePassword": true,
    ...
  }
}
```

### New Endpoint: Change Password

`PUT /api/auth/change-password`

- Auth: `requireAuth` middleware
- Body: `{ newPassword: string }`
- Validation: min 6 characters
- Action: hash new password with bcrypt, update user, set `mustChangePassword: false`
- Response: `{ success: true }`

### User Creation

`POST /api/users` and `PUT /api/users/:id` accept `mustChangePassword` in payload.

## Frontend

### AuthContext

- Add `mustChangePassword: boolean` to `AuthContextType` and `User` type
- `login()` stores `mustChangePassword` from API response
- `refreshUser()` fetches current `mustChangePassword` state
- Expose `setMustChangePassword(flag)` for the ChangePassword page to call after success

### App.tsx Routing

After login, if `user.mustChangePassword === true`:
- Render `<ChangePassword />` instead of normal layout (no sidebar, no header)
- Block all navigation until password is changed

If `user.mustChangePassword === false`:
- Render normal app layout

### ChangePassword Page

**Location:** `packages/desktop/src/pages/ChangePassword.tsx`

**UI (follows design-system.mdc):**
- Full-screen centered card (no sidebar, no header)
- Background: `bg-[#F3F4F6]`
- Card: `bg-white rounded-2xl shadow-sm border border-gray-100 p-8`
- Width: `max-w-md`
- Icon: `Lock` from lucide-react in `bg-blue-50 rounded-lg text-blue-600`
- Title: "Change Your Password" — `text-2xl font-bold text-gray-900`
- Subtitle: "You must change your default password before continuing." — `text-gray-500 text-sm`

**Form fields:**
- New Password input with show/hide toggle (Eye/EyeOff icons)
  - Standard input style: `w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`
  - Icon: `Lock` inside input
- Confirm Password input with show/hide toggle
- Error messages: `text-red-500 text-xs font-medium`

**Validation:**
- Min 6 characters
- Passwords must match
- Show inline errors below each field

**Button:**
- Primary style: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95`
- Loading state: `Loader2` spinner + "Changing..."
- Disabled when: loading, passwords don't match, password < 6 chars

**Success flow:**
1. Call `PUT /api/auth/change-password`
2. On success: call `setMustChangePassword(false)` from AuthContext
3. Navigate to `/dashboard`
4. Show success toast

### ManageAccount UI

**Changes to the account registration/edit form:**

Add checkbox between password field and status toggle:
- Label: "Force password change on first login"
- Default: checked (true) for new accounts
- Unchecked for existing accounts unless explicitly set

When checkbox is checked:
- Password field shows placeholder: `brgy418` (default)
- If admin leaves password empty, system uses `brgy418`

When checkbox is unchecked:
- Password field works normally (admin enters custom password)

### User Type Update

Add to `packages/desktop/src/types.ts`:

```typescript
export interface User {
  ...
  mustChangePassword?: boolean;
  ...
}
```

## Migration

Run after schema change:
```bash
pnpm db:migrate
```

Migration name: `add_must_change_password`

Existing users get `mustChangePassword: false` (no disruption).

## Files to Create/Modify

| File | Action |
|------|--------|
| `packages/db/prisma/schema.prisma` | Add `mustChangePassword` field |
| `packages/server/src/controllers/authController.ts` | Include `mustChangePassword` in login response, add `changePassword` endpoint |
| `packages/server/src/routes/auth.ts` | Add `PUT /change-password` route |
| `packages/server/src/controllers/userController.ts` | Accept `mustChangePassword` in create/update |
| `packages/desktop/src/types.ts` | Add `mustChangePassword` to User type |
| `packages/desktop/src/services/auth.ts` | Add `changePassword` method |
| `packages/desktop/src/context/AuthContext.tsx` | Store `mustChangePassword`, expose setter |
| `packages/desktop/src/App.tsx` | Route to ChangePassword when flag is true |
| `packages/desktop/src/pages/ChangePassword.tsx` | New page |
| `packages/desktop/src/pages/ManageAccount.tsx` | Add checkbox, wire to payload |

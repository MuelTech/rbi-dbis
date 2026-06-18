# Forced Password Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add forced password change on first login — new users must change their default password before accessing the app.

**Architecture:** Add `mustChangePassword` boolean to User model. Login response includes this flag. Frontend redirects to a full-screen ChangePassword page when flag is true. ManageAccount gets a checkbox to control the flag per user.

**Tech Stack:** Prisma 6, MySQL, Express 5, React 19, TanStack Query 5, Tailwind CSS, bcryptjs

## Global Constraints

- TanStack Query mandatory for all server-state fetching
- Query keys: `['auth']`, `['users']`
- Mutations must call `invalidateQueries` on success
- Tailwind CSS utility classes only (no CSS files)
- Icons: lucide-react only
- Server source uses `.js` extensions in import paths
- Default password: `brgy418`
- Min password length: 6 characters

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `packages/db/prisma/schema.prisma` | Modify | Add `mustChangePassword` field to User |
| `packages/server/src/controllers/authController.ts` | Modify | Include flag in login, add changePassword endpoint |
| `packages/server/src/routes/auth.ts` | Modify | Add PUT /change-password route |
| `packages/server/src/controllers/userController.ts` | Modify | Accept flag in create/update |
| `packages/desktop/src/types.ts` | Modify | Add flag to User type |
| `packages/desktop/src/services/auth.ts` | Modify | Add changePassword method |
| `packages/desktop/src/context/AuthContext.tsx` | Modify | Store flag, expose setter |
| `packages/desktop/src/App.tsx` | Modify | Route to ChangePassword when flag is true |
| `packages/desktop/src/pages/ChangePassword.tsx` | Create | Full-screen password change page |
| `packages/desktop/src/pages/ManageAccount.tsx` | Modify | Add checkbox for flag |

---

### Task 1: Add mustChangePassword to User Model

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Produces: `mustChangePassword` field on User model

- [ ] **Step 1: Add field to User model**

In `packages/db/prisma/schema.prisma`, add after line 189 (`permission`):

```prisma
  mustChangePassword Boolean   @default(false) @map("must_change_password")
```

- [ ] **Step 2: Generate Prisma client**

Run: `pnpm db:generate`

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/schema.prisma
git commit -m "feat(db): add mustChangePassword field to User model"
```

---

### Task 2: Add changePassword Endpoint to Auth Controller

**Files:**
- Modify: `packages/server/src/controllers/authController.ts`

**Interfaces:**
- Consumes: `prisma` from `@rbi/db`, `bcrypt` from `bcryptjs`
- Produces: `changePassword(req, res, next)` function, updated `login` response

- [ ] **Step 1: Update login response to include mustChangePassword**

In the `login` function, update the response object (around line 54) to include the flag:

```typescript
    res.json({
      token,
      user: {
        id: user.id,
        displayId: user.displayId,
        username: user.username,
        roleType: user.roleType,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        permission: user.permission,
        lastLogin: new Date().toISOString(),
        firstName: userInfo?.firstName ?? "",
        lastName: userInfo?.lastName ?? "",
        phoneNumber: userInfo?.phoneNumber ?? "",
        profileImage: userInfo?.profileImage ?? null,
      },
    });
```

- [ ] **Step 2: Update me response to include mustChangePassword**

In the `me` function, update the response (around line 89) to include the flag:

```typescript
    res.json({
      id: user.id,
      displayId: user.displayId,
      username: user.username,
      roleType: user.roleType,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      permission: user.permission,
      lastLogin: user.lastLogin?.toISOString() ?? null,
      firstName: user.userInfo?.firstName ?? "",
      lastName: user.userInfo?.lastName ?? "",
      phoneNumber: user.userInfo?.phoneNumber ?? "",
      profileImage: user.userInfo?.profileImage ?? null,
    });
```

- [ ] **Step 3: Add changePassword function**

Add at the end of `authController.ts`:

```typescript
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authUser = req.user!;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Add route**

In `packages/server/src/routes/auth.ts`, add:

```typescript
import { login, me, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

// ... existing routes ...

authRouter.put("/change-password", requireAuth, changePassword);
```

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/controllers/authController.ts packages/server/src/routes/auth.ts
git commit -m "feat(server): add changePassword endpoint and include mustChangePassword in login"
```

---

### Task 3: Accept mustChangePassword in User Controller

**Files:**
- Modify: `packages/server/src/controllers/userController.ts`

**Interfaces:**
- Consumes: `prisma` from `@rbi/db`
- Produces: Updated create/update to handle `mustChangePassword`

- [ ] **Step 1: Update createUser to accept mustChangePassword**

In `extractUserInfoFields`, add `mustChangePassword` to the data extraction. In `createUser`, the `data` object already spreads from `req.body`, so `mustChangePassword` will be included automatically. No code change needed — just verify the field passes through.

- [ ] **Step 2: Update default password to brgy418**

In `createUser`, change the default password hash:

```typescript
    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    } else {
      data.password = await bcrypt.hash("brgy418", SALT_ROUNDS);
    }
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/userController.ts
git commit -m "feat(server): accept mustChangePassword in user create, default password brgy418"
```

---

### Task 4: Update Frontend Types and Services

**Files:**
- Modify: `packages/desktop/src/types.ts`
- Modify: `packages/desktop/src/services/auth.ts`

**Interfaces:**
- Produces: `mustChangePassword` on User type, `changePassword` service method

- [ ] **Step 1: Add mustChangePassword to User type**

In `packages/desktop/src/types.ts`, add to the User interface:

```typescript
export interface User {
  id: string;
  displayId?: number;
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  phoneNumber?: string;
  profileImage?: string | null;
  role: 'SuperAdmin' | 'Admin';
  roleType?: string;
  permission: 'Full Access' | 'Resident Access' | 'Document Access' | 'Resident & Document Access';
  lastLogin?: string;
  status: 'Active' | 'Disabled';
  isActive?: boolean;
  mustChangePassword?: boolean;
  userInfo?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profileImage?: string | null;
  };
}
```

- [ ] **Step 2: Add mustChangePassword to AuthUser type**

In `packages/desktop/src/services/auth.ts`, add to `AuthUser`:

```typescript
export interface AuthUser {
  id: string;
  displayId?: number;
  username: string;
  roleType: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  permission?: string;
  lastLogin?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImage?: string | null;
}
```

- [ ] **Step 3: Add changePassword method**

In `packages/desktop/src/services/auth.ts`, add:

```typescript
  changePassword: (newPassword: string) =>
    api.put<{ success: boolean }>("/auth/change-password", { newPassword }),
```

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/types.ts packages/desktop/src/services/auth.ts
git commit -m "feat(desktop): add mustChangePassword to types and changePassword service"
```

---

### Task 5: Update AuthContext

**Files:**
- Modify: `packages/desktop/src/context/AuthContext.tsx`

**Interfaces:**
- Consumes: `AuthUser` with `mustChangePassword`, `changePassword` service
- Produces: `mustChangePassword` in context, `setMustChangePassword`, `changePassword`

- [ ] **Step 1: Update mapAuthUser to include mustChangePassword**

```typescript
function mapAuthUser(au: AuthUser): User {
  return {
    id: au.id,
    displayId: au.displayId,
    firstName: au.firstName,
    lastName: au.lastName,
    username: au.username,
    phoneNumber: au.phoneNumber,
    profileImage: au.profileImage,
    role: au.roleType as User['role'],
    roleType: au.roleType,
    permission: (au.permission ?? 'Full Access') as User['permission'],
    lastLogin: au.lastLogin ?? undefined,
    status: au.isActive ? 'Active' : 'Disabled',
    isActive: au.isActive,
    mustChangePassword: au.mustChangePassword ?? false,
  };
}
```

- [ ] **Step 2: Update AuthContextType**

```typescript
interface AuthContextType {
  user: User | null;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;
}
```

- [ ] **Step 3: Add mustChangePassword state and changePassword function**

```typescript
const [mustChangePassword, setMustChangePassword] = useState(false);

const changePassword = useCallback(async (newPassword: string): Promise<boolean> => {
  try {
    await authService.changePassword(newPassword);
    setMustChangePassword(false);
    setUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
    return true;
  } catch {
    return false;
  }
}, []);
```

- [ ] **Step 4: Update login to set mustChangePassword**

```typescript
const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const { token, user: au } = await authService.login(username, password);
    localStorage.setItem('authToken', token);
    const mapped = mapAuthUser(au);
    setUser(mapped);
    setMustChangePassword(mapped.mustChangePassword ?? false);
    localStorage.setItem('currentUser', JSON.stringify(mapped));
    return true;
  } catch (err: any) {
    const msg: string = err?.message ?? '';
    if (msg.includes('disabled') || msg.includes('Disabled')) {
      alert('Your account is disabled. Please contact the administrator.');
    }
    return false;
  }
};
```

- [ ] **Step 5: Update refreshUser to set mustChangePassword**

In `refreshUser`, after setting user:

```typescript
setMustChangePassword(mapped.mustChangePassword ?? false);
```

- [ ] **Step 6: Update provider value**

```typescript
return (
  <AuthContext.Provider value={{ user, mustChangePassword, login, logout, refreshUser, changePassword }}>
    {children}
  </AuthContext.Provider>
);
```

- [ ] **Step 7: Commit**

```bash
git add packages/desktop/src/context/AuthContext.tsx
git commit -m "feat(desktop): add mustChangePassword and changePassword to AuthContext"
```

---

### Task 6: Create ChangePassword Page

**Files:**
- Create: `packages/desktop/src/pages/ChangePassword.tsx`

**Interfaces:**
- Consumes: `useAuth` for `changePassword`, `useNavigate` for redirect
- Produces: Full-screen password change page

- [ ] **Step 1: Create the page**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const success = await changePassword(newPassword);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Failed to change password. Please try again.');
    }
  };

  return (
    <div className="h-screen w-full bg-[#F3F4F6] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h1>
          <p className="text-gray-500 text-sm">You must change your default password before continuing.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
```

- [ ] **Step 2: Commit**

```bash
git add packages/desktop/src/pages/ChangePassword.tsx
git commit -m "feat(desktop): create ChangePassword page"
```

---

### Task 7: Update App Routing

**Files:**
- Modify: `packages/desktop/src/App.tsx`

**Interfaces:**
- Consumes: `mustChangePassword` from `useAuth`
- Produces: Conditional routing to ChangePassword

- [ ] **Step 1: Import ChangePassword**

```typescript
import ChangePassword from '@/pages/ChangePassword';
```

- [ ] **Step 2: Update App to destructure mustChangePassword**

```typescript
const { user, mustChangePassword, logout } = useAuth();
```

- [ ] **Step 3: Add ChangePassword route after login check**

After the `if (!user) return null;` line, add:

```typescript
if (mustChangePassword) {
  return <ChangePassword />;
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/App.tsx
git commit -m "feat(desktop): route to ChangePassword when mustChangePassword is true"
```

---

### Task 8: Update ManageAccount UI

**Files:**
- Modify: `packages/desktop/src/pages/ManageAccount.tsx`

**Interfaces:**
- Consumes: `mustChangePassword` in form state
- Produces: Checkbox UI, flag sent to API

- [ ] **Step 1: Add mustChangePassword to form state**

```typescript
const initialFormState = {
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  phoneNumber: '',
  status: true,
  role: 'Admin' as 'Admin' | 'SuperAdmin',
  permission: 'Resident Access' as 'Full Access' | 'Resident Access' | 'Document Access' | 'Resident & Document Access',
  mustChangePassword: true,
};
```

- [ ] **Step 2: Add checkbox UI after the password field**

After the password input field, add:

```tsx
{/* Must Change Password */}
<div className="space-y-2 col-span-2">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={formData.mustChangePassword}
      onChange={(e) => setFormData(prev => ({ ...prev, mustChangePassword: e.target.checked }))}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
    />
    <span className="text-[13px] font-bold text-gray-600">Force password change on first login</span>
  </label>
</div>
```

- [ ] **Step 3: Update payload to include mustChangePassword**

In `handleSave`, add to the payload:

```typescript
const payload: any = {
  username: formData.username,
  roleType: formData.role,
  permission: formData.permission,
  isActive: formData.status,
  firstName: formData.firstName,
  lastName: formData.lastName,
  phoneNumber: formData.phoneNumber,
  mustChangePassword: formData.mustChangePassword,
};
```

- [ ] **Step 4: Update handleEdit to load mustChangePassword**

In `handleEdit`, add to the editData:

```typescript
const editData = {
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  password: user.password || '',
  phoneNumber: user.phoneNumber || '',
  status: user.status === 'Active',
  role: user.role,
  permission: user.permission,
  mustChangePassword: user.mustChangePassword ?? false,
};
```

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/pages/ManageAccount.tsx
git commit -m "feat(desktop): add mustChangePassword checkbox to ManageAccount"
```

---

### Task 9: Verify End-to-End

- [ ] **Step 1: Run migration**

```bash
pnpm db:migrate
```

- [ ] **Step 2: Start server and desktop**

```bash
pnpm dev:server
pnpm dev:desktop
```

- [ ] **Step 3: Test flow**

1. Login as admin
2. Go to Manage Account
3. Create new user with "Force password change" checked
4. Login as new user with `brgy418`
5. Verify redirect to ChangePassword page
6. Enter new password (min 6 chars)
7. Verify redirect to dashboard
8. Logout and login again — should NOT redirect to ChangePassword

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: forced password change end-to-end verification fixes"
```

# RBI-DBIS Postman Auth Tests

## Prerequisites

1. **Node.js 18+** and **pnpm** installed.
2. Server dependencies installed: `pnpm install` (from repo root).
3. Database running (XAMPP MariaDB or standalone MariaDB).
4. Prisma client generated and migrations applied:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```
5. Database seeded with QA account:
   ```bash
   pnpm db:seed
   ```
6. Server running:
   ```bash
   pnpm dev:server
   ```

## Seeded QA Credentials

| Field    | Value              |
|----------|--------------------|
| Username | `qa_admin`         |
| Password | `Rbi#QA2026!xK9m`  |

These are pre-configured in the Postman environment file.

## Import into Postman

1. Open Postman (desktop app or web).
2. Click **Import** (top-left).
3. Drag or browse to import both files:
   - `postman/collections/auth-flow.collection.json`
   - `postman/environments/local-auth.environment.json`
4. Select the **RBI-DBIS Local Auth** environment from the environment dropdown (top-right).

## Run the Collection

### Via Postman GUI

1. Open the **RBI-DBIS Auth Flow** collection.
2. Click **Run collection** (or the runner icon).
3. Ensure the **RBI-DBIS Local Auth** environment is selected.
4. Click **Run RBI-DBIS Auth Flow**.
5. All five requests should pass their test assertions.

### Via Newman CLI (headless)

Install Newman globally if you haven't:

```bash
npm install -g newman
```

Run:

```bash
newman run postman/collections/auth-flow.collection.json \
  -e postman/environments/local-auth.environment.json
```

## Requests Included

| # | Name                           | Method | Endpoint          | Expected Status |
|---|--------------------------------|--------|-------------------|-----------------|
| 1 | Health Check                   | GET    | `/api/health`     | 200             |
| 2 | Login - Success                | POST   | `/api/auth/login` | 200             |
| 3 | Login - Failure (wrong password) | POST | `/api/auth/login` | 401             |
| 4 | Me - Without Token             | GET    | `/api/auth/me`    | 401             |
| 5 | Me - With Token                | GET    | `/api/auth/me`    | 200             |

Requests must run in order: the "Login - Success" request saves the JWT token to the `authToken` environment variable, which is used by "Me - With Token".

## Troubleshooting

- **Connection refused**: Ensure the server is running on port 4000.
- **401 on login**: Ensure you ran `pnpm db:seed` so the QA user exists.
- **Token expired**: Re-run "Login - Success" to get a fresh token.

# RBI-DBIS Postman API Testing

This folder now uses a folder-based Postman collection (YAML requests), not a single JSON collection export.

## Postman Files in This Repo

- Collection folder: `postman/collections/RBI-DBIS Auth Flow/`
- Environment file: `postman/environments/local-auth.environment.json`
- Postman workspace mapping (for cloud/local sync): `.postman/resources.yaml`

## Prerequisites

1. Install dependencies from the repo root:
   ```bash
   pnpm install
   ```
2. Ensure MySQL/MariaDB is running (XAMPP or standalone).
3. Generate Prisma client and apply migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```
4. Seed QA data:
   ```bash
   pnpm db:seed
   ```
5. Start the API:
   ```bash
   pnpm dev:server
   ```

## Seeded QA Credentials

| Field | Value |
|---|---|
| Username | `qa_admin` |
| Password | `Rbi#QA2026!xK9m` |

These are already set in `local-auth.environment.json`.

## Step-by-Step in Postman App

1. Open Postman desktop app.
2. Create or select a workspace (for example, "RBI-DBIS Local").
3. Import the environment:
   1. Click **Import**.
   2. Choose **Files**.
   3. Select `postman/environments/local-auth.environment.json`.
   4. Click **Import**.
4. Import the collection folder:
   1. Click **Import** again.
   2. Choose **Folder**.
   3. Select `postman/collections/RBI-DBIS Auth Flow`.
   4. Click **Import**.
5. In the top-right environment dropdown, select **RBI-DBIS Local Auth**.
6. Open request **Health Check** and click **Send**.
   - Expected result: HTTP `200` with `{ "status": "ok" }`.
7. Run login request:
   1. Open **Login - Success**.
   2. Click **Send**.
   3. Confirm status `200` and token returned.
8. Confirm token was saved:
   1. Open the selected environment.
   2. Check `authToken` has a value.
9. Test protected route:
   1. Open **Me - With Token**.
   2. Click **Send**.
   3. Expected result: HTTP `200`.
10. Negative checks:
   1. Send **Login - Failure (wrong password)** and expect `401`.
   2. Send **Me - Without Token** and expect `401`.

## Run Entire Auth Flow (Collection Runner)

1. Open the collection **RBI-DBIS Auth Flow**.
2. Click **Run**.
3. Select environment **RBI-DBIS Local Auth**.
4. Run all requests in collection order.
5. Expect all tests to pass.

## Endpoints Covered by Auth Flow

| # | Name | Method | Endpoint | Expected Status |
|---|---|---|---|---|
| 1 | Health Check | GET | `/api/health` | 200 |
| 2 | Login - Success | POST | `/api/auth/login` | 200 |
| 3 | Login - Failure (wrong password) | POST | `/api/auth/login` | 401 |
| 4 | Me - Without Token | GET | `/api/auth/me` | 401 |
| 5 | Me - With Token | GET | `/api/auth/me` | 200 |

Base URL used by the environment: `http://localhost:4000/api`

## Testing Other Protected APIs

After `Login - Success`, you can test additional endpoints using the same environment token:

- `GET {{baseUrl}}/users`
- `GET {{baseUrl}}/residents`
- `GET {{baseUrl}}/households`
- `GET {{baseUrl}}/documents`
- `GET {{baseUrl}}/activity-logs`

In Postman, set **Authorization** to **Bearer Token** and use `{{authToken}}`.

## Troubleshooting

- Connection refused: ensure `pnpm dev:server` is running on port `4000`.
- Login returns `401`: run `pnpm db:seed` so QA user exists.
- `Me - With Token` returns `401`: rerun `Login - Success` to refresh `authToken`.
- If using Postman web app for localhost testing, make sure Postman Desktop Agent is running.

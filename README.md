# Barangay 418 (RBI-DBIS)

A pnpm workspaces monorepo containing the full-stack barangay management system.

## Packages

| Package | Description |
|---------|-------------|
| `@rbi/desktop` | React + Electron desktop app |
| `@rbi/server` | Express REST API |
| `@rbi/db` | Prisma schema and database client |

## Prerequisites

- Node.js 18+
- pnpm (`npm i -g pnpm`)
- XAMPP (MySQL running on port 3306)

## Getting Started

```bash
# Install all dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Create/apply database migrations (requires MySQL running)
pnpm db:migrate

# Start the API server (http://localhost:4000)
pnpm dev:server

# Start the desktop app (Electron + Vite)
pnpm dev:desktop
```

## Project Structure

```
rbi-dbis/
├── .npmrc                    # node-linker=hoisted (required for Electron)
├── pnpm-workspace.yaml
├── package.json              # root scripts
├── packages/
│   ├── db/                   # @rbi/db
│   │   ├── prisma/schema.prisma
│   │   └── src/index.ts
│   ├── server/               # @rbi/server
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       ├── controllers/
│   │       └── middleware/
│   └── desktop/              # @rbi/desktop
│       ├── electron/
│       │   ├── main.ts
│       │   └── preload.ts
│       ├── src/
│       │   ├── App.tsx
│       │   ├── pages/
│       │   ├── components/
│       │   └── services/
│       ├── forge.config.ts
│       └── vite.config.ts
```

## Database

Copy `.env.example` to `.env` in `packages/db/` and `packages/server/`, then update `DATABASE_URL` if your MySQL credentials differ from the default (root with no password).

Open Prisma Studio to browse data:

```bash
pnpm db:studio
```

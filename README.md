# OpenXeco ATLAS Connector

Manages cybersecurity cluster registrations and syncs them with the [European Cybersecurity ATLAS API](https://eccc-atlas.eu). Built for ECCC membership workflows.

## Tech Stack

- **Frontend**: Next.js 16.1, React 19, TailwindCSS, shadcn/ui, SWR
- **Backend**: Fastify 5.7, TypeScript, Drizzle ORM
- **Database**: PostgreSQL 17
- **Auth**: JWT access tokens (in-memory) + httpOnly refresh token cookies, Argon2
- **Deployment**: Docker Compose

## Quick Start

```bash
pnpm install
cp .env.example .env         # edit with your config — change JWT_SECRET!

docker-compose up -d db      # start PostgreSQL

pnpm --filter @atlas-connector/backend db:push
pnpm --filter @atlas-connector/backend seed:admin

# two terminals:
pnpm --filter @atlas-connector/backend dev     # localhost:3001
pnpm --filter @atlas-connector/frontend dev    # localhost:3000
```

Default login: `admin@atlas-connector.local` / `admin123456` — change the password immediately.

## Project Structure

```
packages/
├── backend/           # Fastify REST API
│   └── src/
│       ├── routes/    # auth, entities, taxonomies, sync, settings, users
│       ├── services/  # ATLAS client, JSON:API transformer, sync engine
│       ├── db/        # Drizzle schema + migrations
│       └── middleware/ # JWT auth, admin enforcement
└── frontend/          # Next.js (App Router)
    └── src/
        ├── app/
        │   ├── (dashboard)/  # layout with sidebar/header, all dashboard pages
        │   └── login/        # public login page
        ├── components/       # shadcn/ui based
        ├── contexts/         # auth context
        └── lib/              # API client, SWR fetcher
```

## Architecture

### Authentication Flow

1. **Login**: Backend validates credentials, returns access token in body and sets refresh token as httpOnly cookie (`sameSite: strict`, `secure` in production, scoped to `/api/auth`).
2. **Access token**: Stored in-memory (not localStorage) to prevent XSS exposure. Sent as `Authorization: Bearer` header on API requests.
3. **Refresh**: Frontend calls `POST /api/auth/refresh` with `credentials: 'include'`. Backend reads refresh token from cookie, issues new token pair.
4. **Auto-refresh**: Auth context refreshes tokens every 50 minutes via `setInterval`.

### API Proxy

In production, Next.js rewrites `/api/*` requests to the backend (`BACKEND_INTERNAL_URL`). In development, `NEXT_PUBLIC_API_URL` can point directly at the backend.

### Data Fetching

Frontend pages use [SWR](https://swr.vercel.app/) with a shared `apiFetcher` that includes auth headers and `credentials: 'include'`. Mutations use the `apiClient` directly and call SWR's `mutate()` to revalidate.

### Taxonomy Hierarchy

ATLAS taxonomies (18 types) are cached locally. Knowledge domains (thematic areas) have a parent-child hierarchy — child records store the parent's **ATLAS UUID** in their `parentId` field (not the local DB UUID). The `MultiSelect` component supports hierarchical display with root items rendered bold and children indented.

## Commands

```bash
# quality
pnpm lint
pnpm typecheck
pnpm format

# backend
pnpm --filter @atlas-connector/backend dev
pnpm --filter @atlas-connector/backend build
pnpm --filter @atlas-connector/backend test
pnpm --filter @atlas-connector/backend db:push       # apply schema
pnpm --filter @atlas-connector/backend db:generate   # generate migration
pnpm --filter @atlas-connector/backend db:migrate    # run migrations
pnpm --filter @atlas-connector/backend db:studio     # Drizzle Studio UI
pnpm --filter @atlas-connector/backend seed:admin

# frontend
pnpm --filter @atlas-connector/frontend dev
pnpm --filter @atlas-connector/frontend build
```

## API

### Auth

| Method | Endpoint            | Auth | Description                          |
| ------ | ------------------- | ---- | ------------------------------------ |
| POST   | `/api/auth/login`   | No   | Login (sets refresh token cookie)    |
| POST   | `/api/auth/logout`  | Yes  | Logout (clears refresh token cookie) |
| POST   | `/api/auth/refresh` | Cookie | Refresh access token               |
| GET    | `/api/auth/me`      | Yes  | Current user                         |

### Entities

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/api/entities`              | List (paginated)       |
| GET    | `/api/entities/:id`          | Get by ID              |
| POST   | `/api/entities`              | Create                 |
| PATCH  | `/api/entities/:id`          | Update                 |
| DELETE | `/api/entities/:id`          | Delete                 |
| GET    | `/api/entities/:id/versions` | Version history        |

### Sync

| Method | Endpoint                          | Description              |
| ------ | --------------------------------- | ------------------------ |
| POST   | `/api/sync/entities/:id/push`     | Push entity to ATLAS     |
| POST   | `/api/sync/entities/:id/pull`     | Pull entity from ATLAS   |
| GET    | `/api/sync/entities/:id/diff`     | Field-level diff         |
| GET    | `/api/sync/entities/:id/conflicts`| Detect conflicts         |
| POST   | `/api/sync/entities/:id/resolve`  | Resolve conflict         |
| POST   | `/api/sync/batch/push`            | Batch push               |
| POST   | `/api/sync/batch/pull`            | Batch pull               |
| GET    | `/api/sync/status`                | Sync status overview     |
| GET    | `/api/sync/logs`                  | Sync log history         |
| DELETE | `/api/sync/logs/cleanup`          | Clean old logs           |

### Taxonomies

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| POST   | `/api/taxonomies/sync`       | Sync all from ATLAS      |
| POST   | `/api/taxonomies/sync/:type` | Sync one type            |
| GET    | `/api/taxonomies/:type`      | List by type             |
| GET    | `/api/taxonomies/id/:id`     | Get by ID                |
| GET    | `/api/taxonomies/count`      | Count by type            |
| GET    | `/api/taxonomies/search`     | Search by name           |

### Health

| Method | Endpoint        | Description     |
| ------ | --------------- | --------------- |
| GET    | `/health`       | Health check    |
| GET    | `/health/live`  | Liveness probe  |
| GET    | `/health/ready` | Readiness probe |

## ECCC Registration Fields

The entity model covers the full ECCC membership registration form:

- **Basic info**: name (English + national language), department
- **Address**: country code (ISO 3166-1), city, street, postal code, coordinates
- **Contact**: email, phone, website, registration number
- **Contact person**: first name, last name, email, position, phone
- **Compliance**: Article 138 compliance, data sharing consent
- **Structure**: headquarters flag, subsidiaries, majority shares
- **Expertise**: description (800 char limit), goals to achieve/contribute
- **Taxonomy dimensions**: thematic areas (knowledge domains), sectors, technologies, use cases, fields of activity, sub-domains

Conditional validation applies (e.g. `headquarterInfo` required when `isHeadquarter` is false). See the entity creation endpoint for the full schema.

> **Note**: ATLAS uses "article 136" while this application stores it as "article 138" — the field maps correctly during sync.

## Entity Status Flow

```
status:     draft → ready_for_publication → published / to_be_rejected
syncStatus: local → pending_push → synced / conflict / failed
```

## Environment

See `.env.example` for all variables. Key ones:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Min 32 chars, change from default |
| `ATLAS_BASE_URL` | ATLAS API base URL |
| `ATLAS_USERNAME` | ATLAS API username |
| `ATLAS_PASSWORD` | ATLAS API password |
| `HTTPS_PROXY` | Optional proxy for ATLAS requests |
| `BACKEND_INTERNAL_URL` | Backend URL for Next.js rewrites (production) |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend (development) |

## License

BSD-2-Clause

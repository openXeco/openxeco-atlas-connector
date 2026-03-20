# OpenXeco ATLAS Connector

Current version: `0.1.0`

Manages cybersecurity cluster registrations and syncs them with
the [European Cybersecurity ATLAS API](https://eccc-atlas.eu). Built for ECCC membership workflows.

This project is part of [openXeco](https://github.com/openXeco) platform, and it's developed and maintained
by [NC3 - The National Cybersecurity Competence Center Luxembourg](https://nc3.lu)

## Tech Stack

- **Frontend**: Next.js, TailwindCSS, shadcn/ui, SWR
- **Backend**: Node.js, Fastify, Drizzle ORM
- **Database**: PostgreSQL
- **Auth**: JWT access tokens (in-memory) + httpOnly refresh token cookies, Argon2
- **Deployment**: Docker Compose

## Quick Start (development)

```bash
pnpm install
cp .env.example .env         # edit with your config — change JWT_SECRET!

docker-compose up -d db      # start PostgreSQL

pnpm --filter @openxeco/atlas-connector-backend db:push
pnpm --filter @openxeco/atlas-connector-backend seed:admin
```

> This command will create an initial admin user
> The default login is: `admin@atlas-connector.local` / `admin123456`

```bash
# one terminal (all the logs are combined):
pnpm dev

# two terminals:
pnpm dev:backend     # localhost:3001
pnpm dev:frontend    # localhost:3000
```

## Project Structure

```
packages/
├── backend/
│   └── src/
│       ├── app.ts                 # Fastify app bootstrap
│       ├── index.ts               # API entrypoint
│       ├── config/                # config + env adaptation
│       ├── db/                    # Drizzle schema + migrations
│       │   └── migrations/
│       ├── middleware/              # error handling, auth guards
│       ├── routes/                  # auth, entities, taxonomies, sync, settings, users
│       ├── services/                # atlas/openxeco clients and transformers
│       ├── scripts/                 # seed/migration scripts
│       └── (others as needed)      # other backend utilities
├── frontend/
│   └── src/
│       ├── app/                    # Next.js App Router and pages
│       │   ├── (dashboard)/          # dashboard layout and pages
│       │   └── login/                # public login page
│       ├── assets/                  # images, fonts, etc.
│       ├── components/              # UI components (Tailwind/shadcn)
│       ├── data/                    # data helpers
│       ├── lib/                     # API client, SWR fetchers, utilities
│       ├── schema/                  # type/schema helpers
│       ├── types.ts                 # frontend shared types
│       └── proxy.ts                 # API proxy/config
```

## Architecture

### Authentication Flow

1. **Login**: Backend validates credentials, returns access token and refresh token in body. The frontend server sets
   refresh token as httpOnly cookie (`sameSite: strict`, `secure` in production, scoped to `/`).
2. **Access token**: Stored in-memory (not localStorage) to prevent XSS exposure. Sent as `Authorization: Bearer` header
   on API requests.
3. **Refresh**: The refresh token mechanism is managed by the Next.js server part, trying to get a new access token
   after receiving a status code of 401 from backend

### Data Fetching

Frontend pages use [SWR](https://swr.vercel.app/) with a shared `apiFetcher`.

### Taxonomy Hierarchy

ATLAS taxonomies (18 types) are cached locally. Knowledge domains (thematic areas) have a parent-child hierarchy — child
records store the parent's **ATLAS UUID** in their `parentId` field (not the local DB UUID). The `MultiSelect` component
supports hierarchical display with root items rendered bold and children indented.

## Commands

```bash
# quality
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm format

# backend maintenance
pnpm --filter @openxeco/atlas-connector-backend db:push       # apply schema
pnpm --filter @openxeco/atlas-connector-backend db:generate   # generate migration (development)
pnpm --filter @openxeco/atlas-connector-backend db:migrate    # run migrations
pnpm --filter @openxeco/atlas-connector-backend db:studio     # Drizzle Studio UI (development)
pnpm --filter @openxeco/atlas-connector-backend seed:admin    # to be called only for first-user generation
```

> **Note**: the DB migrations are executed every time the backend application starts, so, in production it's
> not needed to run the command `db:migrate`

## API

### Auth

| Method | Endpoint        | Auth   | Description                          |
|--------|-----------------|--------|--------------------------------------|
| POST   | `/auth/login`   | No     | Login (sets refresh token cookie)    |
| POST   | `/auth/logout`  | Yes    | Logout (clears refresh token cookie) |
| POST   | `/auth/refresh` | Cookie | Refresh access token                 |
| GET    | `/auth/me`      | Yes    | Current user                         |

### Entities

| Method | Endpoint                 | Description      |
|--------|--------------------------|------------------|
| GET    | `/entities`              | List (paginated) |
| GET    | `/entities/:id`          | Get by ID        |
| POST   | `/entities`              | Create           |
| PATCH  | `/entities/:id`          | Update           |
| DELETE | `/entities/:id`          | Delete           |
| GET    | `/entities/:id/versions` | Version history  |

### Sync

| Method | Endpoint                       | Description            |
|--------|--------------------------------|------------------------|
| POST   | `/sync/entities/:id/push`      | Push entity to ATLAS   |
| POST   | `/sync/entities/:id/pull`      | Pull entity from ATLAS |
| GET    | `/sync/entities/:id/diff`      | Field-level diff       |
| GET    | `/sync/entities/:id/conflicts` | Detect conflicts       |
| POST   | `/sync/entities/:id/resolve`   | Resolve conflict       |
| POST   | `/sync/batch/push`             | Batch push             |
| POST   | `/sync/batch/pull`             | Batch pull             |
| GET    | `/sync/status`                 | Sync status overview   |
| GET    | `/sync/logs`                   | Sync log history       |
| DELETE | `/sync/logs/cleanup`           | Clean old logs         |

### Taxonomies

| Method | Endpoint                   | Description                   |
|--------|----------------------------|-------------------------------|
| POST   | `/taxonomies/sync`         | Sync all from ATLAS           |
| POST   | `/taxonomies/sync/:type`   | Sync one type                 |
| GET    | `/taxonomies/:type`        | List by type                  |
| GET    | `/taxonomies/id/:id`       | Get by ID                     |
| GET    | `/taxonomies/count/:?type` | Count by type (:type optional |
| GET    | `/taxonomies/search`       | Search by name                |

### Health

| Method | Endpoint        | Description     |
|--------|-----------------|-----------------|
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
- **Taxonomy dimensions**: thematic areas (knowledge domains and sub-domains), sectors, technologies, use cases, fields
  of activity

Conditional validation applies (e.g. `headquarterInfo` required when `isHeadquarter` is false). See the entity creation
endpoint for the full schema.

> **Note**: ATLAS uses "article 136" as name of the field while this application stores it as "article 138" — the field
> maps correctly during
> sync.

## Entity Status Flow

```
status:     draft → ready_for_publication → published / to_be_rejected
syncStatus: local → pending_push → synced / conflict / failed
```

> **Coming soon**: pull status from ATLAS and manage conflicts. (See [Roadmap](#roadmap)).

## Deployment

We recommend using [docker](https://www.docker.com/).

Check [docker-compose-dev.yml](./docker-compose.dev.yml) or [docker-compose-prod.yml](docker-compose.prod.yml) for
examples on how to configure a development or production stack.

Once the stack is ready and running, you can create the first user by entering into the backend container (using docker
shell) and running:

```shell
node app/dist/scripts/seed-admin.js
```

> An admin user will be created. In production environment we recommend to change the email and password immediately!

## Environment

See `.env.example` for all variables that need to be filled before starting the application.

## License

BSD-2-Clause

## Contributing

See [Contributing](./CONTRIBUTING.md)

## Roadmap

- Remove unused taxonomies
- Pull entities from ATLAS
- Change sync status on Entity change
- Bulk import of multiple entities (JSON upload)
- Implement conflicts resolution between local and ATLAS entities
- Implement ATLAS API and General settings
- Unit tests on all critical modules
- Improve the Authentication mechanism with MFA
- Reduce frontend components duplication
- Add settings for common ATLAS fields (i.e. `default country`)
- Integration with openXeco CORE

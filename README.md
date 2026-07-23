# OpenXeco ATLAS Connector

Current version: `0.2.0`

Manages cybersecurity cluster registrations and syncs them with
the [European Cybersecurity ATLAS API](https://eccc-atlas.eu). Built for ECCC membership workflows.

This project is part of [openXeco](https://github.com/openXeco) platform, and it's developed and maintained
by [NC3 - The National Cybersecurity Competence Center Luxembourg](https://nc3.lu)

## Tech Stack

- **Frontend**: Next.js, TailwindCSS, shadcn/ui, SWR
- **Backend**: Node.js, Fastify, Drizzle ORM
- **Database**: PostgreSQL
- **Auth**: JWT access and refresh tokens in an encrypted HTTP-only session cookie, Argon2
- **Deployment**: Docker Compose

## Quick Start (development)

### Prerequisites

- Node.js 24 (see `.nvmrc`)
- pnpm 11.9.0
- Docker with Docker Compose

```bash
pnpm install
cp .env.example .env
```

Edit `.env` before starting the application. At minimum, replace `JWT_SECRET`, `FRONTEND_SECRET_KEY`, and the ATLAS
connection placeholders. `FRONTEND_SECRET_KEY` must contain exactly 32 UTF-8 bytes.

```bash
docker compose up -d db      # start PostgreSQL
pnpm dev                     # frontend: localhost:3000, backend: localhost:3001
```

The backend applies committed database migrations automatically when it starts. After its first successful startup, run
the following command in another terminal to create the initial administrator:

```bash
pnpm --filter @openxeco/atlas-connector-backend seed:admin
```

The default login is `admin@atlas-connector.local` / `admin123456`. Override it with `ADMIN_EMAIL` and
`ADMIN_PASSWORD`, or change the password immediately after the first login.

To run the applications in separate terminals instead:

```bash
pnpm dev:backend     # localhost:3001
pnpm dev:frontend    # localhost:3000
```

## Project Structure

```
packages/
├── backend/
│   └── src/
│       ├── actions/                 # domain actions called by routes
│       ├── app.ts                   # Fastify application bootstrap
│       ├── config/                  # configuration and environment validation
│       ├── db/                      # Drizzle schema and migrations
│       │   └── migrations/
│       ├── index.ts                 # API entrypoint and migration startup
│       ├── middleware/              # error handling and auth guards
│       ├── routes/                  # auth, entities, import, settings, sync, taxonomies, users
│       ├── scripts/                 # seed and migration scripts
│       ├── services/                # ATLAS, openXeco, auth, and sync services
│       └── utils/                   # shared backend utilities
└── frontend/
    ├── public/                      # Next.js public assets
    └── src/
        ├── app/                     # App Router pages, server actions, and route handlers
        ├── assets/                  # imported images and fonts
        ├── components/              # Tailwind/shadcn UI components
        ├── data/                    # data helpers
        ├── lib/                     # API, session, SWR, and utility modules
        ├── schema/                  # validation schemas
        ├── proxy.ts                 # route protection
        └── types.ts                 # shared frontend types
```

## Architecture

### Authentication Flow

1. **Login**: The backend validates the credentials and returns an access token, a refresh token, and the refresh-token
   expiry in the response body.
2. **Session**: The Next.js server encrypts both tokens with AES-256-GCM and stores the encrypted session in an
   HTTP-only cookie (`SameSite=Strict`, `Secure` in production, scoped to `/`). Tokens are not exposed to browser-side
   JavaScript.
3. **Authenticated requests**: Next.js server actions and route handlers decrypt the session and send the access token
   to the backend as an `Authorization: Bearer` header.
4. **Refresh**: After a backend `401`, the Next.js server submits the refresh token in the `/auth/refresh` request body,
   rotates both tokens, updates the encrypted cookie, and retries the request.
5. **Logout**: The frontend deletes its session cookie. The backend logout endpoint is stateless and only acknowledges
   an authenticated request.

### Data Fetching

Frontend pages use [SWR](https://swr.vercel.app/) with a shared `apiFetcher`.

### Taxonomy Hierarchy

Ten ATLAS taxonomy types are cached locally. ATLAS returns thematic areas as a flat list, so the application applies a
maintained parent-child mapping during synchronization. Child records store the parent's **ATLAS UUID** in `parentId`
(not the local database UUID). The `MultiSelect` component renders root items in bold and indents their children.

## Commands

```bash
# quality
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm build

# backend maintenance
pnpm --filter @openxeco/atlas-connector-backend db:push       # apply schema
pnpm --filter @openxeco/atlas-connector-backend db:generate   # generate migration (development)
pnpm --filter @openxeco/atlas-connector-backend db:migrate    # run migrations
pnpm --filter @openxeco/atlas-connector-backend db:studio     # Drizzle Studio UI (development)
pnpm --filter @openxeco/atlas-connector-backend seed:admin    # to be called only for first-user generation
```

The backend runs committed migrations whenever it starts, so `db:migrate` does not need to be run separately in
production.

## API

All endpoints require an access-token Bearer header unless marked public. User and settings endpoints require an
administrator token.

### Auth

| Method | Endpoint        | Auth   | Description                                     |
|--------|-----------------|--------|-------------------------------------------------|
| POST   | `/auth/login`   | Public | Return an access/refresh token pair             |
| POST   | `/auth/refresh` | Public | Rotate tokens using a refresh token in the body |
| GET    | `/auth/me`      | Bearer | Return the current user                         |
| GET    | `/auth/check`   | Bearer | Check whether an access token is valid          |
| POST   | `/auth/logout`  | Bearer | Acknowledge logout; backend logout is stateless |

### Entities

| Method | Endpoint             | Description                  |
|--------|----------------------|------------------------------|
| GET    | `/entities`          | List (paginated)             |
| GET    | `/entities/:id`      | Get by ID                    |
| POST   | `/entities`          | Create                       |
| PUT    | `/entities/:id`      | Replace/update               |
| DELETE | `/entities/:id`      | Delete                       |
| POST   | `/entities/:id/push` | Push to ATLAS (legacy alias) |

### Sync

| Method | Endpoint                       | Description                         |
|--------|--------------------------------|-------------------------------------|
| POST   | `/sync/entities/:id/push`      | Push entity to ATLAS                |
| POST   | `/sync/entities/:id/pull`      | Pull entity from ATLAS              |
| GET    | `/sync/entities/:id/diff`      | Field-level diff                    |
| GET    | `/sync/entities/:id/conflicts` | Detect conflicts                    |
| POST   | `/sync/entities/:id/resolve`   | Resolve conflict                    |
| POST   | `/sync/batch/push`             | Batch push                          |
| POST   | `/sync/batch/pull`             | Batch pull                          |
| GET    | `/sync/status`                 | Sync status overview                |
| GET    | `/sync/entities`               | List local and remote sync entities |
| GET    | `/sync/logs`                   | Sync log history                    |
| DELETE | `/sync/logs/cleanup`           | Clean old logs                      |

### Taxonomies

| Method | Endpoint                   | Description                   |
|--------|----------------------------|-------------------------------|
| POST   | `/taxonomies/sync`         | Sync all from ATLAS           |
| POST   | `/taxonomies/sync/:type`   | Sync one type                 |
| GET    | `/taxonomies/:type`        | List by type                  |
| GET    | `/taxonomies/id/:id`       | Get by ID                     |
| GET    | `/taxonomies/count/:type?` | Count all or by optional type |
| GET    | `/taxonomies/search`       | Search by name                |

### Import

| Method | Endpoint                | Description                                    |
|--------|-------------------------|------------------------------------------------|
| POST   | `/import/openxeco`      | Import ECCC form data from cybersecurity.lu    |
| GET    | `/import/openxeco/info` | Return information about the configured import |

### Settings (administrator)

| Method | Endpoint               | Description                         |
|--------|------------------------|-------------------------------------|
| GET    | `/settings/atlas`      | Read non-secret ATLAS configuration |
| PATCH  | `/settings/atlas`      | Update ATLAS configuration          |
| POST   | `/settings/atlas/test` | Test an ATLAS connection            |
| GET    | `/settings/general`    | Read general settings               |
| PATCH  | `/settings/general`    | Update general settings             |

### Users (administrator)

| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | `/users`              | List users          |
| POST   | `/users`              | Create a user       |
| PATCH  | `/users/:id`          | Update a user email |
| PATCH  | `/users/:id/password` | Change a password   |
| DELETE | `/users/:id`          | Delete a user       |

### Health

| Method | Endpoint        | Description     |
|--------|-----------------|-----------------|
| GET    | `/health`       | Health check    |
| GET    | `/health/live`  | Liveness probe  |
| GET    | `/health/ready` | Readiness probe |

## ECCC Registration Fields

The persisted entity model currently includes:

- **Basic info**: name (English + national language), department
- **Address**: country code (ISO 3166-1), city, street
- **Contact**: email, phone, website, registration number
- **Contact person**: first name, last name, email, position, phone
- **Compliance**: Article 138 compliance, data sharing consent
- **Structure**: headquarters flag, subsidiaries, majority shares
- **Expertise**: description (800 char limit), goals to achieve/contribute
- **Taxonomy dimensions**: thematic areas (knowledge domains and sub-domains), sectors, technologies, use cases, fields
  of activity
- **Workflow**:
    - `status`: moderation state synchronized with ATLAS
    - `syncStatus`: synchronization lifecycle state
    - `syncCode`: optional reason associated with a failed synchronization

Conditional validation applies; for example, `headquarterInfo` is required when `isHeadquarter` is false. Postal code,
coordinates, description, logo URL, and organisation-type inputs are not currently persisted and should not be treated
as supported fields.

> **Note**: ATLAS names the compliance field "article 136", while this application stores it as "article 138". The
> transformer maps the field during synchronization.

## Entity Status and Synchronization

The entity `status` field is the canonical moderation state. It is mapped to and from ATLAS's
`moderation_state` field.

Supported entity statuses are:

- `draft`
- `ready_for_publication`
- `published` (coming from ATLAS)
- `to_be_rejected`
- `rejected` (coming from ATLAS)

Entity creation and update requests currently accept `draft`, `ready_for_publication`, and `to_be_rejected`. Statuses
received from ATLAS are stored in the same `status` field.

Supported synchronization statuses are:

- `pending_push`: the entity was created or changed locally and needs to be pushed to ATLAS
- `synced`: the entity was successfully synchronized with ATLAS
- `failed`: the last synchronization attempt failed

A failed synchronization can have an optional `syncCode`:

- `conflict`: the local and remote entity data conflict
- `not_found`: the entity identified by its `atlasId` could not be found
- `null`: the failure has no specific application-level classification

```text
create/update ───────────────→ pending_push
synced ── local update ──────→ pending_push
failed ── update or retry ───→ pending_push

pending_push ── success ─────→ synced
pending_push ── failure ─────→ failed
pull ────────── success ─────→ synced
pull ────────── conflict ────→ failed (syncCode: conflict)

## Deployment

We recommend using [Docker](https://www.docker.com/).

Check [docker-compose-dev.yml](./docker-compose.dev.yml) or [docker-compose-prod.yml](docker-compose.prod.yml) for
examples on how to configure a development or production stack.

Once the production stack is running and the backend has applied its migrations, create the first user with:

```shell
docker compose -f docker-compose.prod.yml exec backend node dist/scripts/seed-admin.js
```

The command creates the default administrator. Change its credentials immediately after the first login. To override the
seed credentials, provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the backend container environment.

## Environment

See `.env.example` for the available variables and notes about local versus full-Compose database URLs. Backend
configuration is validated at startup, and placeholder URLs must be replaced with valid absolute URLs.

## License

BSD-2-Clause

## Contributing

See [Contributing](./CONTRIBUTING.md)

## Roadmap

- Bulk import of multiple entities (JSON upload)
- Complete the frontend conflict-resolution workflow
- Enable ATLAS API settings in the frontend
- Unit tests on all critical modules
- Improve the Authentication mechanism with MFA
- Integration with openXeco CORE (V1)
- Integration with openXeco CORE (V2)

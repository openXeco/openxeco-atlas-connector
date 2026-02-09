# OpenXeco ATLAS Connector

A connector application for managing clusters with the European Cybersecurity ATLAS API.

## Tech Stack

- **Frontend**: Next.js 16.1, React 19, TailwindCSS 3.4, shadcn/ui
- **Backend**: Fastify 5.7, TypeScript 5.7
- **Database**: PostgreSQL 17, Drizzle ORM 1.0-beta
- **Cache**: Redis 7 (optional)
- **Auth**: JWT with argon2 password hashing
- **Deployment**: Docker + Docker Compose

## Prerequisites

- Node.js 20+
- pnpm 10.28+
- Docker & Docker Compose

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
# IMPORTANT: Change JWT_SECRET to a secure random string (min 32 chars)
```

### 3. Start Development Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d db redis
```

### 4. Initialize Database

```bash
# Push database schema
pnpm --filter @atlas-connector/backend db:push

# Create admin user
pnpm --filter @atlas-connector/backend seed:admin
```

### 5. Run Development Servers

```bash
# Terminal 1: Backend
pnpm --filter @atlas-connector/backend dev

# Terminal 2: Frontend
pnpm --filter @atlas-connector/frontend dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Login with: `admin@atlas-connector.local` / `admin123456`

**⚠️ Change the default password after first login!**

## Project Structure

```
openxeco-atlas-connector/
├── packages/
│   ├── backend/          # Fastify API server
│   └── frontend/         # Next.js application
├── docker-compose.yml    # Development services
├── package.json          # Root workspace config
├── pnpm-workspace.yaml   # pnpm workspace config
└── tsconfig.base.json    # Shared TypeScript config
```

## Scripts

### Root Commands

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm install`   | Install all dependencies     |
| `pnpm lint`      | Run ESLint on all packages   |
| `pnpm format`    | Format code with Prettier    |
| `pnpm typecheck` | Run TypeScript type checking |

### Backend Commands

| Command                                              | Description                  |
| ---------------------------------------------------- | ---------------------------- |
| `pnpm --filter @atlas-connector/backend dev`         | Start backend dev server     |
| `pnpm --filter @atlas-connector/backend build`       | Build backend for production |
| `pnpm --filter @atlas-connector/backend db:push`     | Push database schema         |
| `pnpm --filter @atlas-connector/backend db:generate` | Generate migrations          |
| `pnpm --filter @atlas-connector/backend db:studio`   | Open Drizzle Studio          |
| `pnpm --filter @atlas-connector/backend seed:admin`  | Create admin user            |

### Frontend Commands

| Command                                         | Description                   |
| ----------------------------------------------- | ----------------------------- |
| `pnpm --filter @atlas-connector/frontend dev`   | Start frontend dev server     |
| `pnpm --filter @atlas-connector/frontend build` | Build frontend for production |

## API Endpoints

### Authentication

| Method | Endpoint            | Description          | Auth Required |
| ------ | ------------------- | -------------------- | ------------- |
| POST   | `/api/auth/login`   | User login           | No            |
| POST   | `/api/auth/logout`  | User logout          | Yes           |
| POST   | `/api/auth/refresh` | Refresh access token | No            |
| GET    | `/api/auth/me`      | Get current user     | Yes           |

### Taxonomies

| Method | Endpoint                     | Description                    | Auth Required |
| ------ | ---------------------------- | ------------------------------ | ------------- |
| POST   | `/api/taxonomies/sync`       | Sync all taxonomies from ATLAS | Yes           |
| POST   | `/api/taxonomies/sync/:type` | Sync specific taxonomy type    | Yes           |
| GET    | `/api/taxonomies/:type`      | Get taxonomies by type         | Yes           |
| GET    | `/api/taxonomies/id/:id`     | Get taxonomy by ID             | Yes           |
| GET    | `/api/taxonomies/search`     | Search taxonomies              | Yes           |

### Entities (Clusters)

| Method | Endpoint                     | Description                | Auth Required |
| ------ | ---------------------------- | -------------------------- | ------------- |
| GET    | `/api/entities`              | List all entities          | Yes           |
| GET    | `/api/entities/:id`          | Get entity by ID           | Yes           |
| POST   | `/api/entities`              | Create new entity          | Yes           |
| PATCH  | `/api/entities/:id`          | Update entity              | Yes           |
| DELETE | `/api/entities/:id`          | Delete entity              | Yes           |
| POST   | `/api/entities/:id/sync`     | Sync entity to ATLAS       | Yes           |
| GET    | `/api/entities/:id/versions` | Get entity version history | Yes           |

### Health

| Method | Endpoint        | Description     |
| ------ | --------------- | --------------- |
| GET    | `/health`       | Health check    |
| GET    | `/health/live`  | Liveness probe  |
| GET    | `/health/ready` | Readiness probe |

## Features

### Phase 1: Foundation ✅

- Monorepo with pnpm workspaces
- Docker development environment (PostgreSQL 17, Redis 7)
- Backend: Fastify 5.7 with TypeScript
- Frontend: Next.js 16.1 with React 19
- Database: Drizzle ORM with PostgreSQL
- Code quality: ESLint, Prettier, TypeScript strict mode

### Phase 2: Authentication ✅

- JWT-based authentication with refresh tokens
- Argon2 password hashing
- Protected routes and middleware
- Login page with form validation
- Auth context and hooks
- Auto token refresh

### Phase 3: ATLAS Integration ✅

- JSON:API client for ATLAS API
- Taxonomy sync service (22 taxonomy types)
- Entity CRUD operations
- JSON:API transformer for data conversion
- Entity versioning system
- Sync status tracking
- Database indexes for performance

### Phase 4: Taxonomy Management ✅

- Taxonomy list page with statistics
- Individual taxonomy type detail pages
- Search functionality across taxonomy terms
- Tree view for hierarchical taxonomies
- Sync triggers from UI with loading states
- Real-time term counts per type
- List and tree view modes

### Phase 5: Entity Management ✅

- Entity list page with data table (TanStack Table)
- Column sorting and search functionality
- Status and sync status badges with color coding
- Multi-step form wizard for entity creation
- Entity edit page with pre-filled data
- Entity detail page with tabbed interface
- Version history timeline
- Taxonomy relationship display
- Sync to ATLAS functionality from UI
- CRUD operations with proper validation
- Row actions (view, edit, delete) with dropdown menu

### Phase 6: ATLAS Sync ✅

- Entity sync service with push/pull operations
- Conflict detection and resolution logic
- Diff comparison between local and ATLAS entities
- Batch sync operations for multiple entities
- Sync API endpoints (push, pull, diff, resolve, logs, status)
- Sync status dashboard with real-time statistics
- Sync history page with filterable logs
- Conflict resolution UI with visual indicators
- Sync status widget showing pending/conflict/failed entities
- Comprehensive sync logging for audit trail
- Sync status flow management (local → pending_push → synced/conflict/failed)

### Phase 7: ATLAS-Compliant Registration ✅

- Complete ECCC membership registration form field support
- Structured address fields (country_code, city, street_address, postal_code)
- Contact person/representative fields (first_name, last_name, email, position, phone)
- Compliance fields (article_136_compliance, data_sharing_consent)
- Headquarters and subsidiaries information fields
- Expertise description with 800 character limit
- JRC Cybersecurity Taxonomy relationships:
  - Knowledge domains (thematic areas)
  - Sectors
  - Technologies
  - Use cases
  - Fields of activity (Article 8(3) expertise)
- Conditional validation (headquarters, subsidiaries, majority shares)
- Editorial workflow support (draft, ready_for_publication, to_be_rejected)
- Complete field mapping to ATLAS JSON:API specification
- Database migration for all new fields
- Comprehensive validation with detailed error messages

## ATLAS-Compliant Entity Registration

The connector now fully implements the European Cybersecurity Competence Community (ECCC) membership registration requirements.

### Mandatory Fields

**Basic Information:**

- Organization name (English) - `name`
- Organization name (national language) - `nameNational`

**Address (Structured):**

- Country code (ISO 3166-1 alpha-2) - `countryCode`
- City - `city`
- Street address - `streetAddress`

**Organization Details:**

- General contact email - `email`
- Website URL - `website`

**Compliance:**

- Article 138 compliance - `article138Compliance`
- Data sharing consent - `dataShareConsent`

**Contact Person:**

- First name - `contactFirstName`
- Last name - `contactLastName`
- Email - `contactEmail`

**Expertise:**

- Expertise description (max 800 chars) - `expertiseDescription`

**Taxonomy:**

- Organization type - `clusterTypeId`
- Fields of activity (Article 8(3)) - `fieldsOfActivityIds`

### Example API Request

```json
{
  "name": "Example Cybersecurity Org",
  "nameNational": "Organisation Exemple",
  "countryCode": "BE",
  "city": "Brussels",
  "streetAddress": "Rue de la Loi 123",
  "email": "contact@example.org",
  "website": "https://example.org",
  "article138Compliance": true,
  "dataShareConsent": true,
  "contactFirstName": "John",
  "contactLastName": "Doe",
  "contactEmail": "john.doe@example.org",
  "expertiseDescription": "Specialized in threat intelligence",
  "clusterTypeId": "uuid-of-cluster-type",
  "fieldsOfActivityIds": ["uuid-1", "uuid-2"]
}
```

### Validation Rules

- **Conditional validation**: If `isHeadquarter` is false, `headquarterInfo` is required
- **Field length limits**: Short text (400 chars), Long text (800 chars)
- **JRC Taxonomy**: At least one dimension required
- **Email format**: Valid email addresses only
- **URL format**: Valid URLs with scheme

### Sync to ATLAS

```bash
POST /api/sync/entities/:id/push
```

This validates all mandatory fields, transforms to ATLAS JSON:API format, and creates/updates the cluster in ATLAS.

## License

BSD-2-Clause license

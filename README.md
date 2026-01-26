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

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |

### Backend Commands

| Command | Description |
|---------|-------------|
| `pnpm --filter @atlas-connector/backend dev` | Start backend dev server |
| `pnpm --filter @atlas-connector/backend build` | Build backend for production |
| `pnpm --filter @atlas-connector/backend db:push` | Push database schema |
| `pnpm --filter @atlas-connector/backend db:generate` | Generate migrations |
| `pnpm --filter @atlas-connector/backend db:studio` | Open Drizzle Studio |
| `pnpm --filter @atlas-connector/backend seed:admin` | Create admin user |

### Frontend Commands

| Command | Description |
|---------|-------------|
| `pnpm --filter @atlas-connector/frontend dev` | Start frontend dev server |
| `pnpm --filter @atlas-connector/frontend build` | Build frontend for production |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Taxonomies

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/taxonomies/sync` | Sync all taxonomies from ATLAS | Yes |
| POST | `/api/taxonomies/sync/:type` | Sync specific taxonomy type | Yes |
| GET | `/api/taxonomies/:type` | Get taxonomies by type | Yes |
| GET | `/api/taxonomies/id/:id` | Get taxonomy by ID | Yes |
| GET | `/api/taxonomies/search` | Search taxonomies | Yes |

### Entities (Clusters)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/entities` | List all entities | Yes |
| GET | `/api/entities/:id` | Get entity by ID | Yes |
| POST | `/api/entities` | Create new entity | Yes |
| PATCH | `/api/entities/:id` | Update entity | Yes |
| DELETE | `/api/entities/:id` | Delete entity | Yes |
| POST | `/api/entities/:id/sync` | Sync entity to ATLAS | Yes |
| GET | `/api/entities/:id/versions` | Get entity version history | Yes |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

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

## License

BSD-2-Clause license 

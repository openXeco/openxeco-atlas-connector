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
docker-compose up -d postgres redis
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

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

## License

BSD-2-Clause license 

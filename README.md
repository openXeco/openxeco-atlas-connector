# OpenXeco ATLAS Connector

A connector application for managing clusters with the European Cybersecurity ATLAS API.

## Tech Stack

- **Frontend**: Next.js 16+ (App Router), TailwindCSS, shadcn/ui
- **Backend**: Node.js + Fastify 5, TypeScript
- **Database**: PostgreSQL 15+, Drizzle ORM
- **Cache**: Redis/Valkey (optional)
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
```

### 3. Start Development Services

```bash
docker-compose up -d
```

### 4. Run Development Servers

```bash
pnpm dev
```

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

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run all tests |

## License

MIT

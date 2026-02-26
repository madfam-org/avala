# AVALA Setup Guide

> **Status:** Pre-Alpha (Foundation Phase)
> **Last Updated:** November 2024

## 🎯 What's Implemented

✅ **Monorepo Structure** (Turborepo + pnpm)
- `apps/api` - NestJS backend with tenant isolation
- `apps/web` - Next.js 15 frontend with React 19
- `packages/db` - Prisma schema & client
- `packages/client` - TypeScript API client
- `packages/renec-client` - RENEC integration
- `packages/assessment-engine` - Quiz & evaluation logic
- `packages/document-engine` - PDF generation

✅ **Database Schema** (Prisma + PostgreSQL)
- Multi-tenant with Row-Level Security (RLS)
- RBAC (7 roles: ADMIN, INSTRUCTOR, ASSESSOR, etc.)
- Competency Standards (EC) structure: Standard → Element → Criterion
- Evidence Portfolios with hash-based integrity

✅ **Backend Architecture** (NestJS 10)
- Repository Pattern with automatic tenant scoping
- Tenant decorator & interceptor
- Authentication (JWT, Local, Janua SSO)
- Swagger documentation at `/api`
- Comprehensive test coverage (80 suites, 1,087 tests)

✅ **Frontend Architecture** (Next.js 15)
- App Router with React 19
- shadcn/ui components
- Tailwind CSS styling
- Component tests (8 suites, 96 tests)

✅ **Infrastructure**
- Docker Compose with PostgreSQL, Redis, MinIO, Mailhog
- Environment configuration (.env.example)
- Seed scripts with sample data

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### NPM Registry Configuration

AVALA uses MADFAM's private npm registry for internal packages. Configure your `.npmrc`:

```bash
# Add to ~/.npmrc
@madfam:registry=https://npm.madfam.io
@avala:registry=https://npm.madfam.io
@janua:registry=https://npm.madfam.io
//npm.madfam.io/:_authToken=${NPM_MADFAM_TOKEN}
```

Set the `NPM_MADFAM_TOKEN` environment variable with your registry token.

### 1. Clone & Install

```bash
cd avala

# Install dependencies
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, MinIO, Mailhog
docker compose up -d

# Verify services are running
docker compose ps
```

**Services:**
| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Sessions |
| MinIO | 9000 | Object storage |
| MinIO Console | 9001 | MinIO admin UI |
| Mailhog | 8025 | Email testing UI |

### 3. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# The default values work for local development
# Update if needed (JWT secrets, etc.)
```

### 4. Database Setup

```bash
# Build packages first
pnpm build

# Run migrations
pnpm db:migrate

# Seed the database
pnpm db:seed

# (Optional) Seed RENEC production data — 1,477 EC standards,
# 482 certifiers, 340 centers, and all accreditation relationships
pnpm --filter @avala/db db:seed:renec

# (Optional) Validate RENEC data coverage
pnpm --filter @avala/db db:seed:validate
```

**Seeded Data (`db:seed`):**
- Tenant: `madfam` (Innovaciones MADFAM)
- Users:
  - `admin@avala.local` / `changeme` (ADMIN)
  - `instructor@avala.local` (INSTRUCTOR)
  - `assessor@avala.local` (ASSESSOR)
  - `trainee@avala.local` (TRAINEE)
- Sample EC Standards and Courses

**RENEC Data (`db:seed:renec`):**
- 1,477 EC competency standards from CONOCER/RENEC API
- 482 certifying entities (ECE/OC) from RENEC web scraping
- 340 evaluation centers (CCAP) from RENEC web scraping
- ~7,573 EC→Certifier accreditation relationships
- ~680 Center→EC offering relationships
- Committee enrichment (581 committees with contacts)

### 5. Run Development Server

```bash
# From project root - runs all apps
pnpm dev

# Or run individually
pnpm --filter api dev   # API only
pnpm --filter web dev   # Web only
```

**Access URLs:**
| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/api |
| Mailhog | http://localhost:8025 |

---

## 🧪 Testing

### Run All Tests

```bash
# All tests
pnpm test

# API tests (80 suites, 1,087 tests)
pnpm --filter api test

# Web tests (8 suites, 96 tests)
pnpm --filter web test
```

### Test Coverage

```bash
# API coverage report
pnpm --filter api test:cov

# Web with UI
pnpm --filter web test:ui
```

### Testing the API

```bash
# Get tenant by slug
curl http://localhost:4000/tenants/slug/madfam

# List users (with Tenant Header)
export TENANT_ID="<tenant-id-from-above>"
curl http://localhost:4000/users \
  -H "X-Tenant-Id: $TENANT_ID"

# Search EC Standards
curl "http://localhost:4000/ec-standards?q=EC0217" \
  -H "X-Tenant-Id: $TENANT_ID"
```

---

## 📊 Database Management

### Prisma Studio

```bash
# Visual database browser
pnpm db:studio

# Opens at http://localhost:5555
```

### Create New Migration

```bash
# After schema changes in packages/db/prisma/schema.prisma
pnpm db:migrate
```

### Reset Database

```bash
# WARNING: Deletes all data!
pnpm db:push --force-reset
pnpm db:seed
```

---

## 🏗️ Architecture Details

### Tenant Isolation Pattern

All API endpoints automatically scope queries to the tenant specified in the `X-Tenant-Id` header.

**Implementation:**
1. `@TenantId()` decorator extracts tenant from request
2. `TenantGuard` validates tenant header
3. All queries automatically filter by `tenantId`

### Module Structure

```
apps/api/src/modules/
├── auth/           # Authentication (JWT, Local, Janua)
├── tenant/         # Tenant management
├── user/           # User management
├── competency/     # EC Standards
├── training/       # Enrollments & progress
├── portfolio/      # Evidence management
├── assessment/     # Quizzes & evaluations
├── billing/        # Plans & features
└── search/         # Global search
```

### Database Schema

**Multi-Tenancy:**
- Every tenant-scoped table has `tenantId` field
- Foreign keys with cascade deletes
- Indices on `[tenantId, ...]` for performance

**EC Structure:**
```
CompetencyStandard (EC)
  ↓ 1:N
Element
  ↓ 1:N
Criterion (Performance, Knowledge, Product, Attitude)
  ↓ M:N
Lesson (via LessonCriterion join table)
```

---

## 📋 Available Scripts

```bash
# Development
pnpm dev                    # Run all apps
pnpm --filter api dev       # Run API only
pnpm --filter web dev       # Run Web only

# Build
pnpm build                  # Build all packages
pnpm --filter api build     # Build API
pnpm --filter web build     # Build Web

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed database
pnpm db:studio              # Open Prisma Studio
pnpm db:push                # Push schema changes

# Testing
pnpm test                   # Run all tests
pnpm --filter api test      # API tests
pnpm --filter web test      # Web tests
pnpm --filter api test:cov  # API coverage

# Code Quality
pnpm lint                   # Lint all packages
pnpm typecheck              # Type check all

# Clean
pnpm clean                  # Remove build artifacts
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :4000  # or :3000

# Kill it
kill -9 <PID>
```

### Database Connection Error

```bash
# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker compose logs -f postgres
```

### Prisma Client Not Found

```bash
# Regenerate Prisma client
pnpm db:generate
```

### Build Errors

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

---

## 📖 Documentation

- **API Docs (Swagger)**: http://localhost:4000/docs
- **Documentation Hub**: [docs/INDEX.md](../INDEX.md)
- **Architecture Overview**: [docs/architecture/OVERVIEW.md](../architecture/OVERVIEW.md)
- **Software Spec**: [docs/architecture/SOFTWARE_SPEC.md](../architecture/SOFTWARE_SPEC.md)
- **Interactive Demo**: [docs/DEMO.md](../DEMO.md)
- **Contributing**: [CONTRIBUTING.md](../../CONTRIBUTING.md)
- **Quick Reference**: [CLAUDE.md](../../CLAUDE.md)

---

## 🆘 Support

For issues or questions:
1. Check documentation in `docs/`
2. Review API docs at `/api`
3. Inspect database with Prisma Studio
4. Check Docker logs: `docker compose logs -f`

---

**Team:** Innovaciones MADFAM S.A.S. de C.V.

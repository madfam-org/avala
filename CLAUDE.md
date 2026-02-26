# AVALA - Claude Quick Reference

> **Alineamiento y Verificación de Aprendizajes y Logros Acreditables**
>
> AI assistant quick reference for development tasks.

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Status** | Alpha |
| **Type** | Multi-tenant Learning & Competency Cloud |
| **Purpose** | EC/CONOCER training with DC-3/SIRCE compliance |
| **License** | © Innovaciones MADFAM S.A.S. de C.V. |

### Core Modules
- **Avala Learn** - Learning paths, lessons, xAPI tracking
- **Avala Assess** - Evaluations, portfolio evidence, rubrics
- **Avala Comply** - DC-3, SIRCE, LFT compliance
- **Avala Badges** - Open Badges 3.0 / Verifiable Credentials
- **Avala Connect** - SSO, HRIS, webhooks

---

## Quick Commands

### Development
```bash
pnpm dev                      # All apps (web + api)
pnpm dev --filter @avala/api  # API only (port 4000)
pnpm dev --filter @avala/web  # Web only (port 3000)
```

### Build & Test
```bash
pnpm build                    # Build all
pnpm test                     # Run all tests
pnpm lint                     # Lint all
pnpm typecheck                # Type check all
```

### Database
```bash
pnpm db:generate              # Generate Prisma client
pnpm db:migrate               # Apply migrations
pnpm db:seed                  # Seed data
pnpm db:seed:renec            # Seed RENEC data (1,477 ECs + certifiers + centers)
pnpm db:seed:validate         # Validate RENEC data coverage
pnpm db:studio                # Prisma Studio GUI
pnpm db:push                  # Push schema (dev only)
```

### Testing (API)
```bash
pnpm --filter @avala/api test           # All tests
pnpm --filter @avala/api test:cov       # With coverage
pnpm --filter @avala/api test:e2e       # E2E tests
pnpm --filter @avala/api test:watch     # Watch mode
```

### Testing (Web)
```bash
pnpm --filter @avala/web test           # All tests
pnpm --filter @avala/web test:coverage  # With coverage
pnpm --filter @avala/web test:ui        # Vitest UI
```

---

## Port Allocation

| Service | Port | URL |
|---------|------|-----|
| Web (Next.js) | 3000 | http://localhost:3000 |
| API (NestJS) | 4000 | http://localhost:4000 |
| API Docs | 4000 | http://localhost:4000/docs |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| MinIO | 9000/9001 | http://localhost:9001 (console) |
| Mailhog | 8025 | http://localhost:8025 |

**Default Login:** Via Janua SSO (navigate to `/api/v1/auth/sso/login`)

---

## Project Structure

```
avala/
├── apps/
│   ├── api/                    # NestJS REST API
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── courses/    # Course management
│   │   │   │   ├── ec-standards/    # Competency standards
│   │   │   │   ├── ec-training/     # Training enrollments
│   │   │   │   ├── ec-portfolio/    # Evidence portfolio
│   │   │   │   ├── ec-assessment/   # Assessments
│   │   │   │   ├── compliance/      # DC-3, SIRCE, LFT
│   │   │   │   ├── badges/          # Open Badges 3.0
│   │   │   │   └── ...
│   │   │   ├── common/         # Guards, decorators, interceptors
│   │   │   └── config/         # Configuration modules
│   │   └── test/               # Test utilities
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── (dashboard)/    # Auth-required routes
│       │   │   ├── dashboard/  # Main dashboard
│       │   │   ├── courses/    # Course management
│       │   │   ├── training/   # EC training
│       │   │   ├── compliance/ # DC-3, SIRCE
│       │   │   └── settings/   # User settings
│       │   ├── (marketing)/    # Public marketing
│       │   ├── (public)/       # Public pages (verify)
│       │   ├── (auth)/         # Login, register
│       │   └── demo/           # Interactive demo
│       │       ├── [role]/     # Role-specific views
│       │       │   └── _dashboards/  # HR, Instructor, Trainee, Executive
│       │       └── _components/      # Demo UI components
│       ├── components/         # Shared components
│       │   ├── ui/             # shadcn/ui primitives
│       │   ├── courses/        # Course components
│       │   ├── ec-*/           # EC feature components
│       │   └── marketing/      # Marketing components
│       └── lib/                # Utilities
├── packages/
│   ├── db/                     # Prisma schema & migrations
│   ├── client/                 # TypeScript API client
│   ├── renec-client/           # RENEC integration
│   ├── assessment-engine/      # Quiz logic
│   └── document-engine/        # PDF generation
├── docs/                       # Documentation
│   ├── INDEX.md                # Doc hub
│   ├── architecture/           # Specs & alignment
│   ├── setup/                  # Setup & deploy
│   ├── design/                 # UI/UX docs
│   └── standards/              # EC documentation
└── keys/                       # Ed25519 keys (gitignored)
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 15.1.6 |
| React | React | 18.3.1 |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | shadcn/ui | latest |
| API | NestJS | 10.4.15 |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 16+ |
| Cache | Redis | 7+ |
| TypeScript | TypeScript | 5.7.2 |
| Testing (API) | Jest | 29.x |
| Testing (Web) | Vitest | 2.x |

---

## Key Concepts

| Term | Description |
|------|-------------|
| **EC** | Estándar de Competencia - Mexican competency standard |
| **CONOCER** | National council for competency standardization |
| **DC-3** | Training completion certificate (STPS requirement) |
| **SIRCE** | Government registry for training records |
| **LFT** | Ley Federal del Trabajo - Federal Labor Law |
| **Trainee** | Person receiving training/certification |
| **Assessor** | Certified evaluator |
| **Evidence** | Documentation proving competency |
| **Badge** | Verifiable credential (Open Badges 3.0) |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://avala:avala@localhost:5432/avala

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# Open Badges
BADGE_ISSUER_KEY_PATH=./keys/issuer.key
BADGE_ISSUER_PUBLIC_KEY_PATH=./keys/issuer.pub
BADGE_ISSUER_ID=https://avala.example.com

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=avala

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
```

---

## Test Coverage

### API (91 suites, 1,462 tests)
- Statements: ~75%
- Branches: ~60%
- Functions: ~75%
- Lines: ~75%

### Web (30 suites, 231 tests)
- Component tests with Vitest
- React Testing Library

---

## Common Tasks

### Add a new API module
```bash
cd apps/api
nest g module modules/my-feature
nest g controller modules/my-feature
nest g service modules/my-feature
```

### Add a new page (Web)
```bash
# Create in apps/web/app/(dashboard)/my-page/page.tsx
```

### Run database migration
```bash
pnpm db:migrate
# Or for dev iteration:
pnpm db:push
```

### Generate API client
```bash
pnpm --filter @avala/client generate
```

---

## NPM Registry

```bash
# ~/.npmrc
@madfam:registry=https://npm.madfam.io
@avala:registry=https://npm.madfam.io
@janua:registry=https://npm.madfam.io
//npm.madfam.io/:_authToken=${NPM_MADFAM_TOKEN}
```

---

## Documentation Links

| Document | Path | Description |
|----------|------|-------------|
| Doc Hub | [docs/INDEX.md](./docs/INDEX.md) | Central navigation |
| Product Spec | [docs/architecture/SOFTWARE_SPEC.md](./docs/architecture/SOFTWARE_SPEC.md) | Full specification |
| Alignment | [docs/architecture/ALIGNMENT.md](./docs/architecture/ALIGNMENT.md) | Standards mapping |
| Setup | [docs/setup/SETUP.md](./docs/setup/SETUP.md) | Installation guide |
| Deploy | [docs/setup/DEPLOY.md](./docs/setup/DEPLOY.md) | Production deployment |
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) | Dev guidelines |
| Security | [SECURITY.md](./SECURITY.md) | Security policies |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) | Version history |

---

*AVALA - The Human Standard | Last updated: November 2024*

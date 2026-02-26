# AVALA Documentation Hub

> *Alineamiento y Verificación de Aprendizajes y Logros Acreditables*
>
> Multi-tenant Learning & Competency Cloud aligned to EC/CONOCER, DC-3/SIRCE (MX), and verifiable credentials.

---

## 📚 Quick Navigation

### Getting Started
| Document | Description |
|----------|-------------|
| [README](../README.md) | Project overview and quickstart |
| [CLAUDE.md](../CLAUDE.md) | AI assistant quick reference |
| [Setup Guide](./setup/SETUP.md) | Detailed installation guide |

### Development
| Document | Description |
|----------|-------------|
| [CONTRIBUTING](../CONTRIBUTING.md) | Development guidelines and standards |
| [CHANGELOG](../CHANGELOG.md) | Version history and changes |
| [SECURITY](../SECURITY.md) | Security policies and reporting |

---

## 🏗️ Architecture

| Document | Description |
|----------|-------------|
| [OVERVIEW](./architecture/OVERVIEW.md) | **High-level system architecture** |
| [SOFTWARE_SPEC](./architecture/SOFTWARE_SPEC.md) | Complete product specification (80+ pages) |
| [ALIGNMENT](./architecture/ALIGNMENT.md) | Standards & HR alignment brief |
| [MULTI_EC_ARCHITECTURE](./MULTI_EC_ARCHITECTURE.md) | Multi-EC training system design |
| [FEATURE_PARITY](./FEATURE_PARITY_VALIDATION.md) | Migration validation matrix |

---

## ⚙️ Setup & Deployment

| Document | Description |
|----------|-------------|
| [SETUP.md](./setup/SETUP.md) | Local development setup |
| [DEPLOY.md](./setup/DEPLOY.md) | Production deployment guide |

---

## 🎨 Design

| Document | Description |
|----------|-------------|
| [DEMO](./DEMO.md) | **Interactive demo system documentation** |
| [LANDING_PAGE_DESIGN](./design/LANDING_PAGE_DESIGN.md) | Landing page specifications |
| [PRICING_AND_CONVERSION](./design/PRICING_AND_CONVERSION.md) | Pricing model and conversion strategy |

---

## 📋 Standards & Compliance

| Document | Description |
|----------|-------------|
| [EC0249 README](./standards/ec0249/README.md) | EC0249 competency standard |
| [Competency Mapping](./standards/ec0249/competency_mapping.md) | Course-to-competency alignment |
| [Content Analysis](./standards/ec0249/content_analysis_report.md) | EC0249 requirements analysis |

---

## 🔗 Integration

| Document | Description |
|----------|-------------|
| [RENEC Integration](./INTEGRATION_PLAN_RENEC_EC0249.md) | RENEC/EC0249 integration plan |
| [PSWGlobal Migration](./REPLACE_PSWGLOBAL.md) | Legacy system migration |

---

## 📦 Core Modules

### Avala Learn
Learning management with EC alignment and progress tracking.

- **Learning Paths** - EC-aligned curriculum with criterion coverage mapping
- **Lessons** - Video, text, and interactive content delivery
- **Progress Tracking** - xAPI/cmi5 compliant learning records
- **Offline Support** - PWA with background sync capabilities
- **Gamification** - XP, levels, achievements, and leaderboards

### Avala Assess
Multi-method competency evaluation system.

- **Assessment Types** - Quiz, observation, interview, task check-off
- **Portfolio of Evidence** - Hash-verified artifacts with digital signatures
- **Rubrics** - Criterion-level scoring with inter-rater reliability metrics
- **Automatic Scoring** - AI-assisted evaluation for objective assessments

### Avala Comply
Mexican labor law compliance automation.

- **DC-3 Generation** - Official constancias with serial/folio numbers
- **SIRCE Export** - STPS-ready reports in required formats
- **LFT Plans** - Immutable training plan snapshots for audits
- **Compliance Dashboard** - Real-time compliance rate tracking

### Avala Badges
Verifiable credentials and digital badges.

- **Open Badges 3.0** - W3C-compliant verifiable credentials
- **EC Alignment** - Credentials linked to competency evidence
- **Verification** - QR code and API verification endpoints
- **Portability** - LinkedIn, wallet, and CV integration

### Avala Connect
Enterprise integration and connectivity.

- **SSO/SCIM** - Enterprise identity integration (via Janua)
- **HRIS Sync** - Employee data synchronization
- **Webhooks** - Event-driven integrations
- **Notifications** - Email and SMS delivery

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15.1, React 18.3, TypeScript 5.7 |
| **Styling** | Tailwind CSS 3.4, shadcn/ui |
| **API** | NestJS 10.4, Prisma 6.x |
| **Database** | PostgreSQL 16+ with Row-Level Security |
| **Cache/Queue** | Redis 7+ |
| **Storage** | S3-compatible (MinIO/AWS) |
| **LRS** | Built-in xAPI/cmi5 endpoints |
| **Monorepo** | Turborepo with pnpm workspaces |
| **Testing** | Jest (API), Vitest (Web) |

---

## 📁 Repository Structure

```
avala/
├── apps/
│   ├── api/           # NestJS REST API (port 4000)
│   │   ├── src/modules/      # Feature modules
│   │   ├── src/common/       # Shared utilities
│   │   └── test/             # Test utilities
│   └── web/           # Next.js PWA (port 3000)
│       ├── app/              # App Router pages
│       │   ├── (dashboard)/  # Authenticated routes
│       │   ├── (marketing)/  # Public marketing
│       │   ├── (public)/     # Public verification
│       │   └── demo/         # Interactive demo
│       ├── components/       # React components
│       └── lib/              # Utilities
├── packages/
│   ├── db/            # Prisma schema & migrations
│   ├── client/        # TypeScript API client
│   ├── renec-client/  # RENEC integration client
│   ├── assessment-engine/  # Quiz & evaluation logic
│   └── document-engine/    # PDF generation
├── docs/              # Documentation (you are here)
│   ├── architecture/  # Specs and alignment
│   ├── setup/         # Setup and deployment
│   ├── design/        # UI/UX documentation
│   └── standards/     # EC documentation
└── infra/             # Docker, Terraform, K8s
```

---

## 🔌 API Overview

### Authentication
```
POST /auth/login              # Email/password login
POST /auth/register           # User registration
GET  /auth/me                 # Current user profile
POST /auth/refresh            # Refresh JWT token
```

### EC Standards & Training
```
GET  /ec-standards              # List available standards
GET  /ec-standards/:id          # Get standard with modules
POST /ec-standards/:id/clone    # Clone standard configuration
POST /training/enroll           # Enroll in EC standard
GET  /training/enrollments      # List user enrollments
PUT  /training/progress/:id     # Update lesson progress
```

### Portfolio & Documents
```
GET  /portfolio/templates       # Get document templates
POST /portfolio/documents       # Create portfolio document
PUT  /portfolio/documents/:id   # Update document
POST /portfolio/documents/:id/submit  # Submit for review
```

### Assessments
```
GET  /assessments/:standardId   # List assessments for standard
POST /assessments/:id/attempt   # Start assessment attempt
POST /assessments/:id/submit    # Submit answers
```

### Compliance
```
POST /compliance/dc3            # Generate DC-3 certificate
GET  /compliance/dc3/:id        # Get DC-3 details
POST /compliance/sirce          # Export SIRCE data
GET  /compliance/lft-plan       # Get LFT training plan
```

### Badges
```
POST /badges/issue              # Issue new badge
GET  /badges/:id                # Get badge details
GET  /badges/:id/verify         # Verify badge authenticity
```

---

## 🎯 Interactive Demo

AVALA includes a comprehensive interactive demo showcasing the platform from multiple perspectives:

| Role | URL | Description |
|------|-----|-------------|
| **Role Selector** | `/demo` | Choose your persona |
| **HR Manager** | `/demo/hr` | Compliance, DC-3, team management |
| **Instructor** | `/demo/instructor` | Courses, assessments, students |
| **Trainee** | `/demo/trainee` | Learning, credentials, gamification |
| **Executive** | `/demo/executive` | ROI, analytics, strategic reports |

Each role includes a guided tour and contextual CTAs demonstrating key features.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- pnpm 9+
- Docker & Docker Compose

### Commands
```bash
# Clone and setup
git clone <repo> && cd avala
cp .env.example .env

# Start infrastructure
docker compose up -d

# Install and build
pnpm install
pnpm build

# Run migrations and seed
pnpm db:migrate
pnpm db:seed

# Start development
pnpm dev
```

### Default URLs

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:4000 |
| API Docs | http://localhost:4000/docs |
| Mailhog | http://localhost:8025 |
| MinIO Console | http://localhost:9001 |

**Default Login:** `admin@avala.local` / `changeme`

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# API tests (80 suites, 1,087 tests)
pnpm --filter @avala/api test
pnpm --filter @avala/api test:cov

# Web tests (8 suites, 96 tests)
pnpm --filter @avala/web test
pnpm --filter @avala/web test:coverage
```

---

## 🇲🇽 Mexican Compliance

| Standard | Description |
|----------|-------------|
| **EC/CONOCER** | National competency standards alignment |
| **DC-3** | Training completion certificates (STPS) |
| **SIRCE** | Government registry integration |
| **LFT** | Federal Labor Law compliance |
| **NOM-035** | Psychosocial risk factors |

---

## 📄 Package Documentation

| Package | Description |
|---------|-------------|
| [db/prisma/data](../packages/db/prisma/data/README.md) | Competency standards data |
| [renec-client](../packages/renec-client/data/extracted/EXTRACTION_SUMMARY.md) | RENEC data extraction |

---

## 🔐 Security

- Row-Level Security (RLS) for multi-tenancy
- SHA-256 content-addressed evidence storage
- Comprehensive audit logging
- PII protection with consent management

Report vulnerabilities to **security@madfam.io** — see [SECURITY.md](../SECURITY.md)

---

*Last updated: November 2024*

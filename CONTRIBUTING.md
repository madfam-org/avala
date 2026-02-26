# Contributing to AVALA

Thank you for your interest in contributing to AVALA! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- PostgreSQL 15+ (via Docker or local)

### Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd avala

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development services
docker compose up -d

# Build packages
pnpm build

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Start development server
pnpm dev
```

### Default Development URLs

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:4000 |
| API Docs | http://localhost:4000/api |
| Mailhog | http://localhost:8025 |

## Branch Strategy

We use a trunk-based development model:

- `main` - Production-ready code
- `feat/` - New features (e.g., `feat/open-badges-3`)
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes:** `web`, `api`, `db`, `badges`, `dc3`, `sirce`, `ec`, `renec`

**Examples:**
```
feat(api): add EC standard cloning endpoint
fix(web): resolve leaderboard sorting issue
test(api): add auth controller tests
docs: update setup instructions
```

## Pull Request Process

1. Create a branch from `main`
2. Make changes with clear commits
3. Write/update tests
4. Update documentation if needed
5. Open a PR with clear description
6. Request review and address feedback

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Standards compliance maintained
- [ ] CHANGELOG.md updated for significant changes

## Code Standards

### TypeScript

- Strict mode enabled
- Explicit return types for public APIs
- Use Zod for runtime validation
- Bilingual string handling (ES/EN)

### API (NestJS)

- Follow module-based architecture
- Use decorators consistently
- Document endpoints with Swagger decorators
- Write unit tests for controllers and services

### Web (Next.js)

- Use App Router patterns
- Server Components by default
- Client Components only when necessary
- Use shadcn/ui for UI components

### Database

- Prisma for ORM operations
- Implement Row-Level Security (RLS) where needed
- Document all data models
- Write migrations for schema changes

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# API tests only
pnpm --filter api test

# Web tests only
pnpm --filter web test

# With coverage
pnpm --filter api test:cov

# Watch mode
pnpm --filter api test:watch
```

### Test Standards

- Write unit tests for new features
- Maintain test coverage above 70%
- Use descriptive test names
- Mock external dependencies

## Standards Compliance

AVALA integrates with Mexican education standards. When making changes:

### EC (Estándares de Competencia)

- Maintain CONOCER alignment
- Document competency mappings
- Version EC content properly

### DC-3

- Follow DC-3 format requirements
- Validate serial number generation
- Test SIRCE export compatibility

### Open Badges 3.0

- Comply with Open Badges specification
- Use proper JSON-LD contexts
- Implement verification endpoints

### xAPI/cmi5

- Follow xAPI statement structure
- Validate actor/verb/object
- Store in compliant LRS

## Evidence Handling

When working with learner evidence:

1. **Integrity** - Use SHA-256 for content addressing
2. **Chain of custody** - Log all evidence operations
3. **Privacy** - Follow consent requirements
4. **Retention** - Respect data retention policies

## Localization

AVALA is Spanish-first with English support:

- Primary language: Spanish (es-MX)
- Secondary: English (en-US)
- All user-facing strings must be translatable
- Use i18n library consistently

## Security Guidelines

Education data requires careful handling:

- Follow PII protection guidelines
- Implement proper access controls
- Encrypt sensitive data
- Log audit events
- Report vulnerabilities to security@madfam.io

## Project Structure

```
avala/
├── apps/
│   ├── api/           # NestJS REST API
│   └── web/           # Next.js frontend
├── packages/
│   ├── db/            # Prisma schema & migrations
│   ├── client/        # TypeScript API client
│   └── ...            # Other shared packages
└── docs/              # Documentation
```

## Getting Help

- **Documentation Hub**: [docs/INDEX.md](docs/INDEX.md)
- **Architecture Overview**: [docs/architecture/OVERVIEW.md](docs/architecture/OVERVIEW.md)
- **Quick Reference**: [CLAUDE.md](CLAUDE.md)
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions

## License

AVALA is proprietary software. © Innovaciones MADFAM S.A.S. de C.V. — All rights reserved.

By contributing, you agree that your contributions will be owned by Innovaciones MADFAM S.A.S. de C.V.

# NOTES

## Tradeoffs

- **In-memory storage**: All data resets on server restart (Vercel cold starts wipe user-added leads, only seed data persists). Production fix: Neon PostgreSQL free tier (0.5GB) + SQLAlchemy async sessions.
- **No authentication**: Open API — anyone with URL can read/add leads. Production fix: Auth0/Clerk JWT + FastAPI `Depends()` middleware.
- **Synchronous enrichment**: Blocks web request (0ms for mock, 500ms-2s for real APIs). Production fix: Celery task queue with `202 Accepted` + frontend polling.
- **Local React state only**: No caching, optimistic updates, or background refetch. Production fix: TanStack Query for server state management.
- **No rate limiting**: API accepts any input length, no DoS protection. Production fix: Pydantic `constr(max_length=20)` + `slowapi` (5 req/s per IP).
- **No persistent sessions**: Filter state lost on refresh. Production fix: URL query params + localStorage for UI preferences.
- **Exact headcount match (legacy)**: Replaced with range filters (1–50, 51–200, 201–1000, 1000+ dropdown). Original exact match was wrong UX for B2B prospecting.
- **Vercel serverless cold starts**: In-memory state wiped after ~minutes of inactivity on free tier. For live demo, keep tab active or use paid tier.
- **Bulk enrich best-effort**: Partial success accepted (enriches found IDs, reports not_found). Design decision: don't fail entire batch for one bad ID.
- **No phone validation**: Accepts any string. Production fix: E.164 format validation via `phonenumbers` library.
- **No duplicate detection**: Can create multiple leads with same email. Production fix: Unique constraint on email column.

## What I'd do next

1. **Persistent database** — Neon PostgreSQL + Prisma/SQLAlchemy (same reasoning as dialer: data survives restarts)
2. **Async enrichment pipeline** — Celery with Redis broker, Flower dashboard for monitoring, exponential backoff retries
3. **Webhook integration with dialer** — `POST /webhooks/call-complete` to auto-update `call_status` when dialer completes calls
4. **Real enrichment providers** — Clearbit/Apollo/ZoomInfo waterfall strategy with adapter pattern
5. **CRM integrations** — Salesforce/HubSpot OAuth + two-way sync with conflict resolution (last-write-wins + audit log)
6. **Campaign automation** — Temporal for durable workflow execution (sequences with waits, conditionals, pause on engagement)
7. **Full-text search** — PostgreSQL tsvector for fuzzy name/company matching (up to ~500K rows, then Elasticsearch)
8. **Integration tests** — Enrichment pipeline: lead in → provider → normalized → stored (catches API changes)
9. **Auth & multi-tenancy** — JWT + Postgres row-level security for tenant isolation
10. **Rate limiting & input sanitization** — `slowapi` + Pydantic constraints + phone format validation
11. **Debounce industry filter** — 300ms debounce on industry text input (currently fires API call on every keystroke). Use `useDebounce()` hook.

## Architecture Decisions

**Why PostgreSQL over MySQL:** JSONB for semi-structured enrichment data (no schema migrations per provider), native full-text search, row-level security for multi-tenancy, strong Python ecosystem (SQLAlchemy/asyncpg).

**Why Celery over threads/asyncio:** Distributed retries with exponential backoff, Flower dashboard for monitoring, horizontal scaling via worker pods. Threads give none of that visibility.

**Why Temporal over Celery Beat for campaigns:** Durable execution across days, workflow versioning, resumes mid-sequence after crashes. Celery Beat loses state on restart.

**Dict lookup for bulk enrich:** One full-table scan at request start → O(1) per ID lookup. Better than O(n) list scan for each ID.

## AI Usage

- Claude Code: scaffolded FastAPI models, bulk enrich endpoint, headcount range filter, inline error UX
- Verified manually: bulk enrich partial success behavior, immutable Set updates in React, headcount dropdown integration
- TypeScript types: hand-written — types are the spec contract
- Python models: hand-reviewed for Pydantic v2 compatibility

## 90-Day Engineering Plan (Condensed)

**Days 1–14:** Audit codebase, instrument with Sentry/APM, map data flow, identify enrichment success rate as north star metric.

**Days 15–45:** Integration tests FIRST (enrichment pipeline), THEN CI/CD (GitHub Actions → staging → prod), THEN "wow" feature (enrichment waterfall).

**Days 46–75:** Hire Senior Fullstack (B2B SaaS experience, owns features end-to-end). No juniors yet — no mentorship bandwidth.

**Days 76–90:** Process becomes default: mandatory PR reviews, Linear Kanban, on-call rotation, Architecture Decision Records (ADRs).

## Notable Implementation Details

- **Checkbox selection:** Immutable Set updates only (`new Set([...prev, id])`) — never `selected.add(id)` which breaks React re-render
- **Headcount range:** Dropdown sends min/max params to backend, replaces exact match input (better B2B UX)
- **Bulk enrich UX:** Re-fetch table BEFORE showing success message — message reflects actual DB state, not optimistic API response
- **Inline errors:** Replace `alert()` with red banners — better UX, clear error dismissal pattern

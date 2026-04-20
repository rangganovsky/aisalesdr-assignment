# Part C — Engineering Lead Thinking

## 1. Architecture & Scaling

### Scaling to 1M+ Leads

**Database: PostgreSQL (not MySQL)**

The core data model for leads isn't flat. Enrichment data from Clearbit, Apollo, or ZoomInfo returns semi-structured JSON — funding rounds, tech stack, social profiles, firmographic signals. PostgreSQL's native JSONB column handles this without a schema migration every time a new provider adds a field. At 1M rows, partial indexes on `(industry, headcount)` and a GIN index on the enrichment JSONB keep filter queries under 20ms.

The other reason: row-level security. When we add multi-tenancy (and we will, once the second customer signs), Postgres RLS enforces tenant isolation at the database layer. We don't have to trust every query to include a `WHERE tenant_id = ?` clause — the DB enforces it. That's the right place for that guarantee.

Redis handles two distinct jobs: API response caching for dashboard aggregations (common filters, headcount distributions) and as the Celery task broker. Keeping the broker in Redis means one fewer infrastructure dependency versus RabbitMQ, which matters when the team is 2 people.

For search beyond simple filtering — fuzzy name matching, multi-field queries — Postgres full-text search handles up to ~500K rows without pain. Beyond that, we evaluate Elasticsearch. Not before. Running Elasticsearch for 50K leads is an innovation token wasted on a solved problem.

**Enrichment: Strategy Pattern + Waterfall**

```
EnrichmentOrchestrator
    │
    ├── ProviderA (Clearbit)    → try first (best data, higher cost)
    │   └── on miss/timeout ──▶
    ├── ProviderB (Apollo)       → fallback (cheaper, decent coverage)
    │   └── on miss/timeout ──▶
    └── ProviderC (ZoomInfo)     → last resort (expensive, high coverage)
```

Each provider implements `EnrichmentProvider.enrich(lead) -> EnrichmentResult`. The orchestrator doesn't know which provider it's calling. New providers are registered, not hardcoded. This is the Adapter Pattern — we normalize different APIs (REST, GraphQL, SOAP) into a single internal interface.

Enrichment is always async. When a user clicks Enrich, we push a job to the Celery queue and return immediately. The UI polls or uses a WebSocket channel for status. Blocking a web request on a third-party API call is how you get 30-second timeouts and angry customers.

**Why Celery over threads or asyncio tasks:**
Celery gives us exponential backoff retries out of the box (`autoretry_for=(ProviderTimeout,)`, `max_retries=3`, `retry_backoff=True`). It scales horizontally — add worker pods without touching the API layer. Flower provides a real-time dashboard of queue depth, task success/failure rates, and worker health. You need that dashboard at 3am when enrichment suddenly stops working for a customer. Threads and asyncio tasks give you none of that visibility.

**CRM Integrations (Salesforce, HubSpot)**

OAuth token management lives in a dedicated service, not inline in the sync logic. Tokens expire, need refresh, need per-tenant storage. That's not a detail you want scattered across multiple jobs.

Two-way sync:
- **Inbound**: CRM webhooks → our API → update Lead record + audit log entry. Fast path.
- **Outbound**: Our change → Celery job → CRM API with retry. Never blocking.

The tricky part is conflict resolution. If a sales rep edits a lead in Salesforce while our enrichment job is updating the same record, who wins? The answer: last-write-wins with a `last_modified_at` field, and an audit log so conflicts are visible. Not perfect, but deterministic. Perfect is a distributed transaction system that costs six months to build.

**Campaign Automation: Temporal over Celery Beat**

For simple scheduled tasks (daily digest emails, weekly reports), Celery Beat is fine. For campaign sequences — "send email on day 1, wait 3 days, if no reply send follow-up, if opened send different follow-up, pause if they book a call" — you need durable execution.

Celery Beat loses state if the worker restarts mid-sequence. Temporal persists every workflow step to a database. If the server goes down between step 3 and step 4, Temporal resumes at step 4 when it comes back. You can also version workflows — update the sequence definition without breaking in-flight campaigns. That's the key capability.

---

## 2. First 90 Days as Engineering Lead

The order of operations matters. Most new engineering leads want to ship features immediately. That's wrong. The sequence below is designed to build trust (with the team, with the product, with the data) before building velocity.

### Days 1–14: Understand Before Building

**Week 1: Deep Audit**

- Read every line of production code. Not to judge — to understand. Where are the load-bearing parts? Where are the hacks? What's held together with tape?
- Talk to every customer-facing person (sales, support, founders). What breaks most often? What do customers complain about that engineering has never fixed?
- Map the full data flow: lead ingestion → enrichment → CRM sync → campaign trigger. Draw it on a whiteboard. Find the points where data can silently be wrong.
- Instrument everything you can without changing code. Add Sentry for error tracking. Add basic APM (Datadog or New Relic free tier). You need a baseline before you can measure improvement.

**Week 2: Triage and Prioritize**

- Categorize every known issue: customer-impacting bugs (fix now), technical debt (schedule), missing features (backlog). No issue lives in "vague concern" — it gets a category and an owner.
- Identify the one metric that best represents product health. For a B2B lead tool, it's probably enrichment success rate: % of enrich requests that return useful data. That becomes the north star for the first quarter.
- Write a brief technical assessment doc. Share it with the founders. This is your first leadership act — translating technical reality into business language.

### Days 15–45: Stabilize the Foundation

**Week 3–4: Tests + Error Visibility**

The first code you write is tests, not features. Specifically:
- Integration tests for the enrichment pipeline. Input a lead → provider returns data → data is normalized → record is updated. This test runs on every PR. It catches provider API changes, model regressions, and normalization bugs.
- Error tracking (Sentry) wired to every exception path. Silent failures are the most dangerous kind — customers churn because their data is silently wrong, not because the app crashes.
- A simple health dashboard: enrichment success rate by provider, API p95 latency, error rate by endpoint. This exists before any feature work begins.

**Why tests before CI/CD:** CI/CD without tests just automates deploying broken code faster. The tests define what "working" means. CI/CD enforces that definition on every commit.

**Week 5–6: CI/CD Pipeline**

- GitHub Actions: `push to main → run tests → deploy to staging → manual approval → deploy to production`
- Staging environment mirrors production data (anonymized). No more "it worked on my machine."
- Feature flags (LaunchDarkly free tier or a simple DB-backed flag service) for anything risky. Ship to 10% of users first.
- Automated DB migration checks: migrations run in CI against a copy of the production schema. Zero-downtime migration patterns are enforced, not hoped for.

**Week 7–8: The First "WOW" Feature**

By now we have tests, CI/CD, and visibility. We can ship with confidence. The first big feature is the enrichment waterfall — multiple providers with automatic fallback. This is the feature that makes the product materially better for every customer. It demonstrates engineering velocity to the founders and justifies the stabilization investment.

### Days 46–75: Build the Team

**Hiring philosophy:** Hire for the problems you have in the next 12 months, not the ones you'll have in 3 years. Hire someone who can solve today's problems faster than you can, not someone who needs to be taught what the problems are.

**First hire: Senior Fullstack Engineer**

Criteria:
- Has shipped a B2B SaaS product end-to-end, including the messy parts (billing, data sync, auth)
- Can review their own PRs critically — catches their own edge cases
- Opinionated about tradeoffs, not attached to technologies
- Red flag: candidates who immediately want to rewrite everything in a different stack

Interview process: a real problem from the actual codebase, not a LeetCode puzzle. "Here's a bug we hit last week. Walk me through how you'd debug it." That tells you more than any algorithm question.

**Second hire (months 4–6): Backend/Data Engineer**

When enrichment is at scale and CRM integrations are in flight, we need someone who thinks about data pipelines, schema evolution, and async job reliability as their primary domain. Not yet — premature specialization at 2 engineers creates silos.

**Why no junior engineers yet:** In the first year, every engineer needs to be able to own a feature from requirements to production monitoring. Junior engineers need mentorship bandwidth that the team doesn't have. Hire seniors now, build mentorship culture once the team hits 4+.

### Days 76–90: Process Becomes Default

**Dev Process**

- PR reviews: mandatory, 4-hour SLA, focused on architecture and correctness (not style — that's what linters are for). Reviews are teaching moments, not gatekeeping.
- Work tracking: Linear over Jira. Kanban (continuous flow) over 2-week sprints. At seed stage, priorities shift daily. Sprints create fake certainty and real frustration.
- On-call rotation: once the second engineer is onboarded, rotating on-call begins. Every engineer owns what they ship in production. No "that's DevOps's problem" — there is no DevOps yet.
- Architecture Decision Records (ADRs): one-page docs for significant technical decisions. Written before implementation. Captures the context so the next engineer joining doesn't have to reverse-engineer why we chose Celery over threads. The most valuable engineering artifact is not the code — it's the reasoning behind it.

**What success looks like at 90 days:**
- Enrichment success rate is measured and improving
- Every PR has tests before it merges
- Deployments happen daily without fear
- One senior engineer is onboarded and shipping independently
- The founders trust the technical roadmap because it's visible and evidence-based

---

## 3. Tradeoffs (Shortcuts Taken in This Assignment)

This MVP was built in a 60-minute constraint. These are not oversights — they are deliberate decisions with known costs.

**1. In-Memory Database**

What's broken: Vercel serverless functions are stateless. Every cold start creates a fresh Python list. User-added leads persist only for the lifetime of a warm function instance — typically minutes on free tier.

What's visible: The two seed leads always appear. Leads added by the user may vanish after a short idle period. The README documents this explicitly.

Real fix: Neon PostgreSQL free tier (0.5GB, serverless Postgres). Connection string in environment variable. SQLAlchemy async session. Estimated time: 30 minutes with AI-assisted tooling.

**2. No Authentication**

What's broken: Any person with the URL can read and add leads. In production, this is an open API.

Real fix: Auth0 or Clerk for JWT issuance. FastAPI `Depends()` middleware on every protected route. Estimated time: 2 hours.

**3. Headcount Filter is Exact Match**

What's broken: Filtering by headcount=100 requires knowing an exact number. No B2B prospecting workflow works this way. Range filters (1–50, 51–200, etc.) are the right UX.

What was fixed in this submission: The filter now uses min/max range parameters with a dropdown. The backend accepts `min_headcount` and `max_headcount` query params.

**4. No Async Enrichment**

What's broken: The enrich endpoint is synchronous — it blocks the web request until enrichment logic completes. Fine for mock enrichment that takes 0ms. Catastrophic once a real provider API with 500ms–2s latency is plugged in.

Real fix: Celery task queue. The endpoint pushes a job and returns `202 Accepted`. The frontend polls for completion.

**5. Local React State Only**

What's broken: Every page navigation re-fetches all leads. No caching, no optimistic updates, no background refetch.

Real fix: TanStack Query (React Query). Handles caching, stale-while-revalidate, background updates, and retry logic. The mental model maps well to how server state actually behaves.

**6. No Rate Limiting or Input Sanitization on Phone**

What's broken: The API accepts any string as a phone number. An attacker or buggy client can insert 10,000-character strings. No rate limiting means the API is trivially DoS-able.

Real fix: Pydantic `constr(max_length=20)` for phone. `slowapi` for rate limiting (5 requests/second per IP for the POST endpoint).

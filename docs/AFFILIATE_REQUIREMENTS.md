Affiliate network - environment & test requirements
===============================================

This document lists the environment variables, local test setup, and minimal steps required to run the affiliate integration tests and to run the affiliate network locally.

Important: Do NOT run integration tests against your production database or production credentials. Use a disposable local or CI test database (see `.env.test.example` and `docker-compose.yml`).

Required environment variables (minimum)
- `DATABASE_URL` – PostgreSQL connection string used by Prisma for the app database. For tests, use the test DB in `.env.test`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – Clerk publishable key for frontend auth flows.
- `CLERK_SECRET_KEY` – Clerk server secret key for server-side auth operations.
- `CLERK_WEBHOOK_SECRET` – Clerk webhook secret (if using webhooks).
- `AFRICASTALKING_USERNAME` and `AFRICASTALKING_API_KEY` (or similar) – credentials used by SMS/email integrations (used in some affiliate flows).
- `BYPASS_PAYMENTS_KEY` – a dev-only key used to bypass real payment providers during local tests.

Notes about `DATABASE_URL`
- Integration tests should use a dedicated test database. Do not point `DATABASE_URL` in `.env.local` to a production DB when running tests.
- See `.env.test.example` for a template test DB URL.

Local test database (recommended)
- A simple `docker-compose.yml` is included at the repo root to start a disposable Postgres instance for local testing.
- The compose config exposes Postgres on port `5433` and creates credentials matching the `.env.test.example` file.

Quick setup and test steps
1. Start test DB:

```bash
docker compose up -d
```

2. Copy the example test env and edit values if needed:

```bash
cp .env.test.example .env.test
# Edit .env.test if you need to change the DB host/port or credentials
```

3. Generate Prisma client and run migrations for the test DB:

```bash
npx prisma generate
npx prisma migrate deploy --schema=./db/schema.prisma
```

4. (Optional) Run test seed to populate required lookup data:

```bash
npm run seed:test
```

5. Run integration tests:

```bash
npm run test:integration
```

If you prefer not to use Docker, set `DATABASE_URL` in `.env.test` to a dedicated test Postgres instance and follow steps 3–5.

Security reminder
- Never commit `.env.local` or any file with production secrets to the repository.
- Keep production `DATABASE_URL` and Clerk keys secure and use distinct test credentials for CI and local testing.

If you'd like, I can also add CI job definitions that run the integration tests inside a disposable Postgres service.

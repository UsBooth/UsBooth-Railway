# Database bootstrap

For the current free Render development environment, the web service build runs:

`npm run db:push`

before the Next.js build.

This initializes/synchronizes the PostgreSQL schema from `database/schema.ts`.

The database URL is supplied through Render's environment variables and is never committed to Git.

This is intentionally a development-stage bootstrap. Before UsBooth becomes a production service, replace build-time schema push with versioned Drizzle migrations executed by a paid/pre-deploy or dedicated migration workflow.

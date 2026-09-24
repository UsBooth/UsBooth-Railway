# UsBooth Authentication — corrected build

Replace the matching files in the existing repository with this package.

Important:
- `apps/web/lib/db.ts` imports the schema using `../../../database/schema`.
- API route imports use the correct relative depth from `apps/web/app/api/auth/...`.
- Database and auth secrets are accessed lazily at request/runtime.
- API routes are dynamic Node.js routes.
- Render is pinned to Node 22.
- `render.yaml` includes `AUTH_SECRET` as a secure environment variable placeholder.

After committing to `main`, Render should redeploy.

Before testing registration/login, add a real `AUTH_SECRET` in:
Render → usbooth-web → Environment

Do not put the secret in GitHub.


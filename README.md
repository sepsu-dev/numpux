# Numpux

Project and task management app built with Next.js 16, React 19, Bun, and PostgreSQL.

## Requirements

- Bun 1.3+
- PostgreSQL 14+

## Local setup

```bash
git clone <repository-url>
cd numpux
cp .env.example .env
bun install --frozen-lockfile
bun run dev
```

Open <http://localhost:3000>.

On Windows PowerShell, copy environment config with:

```powershell
Copy-Item .env.example .env
```

Set `DATABASE_URL`, `APP_URL`, and a random `JWT_SECRET` of at least 32 characters before starting. Runtime configuration is validated when each service is first used; insecure credential defaults are not provided.

To create the first owner, configure all bootstrap values before first startup:

```dotenv
BOOTSTRAP_ADMIN_NAME=Application Owner
BOOTSTRAP_ADMIN_EMAIL=owner@example.com
BOOTSTRAP_ADMIN_PASSWORD=replace-with-a-strong-password
```

Remove the bootstrap values after the owner exists. Existing passwords are never overwritten during startup.

## Google OAuth

Create an OAuth 2.0 web client in Google Cloud and configure:

```dotenv
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
```

Both Google values are optional, but must be configured together. The callback URL is derived from required `APP_URL`, not from an untrusted request host.

Local callback URL:

```text
http://localhost:3000/api/auth/google/callback
```

## Commands

```bash
bun run dev        # development server
bun run typecheck  # TypeScript validation
bun test           # unit tests
bun run build      # production build
bun run start      # production server
```

## Docker

```bash
docker build -t numpux .
docker run --rm -p 3000:3000 --env-file .env numpux
```

GitHub Actions validates types and tests before publishing images to GHCR.

## Project layout

```text
src/app/          Next.js pages and API route handlers
src/components/   shared and feature UI
src/db/           PostgreSQL connection and current schema initialization
src/lib/          authentication, data access, and server utilities
src/stores/       client-side Zustand stores
src/types/        shared TypeScript models
```

## Security notes

- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Google OAuth requests use a short-lived state cookie for CSRF protection.
- Browser API requests authenticate with the session cookie; no public API key is required.
- Never commit `.env` or production credentials.

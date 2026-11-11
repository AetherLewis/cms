# StarCoreWeb

StarCoreWeb is a web application for managing client relationships and billing operations. It combines a React/TypeScript single-page app with an Express/TypeScript API and Supabase for authentication and Postgres data.

## Features

- Dashboard and monthly billing summaries
- Client directory and contract lifecycle management
- Invoice creation with line items, payments, and invoice status tracking
- Document records and export endpoint
- Recurring billing records
- Audit log, company settings, and outreach automation
- Supabase email/password authentication

## Project structure

| Path | Purpose |
| --- | --- |
| `frontend/` | React 18, Vite, TypeScript, Tailwind UI |
| `server/` | Express API, Supabase access, SQL migrations |
| `server/src/routes/` | API route registration |
| `server/src/controllers/` | API handlers and business logic |
| `server/migrations/` | Initial schema and incremental SQL migrations |
| `stitch_starcore_cms_ui_design/` | UI design references; not part of the runtime application |

## Requirements

- Node.js 20 or newer and npm
- A Supabase project with its URL, anon key, and service-role key
- PostgreSQL client (`psql`) for applying SQL manually, or the Supabase SQL editor
- Optional SMTP, WhatsApp, and OmniRoute-compatible chat completion services for outreach

## Local setup

Install dependencies for each package:

```sh
npm install
cd frontend && npm install
cd ../server && npm install
```

Create `frontend/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# Optional. Defaults to /api. Set this to the API origin when serving separately.
VITE_API_URL=http://localhost:3001/api
```

Create `server/.env`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET=use-a-long-random-secret
PORT=3001
# Comma-separated browser origins allowed by CORS. Defaults to permissive CORS if omitted.
FRONTEND_URL=http://localhost:5173
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend variables or commit secrets. The browser uses Supabase Auth directly with the anon key; API requests send the user's Supabase access token as a bearer token.

Apply the database SQL described in [Database and migrations](docs/database.md) before using the API. Then start the API and frontend in separate terminals:

```sh
cd server && npm run dev
```

```sh
cd frontend && npm run dev
```

The Vite development server listens on port 5173. The API defaults to port 3001. The Vite `/api` proxy currently targets port 4000, so either set `VITE_API_URL=http://localhost:3001/api` as above or adjust the proxy in `frontend/vite.config.ts` to match `PORT`.

## Commands

| Directory | Command | Description |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start Vite dev server |
| `frontend` | `npm run build` | Type-check and build static assets |
| `frontend` | `npm run preview` | Preview the built frontend |
| `frontend` | `npm run lint` | Run ESLint (requires ESLint to be available) |
| `server` | `npm run dev` | Run API with `tsx watch` |
| `server` | `npm run build` | Compile TypeScript to `server/dist` |
| `server` | `npm start` | Run compiled API |
| `server` | `npm run migrate` | Apply `migrations/schema.sql` with `psql` using the configured psql connection |

There is no root-level dev or build script; run commands in their respective package directory.

## Application pages

The frontend routes are defined in `frontend/src/router.tsx`: dashboard, clients, contracts, invoices, payments, documents, audit, settings, recurring billing, reports, automations, and login. Most pages are inside the shared application layout.

## API and data

The API is mounted under `/api`. `GET /api/health` is public. All other routes require `Authorization: Bearer <supabase-access-token>`. See [API reference](docs/api.md) for endpoint paths and response conventions. The database tables, row ownership model, and incremental migrations are covered in [Database and migrations](docs/database.md).

## Deployment

The API is hosted separately on Render. Deploy the `server/` directory as a Render Web Service and deploy the frontend as a static site (the included `frontend/vercel.json` provides a Vercel SPA fallback). Set the frontend build variable `VITE_API_URL` to the Render service origin, for example `https://your-api.onrender.com`; the frontend adds `/api` automatically. Set the API's `FRONTEND_URL` to the deployed frontend origin. Configure Supabase credentials on both services as appropriate and run database migrations before using the deployment.

See [Deployment and configuration](docs/deployment.md) for Render service settings, environment variables, CORS, and migrations.

## Security notes

The API's Supabase client uses the service-role key, which bypasses row-level security. Controllers must scope database operations to the authenticated user's ID. The SQL schema also enables RLS policies for direct Supabase access. Treat the service-role key and JWT signing secret as server-only credentials. Role values in the application are `admin`, `manager`, and `viewer`; authorization enforcement should be reviewed alongside each route before relying on role separation.


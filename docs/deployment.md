# Deployment and configuration

StarCoreWeb deploys as separate services: a static frontend and a Node API hosted on Render. Supabase provides authentication and the Postgres database. The repository includes SPA fallback configuration in `frontend/vercel.json`; other static hosts need an equivalent rewrite to `index.html`.

## Frontend build variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public Supabase anon/publishable key |
| `VITE_API_URL` | Yes for separate hosting | Render API origin, for example `https://your-api.onrender.com`; defaults to `/api` |

Vite exposes `VITE_` variables to browser code at build time. Never put service-role keys or other server secrets in frontend variables. Since the API is hosted separately on Render, set `VITE_API_URL` to the Render service's public origin. The frontend helper appends `/api` when needed; a value already ending in `/api` is preserved. For example, `https://your-api.onrender.com` becomes `https://your-api.onrender.com/api`.

## API runtime variables

| Variable | Required | Description |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only database key; bypasses RLS |
| `JWT_SECRET` | Yes | Required by API auth middleware |
| `PORT` | No | API listen port; defaults to `3001` |
| `FRONTEND_URL` | Recommended | Comma-separated allowed browser origins; omitted value allows any origin |
| `OMNIROUTE_API_URL` | No | Chat completions API base URL; defaults to `http://localhost:20128/v1` |
| `OMNIROUTE_API_KEY` | No | API credential; defaults to a placeholder accepted by some local gateways |
| `SMTP_HOST` | For email | SMTP server host |
| `SMTP_PORT` | No | SMTP port; defaults to `587`, and port `465` enables TLS mode |
| `SMTP_USER` | For email | SMTP username and sender address |
| `SMTP_PASS` | For email | SMTP password |
| `WHATSAPP_API_URL` | For WhatsApp | Messaging API endpoint accepting the expected WhatsApp payload |
| `WHATSAPP_ACCESS_TOKEN` | For WhatsApp | Bearer token for messaging endpoint |

The API loads `.env` at process startup. Set values in the hosting platform's secret/environment manager in production.

## Render API service

Create a Render **Web Service** connected to this repository with these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Add the API runtime environment variables in the Render service settings. At minimum provide `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`. Set `FRONTEND_URL` to the exact deployed frontend origin (scheme and hostname, no path). Render provides `PORT` for the service; the server uses it when set and otherwise listens on 3001. After deployment, verify `https://<render-service>.onrender.com/api/health` returns the health JSON.

For the separately hosted frontend, publish the Vite build output from `frontend/dist`, configure the three frontend build variables, and add an SPA fallback rewrite to `/index.html`. The included Vercel rewrite applies when deploying through Vercel.

## Build and run locally

```sh
cd frontend && npm ci && npm run build
cd ../server && npm ci && npm run build && npm start
```

Serve `frontend/dist` from a static host with an SPA fallback. Run the API as a persistent Node process using `server/dist/server.js` (or `npm start` from `server/`). The frontend and API may share a domain with `/api` reverse-proxied to the API, or use separate origins with `VITE_API_URL` and `FRONTEND_URL` configured accordingly.

The current Vite dev proxy points `/api` to `http://localhost:4000`, while the server defaults to port 3001. For local development, set `VITE_API_URL=http://localhost:3001/api` or align one of those ports.

## Database release steps

Apply the initial schema and all incremental SQL migrations listed in [database.md](database.md) before enabling the API. The built-in `npm run migrate` applies only the baseline schema. Keep migration execution as an explicit release step and maintain a record of applied migrations.

## Health and CORS

Use `GET /api/health` for a basic process health check. It does not verify Supabase connectivity. Set `FRONTEND_URL` to the exact frontend origins that need API access, separated by commas. The API enables credentials in CORS configuration.

## Outreach integrations

The outreach endpoint asks an OpenAI-compatible chat completions API to generate each message, then dispatches email through SMTP or phone contacts through the configured WhatsApp API. Configure the relevant AI and transport credentials before enabling outreach. The endpoint records generated messages and delivery statuses in `automation_logs`; protect database access and log retention accordingly.


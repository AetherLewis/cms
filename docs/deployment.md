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
| `SCHEDULER_SECRET` | Yes for scheduled workflows | Shared secret the deployment cron presents in the `x-scheduler-key` header |
| `OMNIROUTE_MODEL` | No | Chat model name used for outreach generation; defaults to `default` |
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

Add the API runtime environment variables in the Render service settings. At minimum provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; add `SCHEDULER_SECRET` when scheduled workflows are enabled. API authentication validates the caller's Supabase access token, so no separate JWT secret is needed. Provider credentials (`SMTP_*`, `WHATSAPP_*`, `OMNIROUTE_*`) belong here in the hosting secret manager, never in the CMS. Set `FRONTEND_URL` to the exact deployed frontend origin (scheme and hostname, no path). Render provides `PORT` for the service; the server uses it when set and otherwise listens on 3001. After deployment, verify `https://<render-service>.onrender.com/api/health` returns the health JSON.

For the separately hosted frontend, publish the Vite build output from `frontend/dist`, configure the three frontend build variables, and add an SPA fallback rewrite to `/index.html`. The included Vercel rewrite applies when deploying through Vercel.

## Build and run locally

```sh
cd frontend && npm ci && npm run build
cd ../server && npm ci && npm run build && npm start
```

Serve `frontend/dist` from a static host with an SPA fallback. Run the API as a persistent Node process using `server/dist/server.js` (or `npm start` from `server/`). The frontend and API may share a domain with `/api` reverse-proxied to the API, or use separate origins with `VITE_API_URL` and `FRONTEND_URL` configured accordingly.

The Vite dev proxy forwards `/api` to `http://localhost:3001`, matching the API's default `PORT`. Override the target with `VITE_API_PROXY_TARGET` when the API runs elsewhere, or set `VITE_API_URL` to the API origin when the two are served separately.

## Database release steps

Apply the initial schema and all incremental SQL migrations listed in [database.md](database.md) before enabling the API. The built-in `npm run migrate` applies only the baseline schema. Keep migration execution as an explicit release step and maintain a record of applied migrations.

## Health and CORS

Use `GET /api/health` for a basic process health check. It does not verify Supabase connectivity. Set `FRONTEND_URL` to the exact frontend origins that need API access, separated by commas. The API enables credentials in CORS configuration.

## Scheduled workflows (deployment cron)

Workflows run on the server, never in the browser. The API exposes one cron entry point:

```sh
curl -fsS -X POST "https://<api-origin>/api/scheduler/run?limit=10" \
  -H "x-scheduler-key: $SCHEDULER_SECRET"
```

- `POST /api/scheduler/run` sits outside user authentication and is authorised only by `SCHEDULER_SECRET`, compared in constant time. With the secret unset the endpoint returns `503`; a wrong key returns `401`.
- Invoke it on whatever cadence you need — every five minutes is a sensible default. On Render, add a Cron Job service that runs the same curl with `SCHEDULER_SECRET` in its environment. Any scheduler (systemd timer, cloud scheduler, GitHub Actions `schedule`) works as long as the request is a `POST` carrying the header.
- Each call atomically claims due workflows with a compare-and-set on `next_run_at`, so overlapping cron invocations cannot start the same workflow twice. Per-item idempotency keys in `workflow_run_items.dedupe_key` prevent duplicate sends or invoices across retries and restarts.
- The response lists every workflow it claimed with its run status and totals. Per-item detail is served to the signed-in owner from `GET /api/workflows/:id/runs`, which is what the CMS run history renders.
- `limit` bounds how many workflows one tick claims (default 10, maximum 50). Provider calls inside a run are bounded to three concurrent sends.

Scheduled outreach and reminder runs need the matching provider secrets (`OMNIROUTE_*` plus `SMTP_*` or `WHATSAPP_*`). `GET /api/workflows/readiness` reports which providers are configured without revealing values, and the CMS blocks activation and manual runs while a required provider is missing.

## Workflow provider integrations

Outreach workflows ask an OpenAI-compatible chat completions API (`OMNIROUTE_API_URL`, `OMNIROUTE_API_KEY`) to write each message, then deliver through SMTP or the WhatsApp Cloud API. Invoice reminder workflows deliver through SMTP only. Recurring invoice workflows need no provider: they create draft invoices in the app database.

Provider credentials are read from the deployment environment only. The CMS never accepts or stores them; it shows configured/missing status and tells users to update deployment secrets. Run history keeps the failure reason for every item, so a misconfigured provider yields a readable failure instead of a silent partial success.


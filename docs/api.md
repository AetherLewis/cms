# API reference

The Express service mounts endpoints below `/api`. Unless noted, routes require a valid Supabase access token in `Authorization: Bearer <token>`. JSON request bodies are limited to 2 MB.

Successful responses generally use `{ "success": true, "data": ... }`; create operations may return HTTP 201. Errors generally use `{ "success": false, "message": "...", "error": "..." }`. The frontend request helper unwraps the `data` property. Delete handlers may return HTTP 204 with no body. See route definitions in `server/src/routes/` and handlers in `server/src/controllers/` for exact payload fields and validation.

## Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | Returns `{ "status": "ok", "service": "StarCoreWeb" }` |

## Clients

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/clients` | List the authenticated user's clients |
| POST | `/clients` | Create a client |
| GET | `/clients/:id` | Get one client |
| PUT | `/clients/:id` | Update a client |
| DELETE | `/clients/:id` | Delete a client |

Client fields include name, email, phone, address, company, tax ID, and active/inactive status.

## Contracts

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/contracts` | List contracts |
| POST | `/contracts` | Create a contract |
| GET | `/contracts/:id` | Get a contract and related data |
| PUT | `/contracts/:id` | Update a contract |
| DELETE | `/contracts/:id` | Delete a contract |
| GET | `/contracts/:id/stats` | Return contract billing stats |

Contract statuses in the shared types are `draft`, `active`, `completed`, `terminated`, and `cancelled`. Contracts can refer to a client and optionally to a document.

## Invoices and payments

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/invoices` | List invoices |
| POST | `/invoices` | Create an invoice (including line items) |
| GET | `/invoices/:id` | Get an invoice |
| PUT | `/invoices/:id` | Update an invoice |
| DELETE | `/invoices/:id` | Delete an invoice |
| GET | `/payments` | List payments |
| POST | `/payments` | Record a payment |
| GET | `/payments/:id` | Get a payment |
| DELETE | `/payments/:id` | Delete a payment |

Invoice statuses are `draft`, `sent`, `paid`, `overdue`, and `cancelled`. Payment methods are `bank_transfer`, `card`, `check`, `cash`, and `other`. Invoice line items have description, quantity, unit price, and total. Payments belong to an invoice.

## Documents, audit, settings, recurring

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/documents` | List or register a document |
| GET | `/documents/:id` | Get a document |
| DELETE | `/documents/:id` | Delete a document record |
| GET | `/documents/:id/export` | Export document metadata/content as implemented by the controller |
| GET/POST | `/audit` | List or create an audit log entry |
| GET | `/settings` | Read settings |
| PUT | `/settings` | Update settings |
| GET/POST | `/recurring` | List or create recurring billing records |
| PUT | `/recurring/:id/toggle` | Set the `active` state |

Document registration stores a URL and metadata; this API does not itself provide a binary upload endpoint. Confirm the document export controller's behavior before treating it as a file download.

## Reports and automations

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/stats/dashboard` | Dashboard totals and recent records |
| GET | `/stats/monthly?month=YYYY-MM` | Monthly invoice summary |
| POST | `/automations/outreach` | Generate and attempt delivery of outreach to 1–20 contacts |
| GET | `/automations/logs` | List the latest 100 outreach logs |

Outreach input is `{ "contacts": [{ "identifier": "...", "type": "email|phone", "name": "..." }], "basePrompt": "..." }`. A successful request can include per-contact `pending`, `sent`, or `failed` statuses; a 200 response does not guarantee delivery. See [Deployment and configuration](deployment.md) for the optional AI and messaging settings.

## Authentication

Sign in and sign up are handled in the browser through Supabase Auth, not through API login endpoints. The frontend sends the Supabase session access token to the API. API middleware validates it with `supabase.auth.getUser()`. The middleware also requires `JWT_SECRET` to be configured, although token validation is performed by Supabase.


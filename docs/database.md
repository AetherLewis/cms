# Database and migrations

StarCoreWeb stores application data in Supabase Postgres and uses Supabase Auth for identities. The initial schema is [schema.sql](../server/migrations/schema.sql). Incremental SQL files are in [server/migrations](../server/migrations).

## Tables

| Table | Purpose |
| --- | --- |
| `profiles` | User profile and role metadata, keyed to `auth.users` |
| `clients` | Client contact and company details, owned by a user |
| `contracts` | Client agreements, dates, value, status, and document reference |
| `invoices` | Invoice totals, dates, status, and optional client/contract/document references |
| `invoice_items` | Per-invoice descriptions, quantities, unit prices, and totals |
| `payments` | Payments associated with invoices |
| `documents` | Document metadata and externally stored file URL |
| `audit_logs` | User-attributed action and resource records |
| `recurring` | Recurrence schedule metadata and active state |
| `dashboard_stats` | Per-user dashboard totals table |
| `monthly_reports` | Per-user monthly invoice totals table |
| `automation_logs` | Legacy one-off outreach history; created by incremental migrations |
| `settings` | Company settings; created by the settings migration |
| `workflows` | User-owned workflow definitions (type, schedule, timezone, status, config, next run) |
| `workflow_runs` | One row per scheduled or manual execution with accurate per-run totals |
| `workflow_run_items` | Per-item outcome and failure reason for a run, with the idempotency key it consumed |

The baseline schema adds indexes on ownership and foreign-key columns and enables RLS on its application tables. Baseline policies generally scope rows to `auth.uid()`. The API uses the Supabase service-role client, which bypasses RLS, so API controllers must explicitly filter by authenticated user ID.

## Apply the schema

Use the Supabase SQL editor, or connect `psql` to the target project and apply the files in order:

1. `server/migrations/schema.sql`
2. `202611070001_settings.sql`
3. `202611090001_document_links.sql`
4. `202611090002_automation_logs.sql`
5. `202611090003_automation_log_contact_columns.sql`
6. `202611090004_automation_log_updated_at.sql`
7. `202611100001_workflows.sql`

Example for an existing `DATABASE_URL` environment variable:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f server/migrations/schema.sql
for migration in server/migrations/2026*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done
```

The `server` package's `npm run migrate` runs only `migrations/schema.sql` and expects a local/default `psql` connection; it does not run the later migration files. Apply incremental migrations separately and track which have run in your deployment process. Review SQL before applying it to a database with existing production data.

## Data relationships

- A user owns clients, contracts, invoices, documents, recurring records, and report rows.
- Contracts and invoices reference clients; invoices may reference contracts.
- Invoice items and payments reference invoices and are removed with their invoice according to the baseline foreign keys.
- Contracts and invoices can link document records.
- Outreach log rows are grouped by a generated `run_id` and belong to a user.

## Workflow tables

Workflows replace the one-off outreach screen and the metadata-only recurring schedules.

- A `workflows` row belongs to one user and stores `type` (`outreach`, `invoice_reminder`, `recurring_invoice`), `status` (`draft`, `active`, `paused`), `frequency` (`daily`, `weekly`, `monthly`), `run_time` (local `HH:MM`), an IANA `timezone`, the type-specific `config` JSON, and `next_run_at`.
- `workflow_runs` records every execution with `trigger` (`manual` or `schedule`), `status` (`running`, `succeeded`, `partial`, `failed`, `empty`), and total/succeeded/failed/skipped counts.
- `workflow_run_items` stores one row per contact, invoice, or created invoice with `status` (`sent`, `created`, `failed`, `skipped`) and the human-readable failure reason.

Idempotency is enforced in the database: `workflow_run_items` has a unique index on `(workflow_id, dedupe_key)` where `dedupe_key` is not null. A scheduled outreach run keys per contact per local day, invoice reminders key per invoice per local day, and recurring invoices key per client per local billing month. Concurrent runs therefore insert the key once and report the rest as skipped instead of sending or creating twice.

Workflow rows, run rows, and item rows are all enabled for RLS with `auth.uid() = user_id` policies. The API uses the service-role client and filters by the authenticated user in every query, and it re-checks that a linked client belongs to that user before saving or executing a workflow.

The schema uses UUID identifiers, timestamps, and numeric columns for currency values. Application status fields are text columns rather than database enums.


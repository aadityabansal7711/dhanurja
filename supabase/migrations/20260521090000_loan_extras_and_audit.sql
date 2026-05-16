-- Adds storage for application "extras" (lead-form fields that don't have
-- dedicated columns: vehicle/bank/residence/file metadata/remarks) and the
-- in-app audit trail. Both live as JSONB so the application can keep
-- evolving without further migrations.

alter table public.loan_applications
  add column if not exists extras jsonb not null default '{}'::jsonb,
  add column if not exists audit_log jsonb not null default '[]'::jsonb;

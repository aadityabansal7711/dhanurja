alter table public.loan_applications
  add column if not exists reference_contacts jsonb not null default '[]'::jsonb;

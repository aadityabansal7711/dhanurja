alter table public.leads
  add column if not exists followup_history jsonb not null default '[]'::jsonb;

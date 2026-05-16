-- Add repayment_frequency to leads: the app reads lead.repayment_frequency
-- (main.jsx mapSupabaseApplication) but the column did not exist, so every
-- converted lead silently fell back to 'Daily' on reload.

alter table public.leads
  add column if not exists repayment_frequency text not null default 'Daily';

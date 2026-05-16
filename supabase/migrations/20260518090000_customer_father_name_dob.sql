-- Persist customer demographic fields captured during lead generation
-- so KYC verification can read them back after reload.
alter table public.customers add column if not exists father_name text;
alter table public.customers add column if not exists dob date;

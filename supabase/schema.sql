-- Dhanurja Supabase schema
-- Run this in Supabase SQL Editor for project xsfukysrtlioidrypwvr.

create extension if not exists pgcrypto;

create table if not exists public.dsas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  email text unique,
  city text not null default 'New Zone',
  code text not null unique,
  active boolean not null default true,
  portfolio numeric(14,2) not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table public.dsas add column if not exists nickname text;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('master', 'dsa')),
  dsa_id uuid references public.dsas(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text,
  full_name text not null,
  phone text,
  aadhaar_masked text not null,
  pan text,
  dsa_id uuid references public.dsas(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.customers add column if not exists customer_code text;

create table if not exists public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  loan_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete cascade,
  dsa_id uuid references public.dsas(id) on delete set null,
  product text not null default 'Battery Financing Loan',
  amount numeric(14,2) not null default 0,
  tenure integer not null default 24,
  emi numeric(14,2) not null default 0,
  annual_flat_rate numeric(6,4) not null default 0.39,
  stage text not null default 'Lead Created',
  risk text not null default 'To Review',
  geo_status text not null default 'Pending',
  esign_status text not null default 'Not Sent',
  documents_count integer not null default 1,
  documents_total integer not null default 7,
  repayment_health integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.loan_applications add column if not exists annual_flat_rate numeric(6,4) not null default 0.39;
alter table public.loan_applications add column if not exists reference_contacts jsonb not null default '[]'::jsonb;

create table if not exists public.master_dropdown_options (
  option_key text primary key,
  values jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.field_visits (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  dsa_id uuid references public.dsas(id) on delete set null,
  latitude numeric(10,6),
  longitude numeric(10,6),
  accuracy_meters integer,
  photo_path text,
  notes text,
  captured_by uuid references public.profiles(id) on delete set null,
  captured_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  document_type text not null,
  storage_path text,
  status text not null default 'Pending',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.esign_events (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  provider text not null default 'Aadhaar OTP',
  status text not null default 'Pending',
  otp_reference text,
  signed_agreement_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.repayments (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  due_date date not null,
  amount numeric(14,2) not null,
  paid_amount numeric(14,2) not null default 0,
  status text not null default 'Due',
  payment_mode text,
  receipt_number text,
  collected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.is_master()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'master'
  );
$$;

create or replace function public.my_dsa_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select dsa_id from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  resolved_role text;
  linked_dsa uuid;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'requested_role', 'dsa');

  if lower(coalesce(new.email, '')) = 'mayank.arvind.bansal@gmail.com' then
    resolved_role := 'master';
  else
    resolved_role := 'dsa';
  end if;

  if resolved_role = 'dsa' then
    select id into linked_dsa
    from public.dsas
    where lower(code) = lower(coalesce(new.raw_user_meta_data->>'dsa_code', ''))
       or lower(email) = lower(coalesce(new.email, ''))
    limit 1;
  end if;

  insert into public.profiles (id, email, full_name, role, dsa_id)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    resolved_role,
    linked_dsa
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, full_name, role, dsa_id)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', ''),
  'master',
  null
from auth.users
where lower(email) = 'mayank.arvind.bansal@gmail.com'
on conflict (id) do update
set role = 'master',
    dsa_id = null,
    email = excluded.email;

alter table public.profiles enable row level security;
alter table public.dsas enable row level security;
alter table public.customers enable row level security;
alter table public.loan_applications enable row level security;
alter table public.field_visits enable row level security;
alter table public.documents enable row level security;
alter table public.esign_events enable row level security;
alter table public.repayments enable row level security;

drop policy if exists "Profiles visible to owner or master" on public.profiles;
create policy "Profiles visible to owner or master"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_master());

drop policy if exists "Profiles editable by owner or master" on public.profiles;
create policy "Profiles editable by owner or master"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_master())
with check (id = auth.uid() or public.is_master());

drop policy if exists "DSAs visible to authenticated users" on public.dsas;
create policy "DSAs visible to authenticated users"
on public.dsas for select
to authenticated
using (true);

drop policy if exists "Only master inserts DSAs" on public.dsas;
create policy "Only master inserts DSAs"
on public.dsas for insert
to authenticated
with check (public.is_master());

drop policy if exists "Only master updates DSAs" on public.dsas;
create policy "Only master updates DSAs"
on public.dsas for update
to authenticated
using (public.is_master())
with check (public.is_master());

drop policy if exists "Only master deletes DSAs" on public.dsas;
create policy "Only master deletes DSAs"
on public.dsas for delete
to authenticated
using (public.is_master());

drop policy if exists "Scoped customer read" on public.customers;
create policy "Scoped customer read"
on public.customers for select
to authenticated
using (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped customer insert" on public.customers;
create policy "Scoped customer insert"
on public.customers for insert
to authenticated
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped customer update" on public.customers;
create policy "Scoped customer update"
on public.customers for update
to authenticated
using (public.is_master() or (public.my_profile_role() = 'dsa' and dsa_id = public.my_dsa_id()) or id = public.my_agent_id())
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Only master deletes customers" on public.customers;
create policy "Only master deletes customers"
on public.customers for delete
to authenticated
using (public.is_master());

drop policy if exists "Scoped loan read" on public.loan_applications;
create policy "Scoped loan read"
on public.loan_applications for select
to authenticated
using (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped loan insert" on public.loan_applications;
create policy "Scoped loan insert"
on public.loan_applications for insert
to authenticated
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped loan update" on public.loan_applications;
create policy "Scoped loan update"
on public.loan_applications for update
to authenticated
using (public.is_master() or (public.my_profile_role() = 'dsa' and dsa_id = public.my_dsa_id()) or agent_id = public.my_agent_id())
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Only master deletes loans" on public.loan_applications;
create policy "Only master deletes loans"
on public.loan_applications for delete
to authenticated
using (public.is_master());

drop policy if exists "Scoped field visit read" on public.field_visits;
create policy "Scoped field visit read"
on public.field_visits for select
to authenticated
using (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped field visit insert" on public.field_visits;
create policy "Scoped field visit insert"
on public.field_visits for insert
to authenticated
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped field visit update" on public.field_visits;
create policy "Scoped field visit update"
on public.field_visits for update
to authenticated
using (public.is_master() or dsa_id = public.my_dsa_id())
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Only master deletes field visits" on public.field_visits;
create policy "Only master deletes field visits"
on public.field_visits for delete
to authenticated
using (public.is_master());

drop policy if exists "Scoped document read" on public.documents;
create policy "Scoped document read"
on public.documents for select
to authenticated
using (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped document insert" on public.documents;
create policy "Scoped document insert"
on public.documents for insert
to authenticated
with check (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Only master deletes documents" on public.documents;
create policy "Only master deletes documents"
on public.documents for delete
to authenticated
using (public.is_master());

drop policy if exists "Scoped esign read" on public.esign_events;
create policy "Scoped esign read"
on public.esign_events for select
to authenticated
using (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped esign insert" on public.esign_events;
create policy "Scoped esign insert"
on public.esign_events for insert
to authenticated
with check (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped repayment read" on public.repayments;
create policy "Scoped repayment read"
on public.repayments for select
to authenticated
using (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped repayment insert" on public.repayments;
create policy "Scoped repayment insert"
on public.repayments for insert
to authenticated
with check (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Only master deletes repayments" on public.repayments;
create policy "Only master deletes repayments"
on public.repayments for delete
to authenticated
using (public.is_master());

insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload customer files" on storage.objects;
create policy "Authenticated users can upload customer files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'customer-documents');

drop policy if exists "Authenticated users can read customer files" on storage.objects;
create policy "Authenticated users can read customer files"
on storage.objects for select
to authenticated
using (bucket_id = 'customer-documents');

drop policy if exists "Only master deletes customer files" on storage.objects;
create policy "Only master deletes customer files"
on storage.objects for delete
to authenticated
using (bucket_id = 'customer-documents' and public.is_master());

-- Battery financing BRE lifecycle extensions

create table if not exists public.product_rules (
  id uuid primary key default gen_random_uuid(),
  product_name text not null default 'EV Battery Loan',
  max_amount numeric(14,2) not null default 62000,
  min_amount numeric(14,2) not null default 1000,
  annual_flat_rate numeric(6,4) not null default 0.39,
  allowed_tenures integer[] not null default array[12,18,24],
  grace_period_days integer not null default 3,
  npa_threshold_dpd integer not null default 90,
  disbursement_sla_hours integer not null default 48,
  min_bureau_score integer not null default 650,
  foir_threshold numeric(6,4) not null default 0.50,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  agent_code text not null unique,
  name text not null,
  mobile text not null,
  dsa_id uuid references public.dsas(id) on delete set null,
  status text not null default 'Active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('master', 'dsa', 'agent'));
alter table public.profiles add column if not exists assigned_agent_id uuid references public.agents(id) on delete set null;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  lead_number text not null unique,
  customer_name text not null,
  mobile text not null,
  pincode text,
  source text not null default 'Agent',
  campaign text,
  dsa_id uuid references public.dsas(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  requested_amount numeric(14,2) not null default 0,
  requested_tenure integer not null default 24,
  company_make text,
  battery_model text,
  status text not null default 'New',
  followup_date date,
  followup_remark text,
  followup_closed boolean not null default false,
  followup_closed_at timestamptz,
  followup_history jsonb not null default '[]'::jsonb,
  converted_application_id uuid references public.loan_applications(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists followup_date date;
alter table public.leads add column if not exists followup_remark text;
alter table public.leads add column if not exists followup_closed boolean not null default false;
alter table public.leads add column if not exists followup_closed_at timestamptz;
alter table public.leads add column if not exists followup_history jsonb not null default '[]'::jsonb;

create or replace function public.my_agent_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select assigned_agent_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.can_access_loan_application(target_loan_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_master()
    or exists (
      select 1
      from public.loan_applications l
      where l.id = target_loan_id
        and l.dsa_id = public.my_dsa_id()
        and public.my_profile_role() = 'dsa'
    )
    or exists (
      select 1
      from public.leads le
      where le.converted_application_id = target_loan_id
        and le.agent_id = public.my_agent_id()
    );
$$;

create table if not exists public.kyc_checks (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  aadhaar_status text not null default 'Pending',
  pan_status text not null default 'Pending',
  liveness_status text not null default 'Pending',
  ckyc_status text not null default 'Not Checked',
  failure_reason text,
  attempts integer not null default 0,
  manually_overridden boolean not null default false,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  pan_verification jsonb,
  created_at timestamptz not null default now()
);

alter table public.kyc_checks add column if not exists pan_verification jsonb;
alter table public.kyc_checks add column if not exists secure_id_verifications jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'kyc_checks_loan_application_id_key'
  ) then
    -- Deduplicate any pre-existing rows so the unique index can be created safely.
    delete from public.kyc_checks a
    using public.kyc_checks b
    where a.loan_application_id = b.loan_application_id and a.created_at < b.created_at;
    alter table public.kyc_checks add constraint kyc_checks_loan_application_id_key unique (loan_application_id);
  end if;
end $$;

create table if not exists public.underwriting_reviews (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  bureau_name text,
  bureau_score integer,
  scorecard_score integer,
  net_monthly_income numeric(14,2),
  existing_emi numeric(14,2),
  new_emi numeric(14,2),
  foir numeric(8,4),
  decision text not null default 'Pending',
  decision_reason text,
  referred_to uuid references public.profiles(id) on delete set null,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sanctions (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  sanctioned_amount numeric(14,2) not null,
  tenure integer not null,
  annual_flat_rate numeric(6,4) not null default 0.39,
  emi_amount numeric(14,2) not null,
  total_payable numeric(14,2) not null,
  kfs_path text,
  sanction_letter_path text,
  kfs_accepted boolean not null default false,
  accepted_at timestamptz,
  acceptance_ip inet,
  status text not null default 'Generated',
  generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.nach_mandates (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  bank_name text,
  account_masked text,
  ifsc text,
  account_holder_name text,
  penny_drop_status text not null default 'Pending',
  mandate_reference text,
  mandate_status text not null default 'Pending',
  registered_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.disbursements (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  beneficiary_type text not null default 'Customer',
  beneficiary_name text,
  amount numeric(14,2) not null,
  status text not null default 'Pending',
  utr text,
  sla_due_at timestamptz,
  released_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.loan_accounts (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null unique references public.loan_applications(id) on delete cascade,
  loan_account_number text not null unique,
  principal numeric(14,2) not null,
  annual_flat_rate numeric(6,4) not null default 0.39,
  tenure integer not null,
  emi_amount numeric(14,2) not null,
  total_payable numeric(14,2) not null,
  outstanding numeric(14,2) not null,
  current_dpd integer not null default 0,
  dpd_bucket text not null default 'Current',
  status text not null default 'Active',
  disbursed_at timestamptz,
  closed_at timestamptz,
  noc_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.emi_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_account_id uuid not null references public.loan_accounts(id) on delete cascade,
  installment_number integer not null,
  due_date date not null,
  emi_amount numeric(14,2) not null,
  principal_component numeric(14,2),
  interest_component numeric(14,2),
  paid_amount numeric(14,2) not null default 0,
  paid_at timestamptz,
  status text not null default 'Due',
  dpd integer not null default 0,
  unique (loan_account_id, installment_number)
);

create table if not exists public.collection_actions (
  id uuid primary key default gen_random_uuid(),
  loan_account_id uuid not null references public.loan_accounts(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  dpd integer not null default 0,
  bucket text,
  action_type text not null,
  notes text,
  ptp_date date,
  npa_marked boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload_hash text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

alter table public.product_rules enable row level security;
alter table public.master_dropdown_options enable row level security;
alter table public.agents enable row level security;
alter table public.leads enable row level security;
alter table public.kyc_checks enable row level security;
alter table public.underwriting_reviews enable row level security;
alter table public.sanctions enable row level security;
alter table public.nach_mandates enable row level security;
alter table public.disbursements enable row level security;
alter table public.loan_accounts enable row level security;
alter table public.emi_schedules enable row level security;
alter table public.collection_actions enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Master manages product rules" on public.product_rules;
create policy "Master manages product rules"
on public.product_rules for all
to authenticated
using (public.is_master())
with check (public.is_master());

drop policy if exists "Authenticated reads product rules" on public.product_rules;
create policy "Authenticated reads product rules"
on public.product_rules for select
to authenticated
using (true);

drop policy if exists "Master manages master dropdown options" on public.master_dropdown_options;
create policy "Master manages master dropdown options"
on public.master_dropdown_options for all
to authenticated
using (public.is_master())
with check (public.is_master());

drop policy if exists "Authenticated reads master dropdown options" on public.master_dropdown_options;
create policy "Authenticated reads master dropdown options"
on public.master_dropdown_options for select
to authenticated
using (true);

drop policy if exists "Master manages agents" on public.agents;
create policy "Master manages agents"
on public.agents for all
to authenticated
using (public.is_master() or dsa_id = public.my_dsa_id())
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped lead access" on public.leads;
create policy "Scoped lead access"
on public.leads for all
to authenticated
using (public.is_master() or dsa_id = public.my_dsa_id())
with check (public.is_master() or dsa_id = public.my_dsa_id());

drop policy if exists "Scoped KYC access" on public.kyc_checks;
create policy "Scoped KYC access"
on public.kyc_checks for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
)
with check (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped underwriting access" on public.underwriting_reviews;
create policy "Scoped underwriting access"
on public.underwriting_reviews for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
)
with check (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped sanction access" on public.sanctions;
create policy "Scoped sanction access"
on public.sanctions for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
)
with check (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped NACH access" on public.nach_mandates;
create policy "Scoped NACH access"
on public.nach_mandates for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
)
with check (
  public.is_master()
  or exists (
    select 1 where public.can_access_loan_application(loan_application_id)
  )
);

drop policy if exists "Scoped disbursement access" on public.disbursements;
create policy "Scoped disbursement access"
on public.disbursements for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1 from public.loan_applications l
    where l.id = loan_application_id and l.dsa_id = public.my_dsa_id()
  )
)
with check (
  public.is_master()
  or exists (
    select 1 from public.loan_applications l
    where l.id = loan_application_id and l.dsa_id = public.my_dsa_id()
  )
);

drop policy if exists "Scoped loan account access" on public.loan_accounts;
create policy "Scoped loan account access"
on public.loan_accounts for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1 from public.loan_applications l
    where l.id = loan_application_id and l.dsa_id = public.my_dsa_id()
  )
)
with check (
  public.is_master()
  or exists (
    select 1 from public.loan_applications l
    where l.id = loan_application_id and l.dsa_id = public.my_dsa_id()
  )
);

drop policy if exists "Scoped EMI schedule access" on public.emi_schedules;
create policy "Scoped EMI schedule access"
on public.emi_schedules for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1
    from public.loan_accounts a
    where a.id = loan_account_id
      and public.can_access_loan_application(a.loan_application_id)
  )
)
with check (
  public.is_master()
  or exists (
    select 1
    from public.loan_accounts a
    where a.id = loan_account_id
      and public.can_access_loan_application(a.loan_application_id)
  )
);

drop policy if exists "Scoped collection action access" on public.collection_actions;
create policy "Scoped collection action access"
on public.collection_actions for all
to authenticated
using (
  public.is_master()
  or exists (
    select 1
    from public.loan_accounts a
    where a.id = loan_account_id
      and public.can_access_loan_application(a.loan_application_id)
  )
)
with check (
  public.is_master()
  or exists (
    select 1
    from public.loan_accounts a
    where a.id = loan_account_id
      and public.can_access_loan_application(a.loan_application_id)
  )
);

drop policy if exists "Audit visible to master" on public.audit_events;
create policy "Audit visible to master"
on public.audit_events for select
to authenticated
using (public.is_master() or actor_id = auth.uid());

drop policy if exists "Authenticated appends audit" on public.audit_events;
create policy "Authenticated appends audit"
on public.audit_events for insert
to authenticated
with check (actor_id = auth.uid() or public.is_master());

insert into public.product_rules (product_name)
values ('EV Battery Loan')
on conflict do nothing;

-- ============================================================================
-- Loan-lifecycle consolidation (folds sub-tables into loan_applications JSONB).
-- Mirrors migration 20260516120000_consolidate_loan_lifecycle.sql so fresh
-- installs of this file end up in the consolidated state.
-- ============================================================================

alter table public.loan_applications
  add column if not exists kyc jsonb not null default '{}'::jsonb,
  add column if not exists underwriting jsonb not null default '{}'::jsonb,
  add column if not exists sanction jsonb not null default '{}'::jsonb,
  add column if not exists nach jsonb not null default '{}'::jsonb,
  add column if not exists disbursement jsonb not null default '{}'::jsonb,
  add column if not exists account jsonb not null default '{}'::jsonb,
  add column if not exists emi_schedule jsonb not null default '[]'::jsonb,
  add column if not exists collections jsonb not null default '{}'::jsonb,
  add column if not exists docs jsonb not null default '{}'::jsonb;

drop table if exists public.emi_schedules cascade;
drop table if exists public.collection_actions cascade;
drop table if exists public.loan_accounts cascade;
drop table if exists public.disbursements cascade;
drop table if exists public.nach_mandates cascade;
drop table if exists public.sanctions cascade;
drop table if exists public.underwriting_reviews cascade;
drop table if exists public.kyc_checks cascade;
drop table if exists public.documents cascade;
drop table if exists public.field_visits cascade;
drop table if exists public.esign_events cascade;
drop table if exists public.repayments cascade;

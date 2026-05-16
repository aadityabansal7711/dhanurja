do $$
begin
  if to_regclass('public.dealers') is not null then
    drop policy if exists "Authenticated reads dealers" on public.dealers;
    drop policy if exists "Master writes dealers" on public.dealers;
    drop policy if exists "Master manages dealer and agent setup" on public.dealers;
  end if;
end $$;

alter table public.leads drop column if exists dealer_id;

drop table if exists public.dealers;

do $$
begin
  if to_regclass('public.disbursements') is not null then
    alter table public.disbursements alter column beneficiary_type set default 'Customer';
    update public.disbursements set beneficiary_type = 'Customer' where beneficiary_type = 'Dealer';
  end if;
end $$;

update public.master_dropdown_options
   set values = '["Agent", "Web", "App", "Referral"]'::jsonb,
       updated_at = now()
 where option_key = 'sources';

update public.master_dropdown_options
   set values = '["SUPER_ADMIN", "ADMIN", "DSA", "AGENT", "CREDIT_OFFICER", "HIGHER_AUTHORITY", "OPERATIONS", "COLLECTIONS_OFFICER"]'::jsonb,
       updated_at = now()
 where option_key = 'roles';

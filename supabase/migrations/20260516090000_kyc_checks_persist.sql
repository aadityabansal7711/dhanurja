-- Persist Cashfree KYC results in kyc_checks so verification state survives reloads.
-- Skipped entirely on environments that never had the kyc_checks table — the
-- follow-up consolidation migration moves this data into loan_applications.kyc.
do $$
begin
  if to_regclass('public.kyc_checks') is null then
    return;
  end if;

  alter table public.kyc_checks add column if not exists pan_verification jsonb;
  alter table public.kyc_checks add column if not exists secure_id_verifications jsonb;

  if not exists (
    select 1 from pg_constraint where conname = 'kyc_checks_loan_application_id_key'
  ) then
    delete from public.kyc_checks a
    using public.kyc_checks b
    where a.loan_application_id = b.loan_application_id and a.created_at < b.created_at;
    alter table public.kyc_checks add constraint kyc_checks_loan_application_id_key unique (loan_application_id);
  end if;
end $$;

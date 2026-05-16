-- Consolidate loan-lifecycle sub-tables into loan_applications as JSONB columns.
-- Reduces ~10 tables to 0 by folding kyc_checks, underwriting_reviews, sanctions,
-- nach_mandates, disbursements, loan_accounts, emi_schedules, collection_actions,
-- and documents into loan_applications. Also drops unused field_visits,
-- esign_events, repayments. Data is backfilled before drops.
--
-- Every backfill is guarded by to_regclass so this works on environments where
-- the sub-tables were never created (e.g. fresh DBs whose prior full_schema run
-- was a modified version that omitted them).

begin;

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

do $$
begin
  if to_regclass('public.kyc_checks') is not null then
    update public.loan_applications la set kyc = jsonb_strip_nulls(jsonb_build_object(
      'aadhaar_status', k.aadhaar_status,
      'pan_status', k.pan_status,
      'liveness_status', k.liveness_status,
      'ckyc_status', k.ckyc_status,
      'failure_reason', k.failure_reason,
      'attempts', k.attempts,
      'manually_overridden', k.manually_overridden,
      'verified_by', k.verified_by,
      'verified_at', k.verified_at,
      'pan_verification', k.pan_verification,
      'secure_id_verifications', k.secure_id_verifications
    ))
    from public.kyc_checks k where k.loan_application_id = la.id;
  end if;

  if to_regclass('public.underwriting_reviews') is not null then
    update public.loan_applications la set underwriting = jsonb_strip_nulls(jsonb_build_object(
      'bureau_name', u.bureau_name,
      'bureau_score', u.bureau_score,
      'scorecard_score', u.scorecard_score,
      'net_monthly_income', u.net_monthly_income,
      'existing_emi', u.existing_emi,
      'new_emi', u.new_emi,
      'foir', u.foir,
      'decision', u.decision,
      'decision_reason', u.decision_reason,
      'referred_to', u.referred_to,
      'decided_by', u.decided_by,
      'decided_at', u.decided_at
    ))
    from public.underwriting_reviews u where u.loan_application_id = la.id;
  end if;

  if to_regclass('public.sanctions') is not null then
    update public.loan_applications la set sanction = jsonb_strip_nulls(jsonb_build_object(
      'sanctioned_amount', s.sanctioned_amount,
      'tenure', s.tenure,
      'annual_flat_rate', s.annual_flat_rate,
      'emi_amount', s.emi_amount,
      'total_payable', s.total_payable,
      'kfs_path', s.kfs_path,
      'sanction_letter_path', s.sanction_letter_path,
      'kfs_accepted', s.kfs_accepted,
      'accepted_at', s.accepted_at,
      'status', s.status,
      'created_at', s.created_at
    ))
    from public.sanctions s where s.loan_application_id = la.id;
  end if;

  if to_regclass('public.nach_mandates') is not null then
    update public.loan_applications la set nach = jsonb_strip_nulls(jsonb_build_object(
      'bank_name', n.bank_name,
      'account_masked', n.account_masked,
      'ifsc', n.ifsc,
      'account_holder_name', n.account_holder_name,
      'penny_drop_status', n.penny_drop_status,
      'mandate_reference', n.mandate_reference,
      'mandate_status', n.mandate_status,
      'registered_at', n.registered_at
    ))
    from public.nach_mandates n where n.loan_application_id = la.id;
  end if;

  if to_regclass('public.disbursements') is not null then
    update public.loan_applications la set disbursement = jsonb_strip_nulls(jsonb_build_object(
      'beneficiary_type', d.beneficiary_type,
      'beneficiary_name', d.beneficiary_name,
      'amount', d.amount,
      'status', d.status,
      'utr', d.utr,
      'sla_due_at', d.sla_due_at,
      'released_at', d.released_at,
      'approved_by', d.approved_by
    ))
    from public.disbursements d where d.loan_application_id = la.id;
  end if;

  if to_regclass('public.loan_accounts') is not null then
    update public.loan_applications la set account = jsonb_strip_nulls(jsonb_build_object(
      'loan_account_number', a.loan_account_number,
      'principal', a.principal,
      'annual_flat_rate', a.annual_flat_rate,
      'tenure', a.tenure,
      'emi_amount', a.emi_amount,
      'total_payable', a.total_payable,
      'outstanding', a.outstanding,
      'current_dpd', a.current_dpd,
      'dpd_bucket', a.dpd_bucket,
      'status', a.status,
      'disbursed_at', a.disbursed_at,
      'closed_at', a.closed_at,
      'noc_path', a.noc_path
    ))
    from public.loan_accounts a where a.loan_application_id = la.id;
  end if;

  if to_regclass('public.emi_schedules') is not null
     and to_regclass('public.loan_accounts') is not null then
    update public.loan_applications la set emi_schedule = coalesce(sch.rows, '[]'::jsonb)
    from (
      select a.loan_application_id, jsonb_agg(jsonb_build_object(
        'installment_number', e.installment_number,
        'due_date', e.due_date,
        'emi_amount', e.emi_amount,
        'principal_component', e.principal_component,
        'interest_component', e.interest_component,
        'paid_amount', e.paid_amount,
        'paid_at', e.paid_at,
        'status', e.status,
        'dpd', e.dpd
      ) order by e.installment_number) as rows
      from public.emi_schedules e
      join public.loan_accounts a on a.id = e.loan_account_id
      group by a.loan_application_id
    ) sch
    where sch.loan_application_id = la.id;
  end if;

  if to_regclass('public.collection_actions') is not null
     and to_regclass('public.loan_accounts') is not null then
    update public.loan_applications la set collections = coalesce(c.payload, '{}'::jsonb)
    from (
      select a.loan_application_id,
        jsonb_build_object(
          'log', jsonb_agg(jsonb_build_object(
            'id', x.id,
            'assigned_to', x.assigned_to,
            'dpd', x.dpd,
            'bucket', x.bucket,
            'action_type', x.action_type,
            'notes', x.notes,
            'ptp_date', x.ptp_date,
            'npa_marked', x.npa_marked,
            'created_at', x.created_at
          ) order by x.created_at desc)
        ) as payload
      from public.collection_actions x
      join public.loan_accounts a on a.id = x.loan_account_id
      group by a.loan_application_id
    ) c
    where c.loan_application_id = la.id;
  end if;

  if to_regclass('public.documents') is not null then
    update public.loan_applications la set docs = coalesce(d.payload, '{}'::jsonb)
    from (
      select loan_application_id,
        jsonb_object_agg(document_type, jsonb_build_object(
          'status', status,
          'storage_path', storage_path,
          'uploaded_by', uploaded_by,
          'created_at', created_at
        )) as payload
      from public.documents
      where document_type is not null
      group by loan_application_id
    ) d
    where d.loan_application_id = la.id;
  end if;
end $$;

-- Drop the now-redundant sub-tables (cascades RLS policies and FKs).
drop table if exists public.emi_schedules cascade;
drop table if exists public.collection_actions cascade;
drop table if exists public.loan_accounts cascade;
drop table if exists public.disbursements cascade;
drop table if exists public.nach_mandates cascade;
drop table if exists public.sanctions cascade;
drop table if exists public.underwriting_reviews cascade;
drop table if exists public.kyc_checks cascade;
drop table if exists public.documents cascade;

-- Drop unused tables (zero references in application code).
drop table if exists public.field_visits cascade;
drop table if exists public.esign_events cascade;
drop table if exists public.repayments cascade;

commit;

# Battery Financing Application Blueprint

Source reviewed: `/Users/aadityabansal_11/Downloads/BRE Battery.docx`

The Word file contains a single flowchart image for an EV battery loan BRE. The product constraints shown are:

- Loan amount: `₹0` to `₹62,000`
- Interest: `35% p.a. flat`
- Tenure: `12`, `18`, or `24` months
- EMI formula from flowchart: `EMI = (P + P * 35% * n / 12) / n`
- NACH auto debit with `3-day grace`
- NPA trigger: `DPD 90+`
- Closure output: NOC issued

## Lifecycle Stages

| Stage | App status | Owner | Required inputs | System action | Exit condition |
| --- | --- | --- | --- | --- | --- |
| Lead / enquiry | `Lead Created` | DSA, dealer, agent, app | Customer name, mobile, dealer/source, requested amount, tenure | Create lead ID and dedupe by mobile/Aadhaar suffix | Lead is ready for KYC |
| KYC check | `KYC Review` | DSA/customer | Aadhaar eKYC, PAN verification, live/photo check | Validate identity, PAN format, liveness/photo evidence | Pass goes to application; fail is rejected |
| Login / application | `Application Docs` | DSA/customer | KYC docs, income proof, battery invoice, NACH bank details | Collect documents and calculate provisional EMI | Complete docs go to credit underwriting; incomplete goes to hold |
| Credit underwriting | `Credit Review` | Credit team/BRE | Bureau score, internal scorecard, FOIR, amount, tenure | Run hard BRE checks and assign risk | Approve, reject, or refer to higher authority |
| Sanction decision | `Sanction Approval` | Credit approver | BRE result, deviations, sanctioned amount/tenure/rate | Approve/reject sanction | Approved goes to sanction letter; rejected is closed |
| Sanction letter | `Sanction Letter` | System/customer | Terms, KFS, borrower consent | Generate sanction letter and KFS | Borrower accepts or rejects |
| Borrower acceptance | `Borrower Acceptance` | Customer | Digital consent, OTP/e-sign acknowledgement | Record acceptance timestamp and audit trail | Accepted goes to mandate; refused is rejected |
| NACH + disbursement | `Disbursement` | Ops/accounts | NACH mandate, bank verification, dealer/borrower payout details | Register mandate, verify bank, release funds within 48 hours | Disbursed account moves to LMS |
| Loan servicing | `LMS Active` | Collections/system | EMI schedule, NACH status, payment receipts | Run monthly EMI auto-debit, DPD monitoring, grace tracking | Normal closure or collections escalation |
| Collections / SARFAESI | `Collections` / `NPA` | Collections/legal | DPD, notices, recovery notes | Escalate when DPD crosses policy thresholds; NPA at 90+ | Recovery, settlement, or legal action |
| Loan closure | `Closed` | Ops/system | Zero outstanding, closure checks | Issue NOC and close account | Lifecycle complete |

## BRE Rules

### Hard Eligibility Rules

| Rule | Pass condition | Fail result |
| --- | --- | --- |
| Aadhaar eKYC | Aadhaar verified and linked to borrower | Instant reject |
| PAN verification | PAN format and verification success | Reject or hold for correction |
| Photo/liveness | Customer photo/liveness captured | Reject if failed, hold if missing |
| Amount cap | Requested amount `<= ₹62,000` | Reject or cap to maximum with approver consent |
| Tenure | `12`, `18`, or `24` months | Reject invalid tenure |
| Rate | `35% p.a. flat` | No manual override except admin-configured product revision |
| Required docs | KYC docs, income proof, battery invoice, NACH bank details present | Hold |
| Sanction approval | Approver status is approved | Reject if declined |
| Borrower acceptance | Borrower accepts KFS and terms | Reject/withdraw |
| NACH mandate | Mandate registered successfully | Hold before disbursement |
| Bank/account verification | Account verified | Hold or reject |

### Underwriting Decision Outputs

| Decision | Meaning | Next state |
| --- | --- | --- |
| `Approve` | All hard rules pass and scorecard is acceptable | `Sanction Approval` |
| `Refer` | Rule deviation, thin bureau, FOIR concern, or manual review needed | `Higher Authority` |
| `Reject` | Hard rule failed or risk unacceptable | `Rejected` |
| `Hold` | Missing document, incomplete mandate, pending verification | `Hold` |

## Product Calculations

Use flat-rate interest exactly as the flowchart specifies:

```text
principal = requested loan amount
tenureMonths = selected tenure
annualRate = 0.35
totalInterest = principal * annualRate * tenureMonths / 12
totalPayable = principal + totalInterest
emi = round(totalPayable / tenureMonths)
```

Example for `₹62,000` over `24` months:

```text
interest = 62000 * 0.35 * 24 / 12 = 43400
total payable = 105400
EMI = 4392
```

## Application Pages

### Dashboard

Purpose: Role-based operations view.

Components:

- KPI cards: leads, KYC pending, docs on hold, underwriting queue, sanctioned, disbursed, DPD 1-3, DPD 90+
- Loan pipeline table with status filters
- Search by loan ID, customer, Aadhaar suffix, PAN, mobile, DSA, dealer
- BRE exception queue
- Today actions panel

### Leads

Purpose: Capture enquiry and start KYC.

Components:

- Lead intake form
- Customer/dealer/source assignment
- Loan amount and tenure selector constrained to product rules
- Duplicate lead warning
- Start KYC action
- Reject/withdraw action

### KYC

Purpose: Aadhaar, PAN, and photo/liveness gate.

Components:

- Aadhaar eKYC panel
- PAN verification panel
- Customer photo/liveness upload or camera capture
- KYC result card
- Fail reason selector
- Audit log

Required actions:

- `Pass KYC`
- `Reject KYC`
- `Hold for correction`

### Application Docs

Purpose: Complete loan login/application.

Components:

- Borrower profile
- Income proof uploader
- Battery invoice uploader
- NACH bank details form
- Document checklist
- EMI preview
- Submit to underwriting action

Required documents:

- Aadhaar/eKYC proof
- PAN
- Customer photo/liveness evidence
- Income proof
- Battery invoice
- NACH mandate/bank details

### Credit Underwriting

Purpose: Run BRE, scorecard, and approval decisions.

Components:

- Bureau summary
- Internal scorecard
- FOIR calculator
- Hard-rule validation list
- Deviation/referral form
- Approve/refer/reject buttons
- Higher authority review queue

Decision outputs:

- Approved
- Referred to higher authority
- Rejected

### Sanction

Purpose: Confirm sanctioned terms and borrower consent.

Components:

- Sanction terms editor/viewer
- KFS generator
- Sanction letter generator
- Borrower acceptance panel
- OTP/e-sign capture
- Acceptance audit trail

Required actions:

- Generate sanction letter
- Send to borrower
- Accept terms
- Reject/withdraw

### NACH + Disbursement

Purpose: Register mandate and release funds.

Components:

- NACH mandate status
- Bank account verification
- Beneficiary selection: borrower or dealer
- Disbursement checklist
- Fund release screen
- 48-hour SLA tracker

Required actions:

- Register mandate
- Verify account
- Approve disbursement
- Mark funds released

### LMS / Loan Servicing

Purpose: Maintain active loan after disbursement.

Components:

- EMI schedule
- NACH debit status
- Payment receipts
- Outstanding balance
- DPD tracker
- 3-day grace indicator
- Customer communication log

Required actions:

- Record payment
- Mark NACH success/failure
- Trigger collection workflow
- Close loan and issue NOC

### Collections

Purpose: Manage overdue and NPA accounts.

Components:

- DPD buckets: `1-3`, `4-30`, `31-60`, `61-89`, `90+`
- NACH bounce tracker
- Collection call notes
- Promise-to-pay
- Notices
- SARFAESI/legal escalation tracker

Required actions:

- Assign collector
- Log contact attempt
- Record recovery
- Mark NPA at DPD 90+
- Escalate legal/SARFAESI

### Reports

Purpose: Management and compliance view.

Components:

- Funnel report by stage
- DSA/dealer sourcing report
- Approval/rejection/refer reasons
- Disbursement TAT
- EMI collection health
- DPD/NPA report
- Product rule exception report

### DSA Network

Purpose: Manage sourcing agents.

Components:

- DSA onboarding
- Active/paused status
- Portfolio sourced
- Approval conversion
- Delinquency by DSA
- City/branch assignment

### Settings

Purpose: Configure product and access controls.

Components:

- Product rules: max amount, rate, allowed tenures, grace days, NPA DPD
- Roles and permissions
- Document checklist configuration
- Approval matrix and deviation thresholds
- Notification templates
- Audit log

## Core Components

| Component | Responsibility |
| --- | --- |
| `LoanPipeline` | Stage filters, loan table, row selection |
| `LeadForm` | Enquiry capture and duplicate check |
| `KycGate` | Aadhaar, PAN, and liveness decision |
| `DocumentChecklist` | Required document completion and hold logic |
| `BreRuleRunner` | Hard-rule checks and underwriting output |
| `ScorecardPanel` | Bureau, FOIR, internal score display |
| `SanctionLetterPanel` | Terms, KFS, sanction document, borrower acceptance |
| `NachMandatePanel` | Mandate registration and account verification |
| `DisbursementPanel` | Beneficiary, approvals, fund release |
| `LmsAccountPanel` | EMI schedule, NACH debits, repayment status |
| `CollectionsPanel` | DPD monitoring and recovery workflows |
| `DsaNetworkPanel` | DSA onboarding and performance |
| `RulesSettingsPanel` | Product rule configuration |
| `AuditTrail` | Immutable action history by loan |
| `RoleGuard` | Page and action permissions |

## Data Model Additions

Current schema already has DSAs, profiles, customers, loan applications, field visits, documents, e-sign events, and repayments. To fully support the BRE flow, add or extend these concepts:

| Table / entity | Key fields |
| --- | --- |
| `product_rules` | product, max_amount, annual_flat_rate, allowed_tenures, grace_days, npa_dpd, active |
| `leads` | lead_number, source_type, dealer_id, customer_name, mobile, requested_amount, requested_tenure, status |
| `kyc_checks` | loan_application_id, aadhaar_status, pan_status, liveness_status, failure_reason, checked_at |
| `underwriting_reviews` | loan_application_id, bureau_score, internal_score, foir, decision, refer_reason, approved_by |
| `sanction_letters` | loan_application_id, amount, tenure, rate, emi, kfs_path, accepted_at, accepted_by |
| `nach_mandates` | loan_application_id, bank_name, account_masked, ifsc, mandate_status, registered_at |
| `disbursements` | loan_application_id, beneficiary_type, beneficiary_name, amount, status, released_at, utr |
| `loan_accounts` | loan_application_id, principal, total_payable, outstanding, status, closed_at, noc_path |
| `collection_actions` | loan_application_id, dpd, bucket, action_type, notes, next_followup_at |
| `audit_events` | entity_type, entity_id, action, actor_id, metadata, created_at |

## Role Permissions

| Role | Can do |
| --- | --- |
| Master/Admin | Configure rules, manage DSAs, override/refer decisions, see all reports |
| DSA | Create leads, complete KYC/docs, see own portfolio |
| Credit | Review underwriting, approve/refer/reject |
| Higher Authority | Approve deviations and referrals |
| Ops | Generate sanction docs, verify NACH, disburse |
| Collections | Manage DPD accounts, recovery, NPA escalation |
| Customer | Complete KYC, accept sanction/KFS, view repayments/NOC |

## Implementation Priorities

1. Replace generic loan defaults with battery product rules: `₹62,000` cap, `12/18/24` month tenure, `35%` flat rate EMI.
2. Add real route/page switching for every sidebar item instead of showing all dashboard sections on one screen.
3. Add stage-specific gates so users cannot skip KYC, documents, underwriting, sanction acceptance, NACH, or disbursement.
4. Add BRE rule runner and visible pass/fail/refer/hold results.
5. Add document checklist and hold state for incomplete application docs.
6. Add sanction/KFS acceptance workflow.
7. Add NACH mandate and bank verification workflow before disbursement.
8. Add LMS repayment schedule, NACH debit result tracking, 3-day grace, DPD, NPA 90+, and NOC closure.
9. Add audit trail for every workflow decision.
10. Add reports for funnel, DSA performance, disbursement TAT, collections, and NPA.

## Current App Gaps To Fix

- Current default loan amount is `₹250,000`, which violates the BRE cap of `₹62,000`.
- Current tenure options include invalid long-tenure values; the BRE allows only `12`, `18`, and `24` months.
- Current EMI calculation is approximate; it should use the flat-rate formula from the flowchart.
- Sidebar page buttons do not yet drive separate page experiences.
- The KYC gate is treated as already complete; Aadhaar, PAN, and liveness need explicit pass/fail states.
- Document completeness exists only as a simple count; the flow needs named document requirements and hold behavior.
- Underwriting lacks bureau, scorecard, FOIR, refer-to-higher-authority, and hard reject handling.
- Sanction letter and KFS generation are not represented.
- Borrower acceptance is mixed with e-sign; it needs a distinct acceptance gate.
- NACH registration and bank account verification are not represented before disbursement.
- LMS servicing does not yet generate EMI schedules, track DPD daily, apply 3-day grace, trigger NPA at DPD 90+, or issue NOC on closure.

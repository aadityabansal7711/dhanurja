import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BadgeIndianRupee,
  BanknoteArrowDown,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Camera,
  Car,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileSignature,
  Fingerprint,
  Gauge,
  IndianRupee,
  Images,
  Landmark,
  ListChecks,
  Mic,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageSquareText,
  Phone,
  Plus,
  ReceiptIndianRupee,
  Search,
  Settings2,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import dhanurjaLogo from './assets/dhanurja-logo.jpeg';
import {
  describePanStatus,
  isPanStatusAcceptable,
  normalizeMatch,
  verifyBankAccountWithCashfree,
  verifyDrivingLicenseWithCashfree,
  verifyFaceLivenessWithCashfree,
  verifyPanWithCashfree,
  verifyVehicleRcWithCashfree,
  verifyVoterIdWithCashfree,
} from './panVerification';
import { isSupabaseConfigured, supabase } from './supabase';
import './styles.css';

const LOAN_AMOUNT_OPTIONS = [12000, 25000, 36000, 50000, 62000];
const BATTERY_MODEL_OPTIONS = ['Ampere EV LFP 60V 32Ah battery'];
const COMPANY_MAKE_OPTIONS = ['Ampere EV'];
const LEAD_SOURCE_OPTIONS = ['Agent', 'Web', 'App', 'Referral'];
const VEHICLE_CATEGORY_OPTIONS = ['E-Rickshaw', 'E-Loader', 'E-2W', 'E-3W Passenger', 'E-3W Cargo', 'Other'];
const DEFAULT_LOAN_INTEREST_RATE = 0.39;
const MIN_LOAN_INTEREST_RATE = 0.27;
const MAX_LOAN_INTEREST_RATE = 0.39;
const INDIA_DIAL_CODE = '+91';
const REPAYMENT_FREQUENCY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly', disabled: true },
];

const PRODUCT_RULES = {
  product: 'EV Battery Loan',
  maxAmount: Math.max(...LOAN_AMOUNT_OPTIONS),
  minAmount: 0,
  annualFlatRate: DEFAULT_LOAN_INTEREST_RATE,
  tenures: [12, 18, 24],
  graceDays: 3,
  npaDpd: 90,
  disbursementSlaHours: 48,
  foirThreshold: 0.5,
  minBureauScore: 650,
  minMonthlyIncome: 12000,
};

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DSA',
  'AGENT',
  'CREDIT_OFFICER',
  'HIGHER_AUTHORITY',
  'OPERATIONS',
  'COLLECTIONS_OFFICER',
];

const DEFAULT_ROLE_ACCESS_MATRIX = {
  SUPER_ADMIN: ['Dashboard', 'Leads', 'Lead List', 'Followup', 'KYC Verification', 'TVR', 'Loan Applications', 'Field Investigation', 'Credit Review', 'E-Sign', 'Disbursement', 'Rejected', 'Collections', 'Delinquency Report', 'Reports', 'Targets', 'DSA Network', 'User Management', 'Master Data'],
  ADMIN: ['Dashboard', 'Leads', 'Lead List', 'Followup', 'KYC Verification', 'TVR', 'Loan Applications', 'Field Investigation', 'Credit Review', 'E-Sign', 'Disbursement', 'Rejected', 'Delinquency Report', 'Reports', 'Targets', 'DSA Network'],
  DSA: ['Dashboard', 'Leads', 'Lead List', 'Followup', 'KYC Verification', 'TVR', 'Loan Applications', 'Rejected', 'Reports', 'Targets'],
  AGENT: ['Leads', 'Lead List', 'Followup', 'KYC Verification', 'TVR', 'Rejected', 'Targets'],
  CREDIT_OFFICER: ['Dashboard', 'Loan Applications', 'Credit Review', 'Rejected', 'Reports'],
  HIGHER_AUTHORITY: ['Dashboard', 'Loan Applications', 'Credit Review', 'E-Sign', 'Rejected', 'Reports'],
  OPERATIONS: ['Dashboard', 'Loan Applications', 'Disbursement', 'Rejected', 'Reports'],
  COLLECTIONS_OFFICER: ['Dashboard', 'Followup', 'Collections', 'Delinquency Report', 'Reports'],
};

const menu = [
  ['Dashboard', Gauge],
  ['Leads', Users],
  ['Lead List', ListChecks],
  ['Followup', CalendarDays],
  ['KYC Verification', Fingerprint],
  ['TVR', Mic],
  ['Loan Applications', ClipboardCheck],
  ['Field Investigation', MapPin],
  ['Credit Review', ShieldCheck],
  ['E-Sign', FileSignature],
  ['Disbursement', Landmark],
  ['Rejected', AlertTriangle],
  ['Collections', ReceiptIndianRupee],
  ['Delinquency Report', AlertTriangle],
  ['Reports', ListChecks],
  ['Targets', BadgeIndianRupee],
  ['DSA Network', BriefcaseBusiness],
  ['User Management', Building2],
  ['Master Data', Settings2],
];

const STAGE_NAV_LABELS = [
  'KYC Verification',
  'TVR',
  'Loan Applications',
  'Field Investigation',
  'Credit Review',
  'E-Sign',
  'Disbursement',
];

const merchantLegalName = 'ALLIED NEXUS RECHARGE RENEWABLS';

const merchantContact = {
  lastUpdated: '03-05-2026 22:18:04',
  legalName: merchantLegalName,
  registeredAddress: 'SECOND FLOOR,2/3 PRAKASH ENCLAVE,PREM MOTORS,PARTNER MAYANK BANSAL,BYE PASS ROAD,NEW, AGRA, UTTAR PRADESH, PIN: 282005',
  operationalAddress: 'SECOND FLOOR,2/3 PRAKASH ENCLAVE,PREM MOTORS,PARTNER MAYANK BANSAL,BYE PASS ROAD,NEW, AGRA, UTTAR PRADESH, PIN: 282005',
  telephone: '9897200444',
  email: 'ampere@arvindgroup.in',
};

const termsLastUpdated = '03-05-2026 22:18:23';
const cancellationLastUpdated = '03-05-2026 22:18:23';

const termsIntro = [
  `These Terms and Conditions, along with privacy policy or other terms ("Terms") constitute a binding agreement by and between ${merchantLegalName}, ("Website Owner" or "we" or "us" or "our") and you ("you" or "your") and relate to your use of our website, goods (as applicable) or services (as applicable) (collectively, "Services").`,
  'By using our website and availing the Services, you agree that you have read and accepted these Terms (including the Privacy Policy). We reserve the right to modify these Terms at any time and without assigning any reason. It is your responsibility to periodically review these Terms to stay informed of updates.',
  'The use of this website or availing of our Services is subject to the following terms of use:',
];

const termsItems = [
  'To access and use the Services, you agree to provide true, accurate and complete information to us during and after registration, and you shall be responsible for all acts done through the use of your registered account.',
  'Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials offered on this website or through the Services, for any specific purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.',
  'Your use of our Services and the website is solely at your own risk and discretion. You are required to independently assess and ensure that the Services meet your requirements.',
  'The contents of the Website and the Services are proprietary to Us and you will not have any authority to claim any intellectual property rights, title, or interest in its contents.',
  'You acknowledge that unauthorized use of the Website or the Services may lead to action against you as per these Terms or applicable laws.',
  'You agree to pay us the charges associated with availing the Services.',
  'You agree not to use the website and/or Services for any purpose that is unlawful, illegal or forbidden by these Terms, or Indian or local laws that might apply to you.',
  'You agree and acknowledge that website and the Services may contain links to other third party websites. On accessing these links, you will be governed by the terms of use, privacy policy and such other policies of such third party websites.',
  'You understand that upon initiating a transaction for availing the Services you are entering into a legally binding and enforceable contract with us for the Services.',
  'You shall be entitled to claim a refund of the payment made by you in case we are not able to provide the Service. The timelines for such return and refund will be according to the specific Service you have availed or within the time period provided in our policies (as applicable). In case you do not raise a refund claim within the stipulated time, then this would make you ineligible for a refund.',
  'Notwithstanding anything contained in these Terms, the parties shall not be liable for any failure to perform an obligation under these Terms if performance is prevented or delayed by a force majeure event.',
  'These Terms and any dispute or claim relating to it, or its enforceability, shall be governed by and construed in accordance with the laws of India.',
  'All disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in AGRA, UTTAR PRADESH.',
  'All concerns or communications relating to these Terms must be communicated to us using the contact information provided on this website.',
];

function currentPublicRoute() {
  return window.location.hash.replace(/^#\/?/, '').toLowerCase();
}

function isPublicLegalRoute(route) {
  return ['contact-us', 'terms-and-conditions', 'cancellation-policy'].includes(route);
}

const lifecycle = [
  'Lead / Enquiry',
  'KYC Check',
  'Login / Application',
  'Credit Underwriting',
  'Sanction & KFS',
  'NACH + Disbursement',
  'Loan Servicing',
  'Closed / NPA',
];

const documentTypes = [
  'Aadhaar eKYC',
  'PAN Card',
  'Selfie / liveness',
  'Driving License',
  'Voter ID',
  'Vehicle RC',
];

const TVR_PAIN_OPTIONS = ['Range', 'Charging Time', 'Frequent Repair', 'Other'];
const TVR_VEHICLE_OPTIONS = ['E-Rickshaw', 'E-Loader', 'E-2W', 'Other'];
const TVR_DAYS_DRIVEN_OPTIONS = ['>25', '20-25', '<20'];
const TVR_BATTERY_FOR_OPTIONS = ['Self', 'Family', 'Other'];
const TVR_BACKUP_SOURCE_OPTIONS = ['Savings', 'Family'];

const TVR_CHECKLIST_SECTIONS = [
  {
    id: 'vehicle',
    title: 'Section 1 · Current EV & Battery',
    fields: [
      { key: 'vehicleType', label: 'Vehicle type', type: 'choice', options: TVR_VEHICLE_OPTIONS },
      { key: 'vehicleTypeOther', label: 'Vehicle (if Other)', type: 'text', showIf: (a) => a.vehicleType === 'Other' },
      { key: 'yearsDrivingEv', label: 'Years driving EV', type: 'number', suffix: 'yrs' },
      { key: 'currentBatteryLeadAcid', label: 'Current battery is Lead-Acid?', type: 'yesno' },
      { key: 'fullChargeRangeKm', label: 'Full charge range', type: 'number', suffix: 'km' },
      { key: 'chargingTimePerDayHours', label: 'Charging time per day', type: 'number', suffix: 'hrs' },
      { key: 'chargesPerDay', label: 'Charges per day', type: 'number', suffix: 'times' },
      { key: 'biggestPain', label: 'Biggest pain with lead-acid', type: 'choice', options: TVR_PAIN_OPTIONS },
      { key: 'biggestPainOther', label: 'Pain (if Other)', type: 'text', showIf: (a) => a.biggestPain === 'Other' },
    ],
  },
  {
    id: 'income',
    title: 'Section 2 · Income & EMI Affordability',
    fields: [
      { key: 'dailyEarnings', label: 'Daily earnings from EV (Rs.)', type: 'number' },
      { key: 'electricitySpend', label: 'Monthly electricity spend (Rs.)', type: 'number' },
      { key: 'maintenanceSpend', label: 'Monthly maintenance spend (Rs.)', type: 'number' },
      { key: 'proposedEmi', label: 'Proposed DhanUrja EMI (Rs./day)', type: 'number' },
      { key: 'daysDrivenLastMonth', label: 'Days driven last month', type: 'choice', options: TVR_DAYS_DRIVEN_OPTIONS },
      { key: 'secondEarningMember', label: 'Household has 2nd earning member?', type: 'yesno' },
      { key: 'threeDayBackup', label: '3-day EMI backup available?', type: 'yesno' },
      { key: 'backupSource', label: 'Backup source', type: 'choice', options: TVR_BACKUP_SOURCE_OPTIONS, showIf: (a) => a.threeDayBackup === 'Yes' },
    ],
  },
  {
    id: 'intent',
    title: 'Section 3 · Intent & Route Stability',
    fields: [
      { key: 'batteryFor', label: 'Battery for', type: 'choice', options: TVR_BATTERY_FOR_OPTIONS },
      { key: 'batteryForOther', label: 'Battery for (if Other)', type: 'text', showIf: (a) => a.batteryFor === 'Other' },
      { key: 'dailyKm', label: 'Daily km driven', type: 'number', suffix: 'km' },
      { key: 'sameRouteDaily', label: 'Same route daily?', type: 'yesno' },
      { key: 'swapStationOnRoute', label: 'DhanUrja swap station on daily route?', type: 'yesno', extra: 'Don’t know' },
      { key: 'previousLoanTaken', label: 'Previous loan taken?', type: 'yesno' },
      { key: 'previousLoanRepaidOnTime', label: 'Repaid on time?', type: 'yesno', showIf: (a) => a.previousLoanTaken === 'Yes' },
    ],
  },
  {
    id: 'asset',
    title: 'Section 4 · Asset Control & References',
    fields: [
      { key: 'agreesVisitStation', label: 'Agrees to visit station if battery issue?', type: 'yesno' },
      { key: 'reference1Name', label: 'Reference 1 (Family) – Name', type: 'text' },
      { key: 'reference1Mobile', label: 'Reference 1 (Family) – Mobile', type: 'text' },
      { key: 'reference2Name', label: 'Reference 2 (Stand/Garage) – Name', type: 'text' },
      { key: 'reference2Mobile', label: 'Reference 2 (Stand/Garage) – Mobile', type: 'text' },
    ],
  },
];

const TVR_CHECKLIST_FIELDS = TVR_CHECKLIST_SECTIONS.flatMap((section) => section.fields);

function isTvrFieldApplicable(field, answers) {
  return typeof field.showIf === 'function' ? Boolean(field.showIf(answers)) : true;
}

function countTvrAnswered(answers = {}) {
  return TVR_CHECKLIST_FIELDS.filter((field) => {
    if (!isTvrFieldApplicable(field, answers)) return false;
    const value = answers[field.key];
    return value !== undefined && value !== null && String(value).trim() !== '';
  }).length;
}

function countTvrApplicable(answers = {}) {
  return TVR_CHECKLIST_FIELDS.filter((field) => isTvrFieldApplicable(field, answers)).length;
}

function evaluateTvrPillars(answers = {}) {
  const range = Number(answers.fullChargeRangeKm);
  const charge = Number(answers.chargingTimePerDayHours);
  const electricity = Number(answers.electricitySpend) || 0;
  const maintenance = Number(answers.maintenanceSpend) || 0;
  const emi = Number(answers.proposedEmi);
  const totalSpend = electricity + maintenance;

  const highUpgradeIntent =
    (Number.isFinite(range) && range < 60 && range > 0) ||
    (Number.isFinite(charge) && charge > 6);
  const emiComfort = Number.isFinite(emi) && emi > 0 && totalSpend >= emi + 100;
  const routeFit = answers.swapStationOnRoute === 'Yes';

  return { highUpgradeIntent, emiComfort, routeFit, totalSpend };
}

const dsaDirectory = [];
const agentDirectory = [];

const MASTER_EMAIL = 'mayank.arvind.bansal@gmail.com';
const MASTER_EMAILS = [
  MASTER_EMAIL,
  'dhiraj2601@rediffmail.com',
];

function isMasterEmail(email = '') {
  return MASTER_EMAILS.includes(String(email || '').trim().toLowerCase());
}

function dsaDisplayName(dsa) {
  if (!dsa) return '';
  const nickname = typeof dsa.nickname === 'string' ? dsa.nickname.trim() : '';
  if (nickname) return nickname;
  return dsa.firmName || dsa.name || dsa.id || '';
}

function normalizePolicyEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function sanitizeRoleAccessMatrix(value) {
  const validModules = new Set(menu.map(([label]) => label));
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const roles = Array.from(new Set([...ROLES, ...Object.keys(source)]));
  return roles.reduce((matrix, role) => {
    const roleValues = Array.isArray(source[role]) ? source[role] : DEFAULT_ROLE_ACCESS_MATRIX[role] || [];
    const modules = Array.from(new Set(roleValues.filter((module) => validModules.has(module))));
    matrix[role] = modules;
    return matrix;
  }, {});
}

function roleAccessFor(role = '', matrix = DEFAULT_ROLE_ACCESS_MATRIX) {
  const normalizedRole = String(role || '').toUpperCase();
  return matrix?.[normalizedRole] || DEFAULT_ROLE_ACCESS_MATRIX[normalizedRole] || [];
}

function parsePolicyNumberList(value) {
  if (!Array.isArray(value)) return [];
  const numbers = value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

function parsePolicyTextList(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)));
}

function sanitizeUserAccessPolicy(policy) {
  const email = normalizePolicyEmail(policy?.email);
  if (!email) return null;
  const minInterestRate = Number(policy?.minInterestRate);
  const maxInterestRate = Number(policy?.maxInterestRate);
  const role = String(policy?.role || '').trim().toUpperCase();
  const dsaId = String(policy?.dsaId || '').trim();
  const agentId = String(policy?.agentId || '').trim();
  return {
    email,
    role: role && ROLES.includes(role) ? role : 'DSA',
    dsaId,
    agentId,
    loanAmounts: parsePolicyNumberList(policy?.loanAmounts),
    tenures: parsePolicyNumberList(policy?.tenures),
    batteryModels: parsePolicyTextList(policy?.batteryModels),
    companyMakes: parsePolicyTextList(policy?.companyMakes),
    minInterestRate: Number.isFinite(minInterestRate) ? minInterestRate : null,
    maxInterestRate: Number.isFinite(maxInterestRate) ? maxInterestRate : null,
  };
}

function sanitizeEmailPolicy(policy) {
  return sanitizeUserAccessPolicy(policy);
}

function findUserAccessPolicy(email, policies = []) {
  const normalizedEmail = normalizePolicyEmail(email);
  if (!normalizedEmail || !Array.isArray(policies)) return null;
  const policy = policies
    .map(sanitizeUserAccessPolicy)
    .find((entry) => entry?.email === normalizedEmail);
  return policy || null;
}

function findEmailPolicy(email, policies = []) {
  return findUserAccessPolicy(email, policies);
}

function constrainOptions(options, allowed) {
  if (!Array.isArray(options) || !options.length) return [];
  if (!Array.isArray(allowed) || !allowed.length) return options;
  const constrained = options.filter((option) => allowed.includes(option));
  return constrained.length ? constrained : options;
}

function userPolicyHasDataScope(policy) {
  return Boolean(policy?.dsaId || policy?.agentId);
}

function appMatchesUserPolicy(app, policy) {
  if (!userPolicyHasDataScope(policy)) return true;
  if (policy.agentId) return app.agentId === policy.agentId;
  return app.dsaId === policy.dsaId;
}

function scopeApplicationsForPolicy(apps, policy) {
  return Array.isArray(apps) ? apps.filter((app) => appMatchesUserPolicy(app, policy)) : [];
}

function formatBytes(bytes = 0) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location permission is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission is required before capturing geo evidence.'
          : error.message || 'Unable to read location.';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function applyLeadPolicy(form, policy, dropdownOptions, rules) {
  const allowedLoanAmounts = constrainOptions(dropdownOptions.loanAmounts, policy?.loanAmounts);
  const allowedTenures = constrainOptions(rules.tenures, policy?.tenures);
  const allowedBatteryModels = constrainOptions(dropdownOptions.batteryModels, policy?.batteryModels);
  const allowedCompanyMakes = constrainOptions(dropdownOptions.companyMakes, policy?.companyMakes);
  const minInterestRate = Math.max(
    MIN_LOAN_INTEREST_RATE,
    Number.isFinite(policy?.minInterestRate) ? policy.minInterestRate : MIN_LOAN_INTEREST_RATE
  );
  const maxInterestRate = Math.max(
    minInterestRate,
    Math.min(
      MAX_LOAN_INTEREST_RATE,
      Number.isFinite(policy?.maxInterestRate) ? policy.maxInterestRate : MAX_LOAN_INTEREST_RATE
    )
  );

  return {
    ...form,
    amount: Number(form.amount) || 0,
    tenure: allowedTenures.includes(Number(form.tenure)) ? Number(form.tenure) : allowedTenures[0],
    interestRate: Math.min(maxInterestRate, Math.max(minInterestRate, Number(form.interestRate || DEFAULT_LOAN_INTEREST_RATE))),
    companyMake: allowedCompanyMakes.includes(form.companyMake) ? form.companyMake : allowedCompanyMakes[0],
    batteryModel: allowedBatteryModels.includes(form.batteryModel) ? form.batteryModel : allowedBatteryModels[0],
    dsaId: policy?.dsaId || form.dsaId,
    agentId: policy?.agentId || form.agentId,
  };
}

function createReferenceContact(overrides = {}) {
  return {
    type: overrides.type || 'Family',
    name: overrides.name || '',
    contactNo: overrides.contactNo || '',
    address: overrides.address || '',
  };
}

function emiFor(amount, tenure, rate = PRODUCT_RULES.annualFlatRate) {
  const principal = Number(amount || 0);
  const months = Number(tenure || 1);
  const interest = principal * rate * months / 12;
  return Math.round((principal + interest) / months);
}

function weeklyEmiFor(amount, tenure, rate = PRODUCT_RULES.annualFlatRate) {
  return Math.round(emiFor(amount, tenure, rate) * 12 / 52);
}

function dailyEmiFor(amount, tenure, rate = PRODUCT_RULES.annualFlatRate) {
  return Math.round(emiFor(amount, tenure, rate) * 12 / 365);
}

function repaymentAmountFor(frequency, amount, tenure, rate = PRODUCT_RULES.annualFlatRate) {
  if (frequency === 'Weekly') return weeklyEmiFor(amount, tenure, rate);
  if (frequency === 'Monthly') return emiFor(amount, tenure, rate);
  return dailyEmiFor(amount, tenure, rate);
}

function totalPayable(amount, tenure, rate = PRODUCT_RULES.annualFlatRate) {
  return emiFor(amount, tenure, rate) * Number(tenure || 0);
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function parseFormattedNumber(value) {
  const number = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function formatNumberInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? new Intl.NumberFormat('en-IN').format(Number(digits)) : '';
}

function normalizeAadhaarInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 12);
}

function nextLoanNumber(apps = []) {
  let maxSeq = 0;
  const pattern = /^APP-(\d+)$/i;
  for (const app of apps) {
    const match = pattern.exec(String(app?.id || ''));
    if (match) {
      const value = parseInt(match[1], 10);
      if (Number.isFinite(value) && value > maxSeq) maxSeq = value;
    }
  }
  return `APP-${String(maxSeq + 1).padStart(3, '0')}`;
}

function maskAadhaarTyping(digits) {
  const clean = String(digits || '');
  if (clean.length <= 4) return clean;
  return 'X'.repeat(clean.length - 4) + clean.slice(-4);
}

function normalizePanInput(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read selected image.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Selected file is not a valid image.'));
    image.src = dataUrl;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to process image.'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

async function compressImageToLimit(file, maxBytes = 100 * 1024) {
  const sourceUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(sourceUrl);
  const outputName = String(file.name || `image-${Date.now()}.jpg`).replace(/\.[^.]+$/, '.jpg');

  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;
  const maxDimension = 1600;
  const largestEdge = Math.max(width, height);
  if (largestEdge > maxDimension) {
    const scale = maxDimension / largestEdge;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to prepare image compression.');

  let lastBlob = null;
  for (let resizePass = 0; resizePass < 5; resizePass += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      lastBlob = blob;
      if (blob.size <= maxBytes) {
        const dataUrl = await readFileAsDataUrl(blob);
        return {
          name: outputName,
          size: blob.size,
          type: blob.type,
          dataUrl,
          originalSize: file.size,
          width,
          height,
        };
      }
    }

    width = Math.max(1, Math.round(width * 0.82));
    height = Math.max(1, Math.round(height * 0.82));
  }

  if (!lastBlob) throw new Error('Unable to compress selected image.');
  const fallbackDataUrl = await readFileAsDataUrl(lastBlob);
  return {
    name: outputName,
    size: lastBlob.size,
    type: lastBlob.type,
    dataUrl: fallbackDataUrl,
    originalSize: file.size,
    width,
    height,
  };
}

function slugCode(value, prefix = 'OPT') {
  const slug = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);
  return `${prefix}-${slug || Math.floor(Date.now() / 1000)}`;
}

function localMobileDigits(value) {
  const text = String(value || '');
  const digits = String(value || '').replace(/\D/g, '');
  const hasDialCode = text.trim().startsWith(INDIA_DIAL_CODE) || text.trim().startsWith('91 ');
  return (hasDialCode && digits.startsWith('91') ? digits.slice(2) : digits).slice(0, 10);
}

function formatIndianMobile(value) {
  const localNumber = localMobileDigits(value);
  return localNumber ? `${INDIA_DIAL_CODE} ${localNumber}` : `${INDIA_DIAL_CODE} `;
}

function today(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function addMonthsToDate(value, months = 1) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) return today(30);
  const day = base.getDate();
  base.setMonth(base.getMonth() + months);
  if (base.getDate() !== day) base.setDate(0);
  return base.toISOString().slice(0, 10);
}

function isPastDate(value) {
  return Boolean(value) && value < today();
}

function maskAadhaar(value) {
  const digits = normalizeAadhaarInput(value);
  return digits.length >= 4 ? `XXXX-XXXX-${digits.slice(-4)}` : 'XXXX-XXXX-0000';
}

function panValid(value) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(value || '').toUpperCase());
}

function todayForDob(yearsAgo = 30) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearsAgo);
  return date.toISOString().slice(0, 10);
}

function panIsValidFlag(result) {
  if (!result) return false;
  const status = String(result.status || result.valid || '').toUpperCase();
  if (status === 'VALID' || status === 'TRUE' || status === 'Y' || status === 'YES') return true;
  if (status === 'INVALID' || status === 'FALSE' || status === 'N' || status === 'NO') return false;
  const legacy = String(result.pan_status || '').toUpperCase();
  return legacy ? isPanStatusAcceptable(legacy) : false;
}

function panAadhaarLinked(result) {
  if (!result) return false;
  if (typeof result.aadhaar_linked === 'boolean') return result.aadhaar_linked;
  const str = String(result.aadhaar_linked || result.aadhaar_seeding_status || '').toUpperCase();
  return ['TRUE', 'Y', 'YES', 'LINKED'].includes(str);
}

function panSeedingStatus(result) {
  if (!result) return '';
  if (typeof result.aadhaar_linked === 'boolean') return result.aadhaar_linked ? 'Linked' : 'Not linked';
  return String(result.aadhaar_seeding_status || result.seeding_status || '').toUpperCase();
}

function panSeedingOk(result) {
  if (!result) return true;
  if (typeof result.aadhaar_linked === 'boolean') return result.aadhaar_linked;
  const status = String(result.aadhaar_seeding_status || result.seeding_status || '').toUpperCase();
  if (!status) return true;
  return ['Y', 'YES', 'LINKED', 'SUCCESS', 'TRUE'].includes(status);
}

function panMaskedAadhaar(result) {
  return result?.masked_aadhaar_number || result?.masked_aadhaar || result?.aadhaar_number || '';
}

function panRegisteredName(result) {
  return result?.registered_name || result?.name_pan_card || result?.name_on_pan || '';
}

function panMobile(result) {
  return result?.mobile_number || result?.phone_number || '';
}

function panDob(result) {
  return result?.date_of_birth || result?.dob || '';
}

function normalizePanName(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
}

function panNameMatches(result, providedName = '') {
  const provided = normalizePanName(providedName);
  if (!provided) return true;
  const registered = normalizePanName(result?.registered_name || result?.name_pan_card || '');
  if (!registered) return true;
  return registered.includes(provided) || provided.includes(registered);
}

function panResultVerdict(result, providedName = '') {
  if (!result) return false;
  return panIsValidFlag(result) && panNameMatches(result, providedName);
}

function panResultReason(result, providedName = '') {
  if (!result) return 'No PAN result returned by provider';
  const issues = [];
  if (!panIsValidFlag(result)) {
    const status = String(result.pan_status || '').toUpperCase();
    issues.push(status ? describePanStatus(status) : (result.message || 'PAN reported invalid by Cashfree'));
  }
  if (!panNameMatches(result, providedName)) {
    issues.push(`name mismatch (PAN registered as ${result?.registered_name || 'unknown'})`);
  }
  return issues.length ? issues.join(', ') : 'PAN verified successfully';
}

function formatPanAddress(address) {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (address.full_address) return address.full_address;
  const parts = [
    address.line_1 || address.line1,
    address.line_2 || address.line2,
    address.street || address.street_name,
    address.locality,
    address.city,
    address.district,
    address.state,
    address.country,
    address.pincode || address.pin || address.zip,
  ].filter(Boolean);
  return address.full || parts.join(', ');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result, name: file.name, type: file.type });
    reader.onerror = () => reject(new Error('Unable to read selected image.'));
    reader.readAsDataURL(file);
  });
}

function cashfreeValidStatus(result) {
  return String(result?.status || '').toUpperCase() === 'VALID';
}

function cashfreeLivenessPassed(result) {
  return String(result?.liveness || result?.liveness_result || '').toUpperCase() === 'YES';
}

function cashfreeBankAccountValid(result) {
  const status = String(result?.account_status || '').toUpperCase();
  const code = String(result?.account_status_code || '').toUpperCase();
  if (status) return status === 'VALID';
  return code === 'ACCOUNT_IS_VALID';
}

function makeSchedule(amount, tenure, disbursedAt = today(), rate = PRODUCT_RULES.annualFlatRate) {
  const emi = emiFor(amount, tenure, rate);
  return Array.from({ length: Number(tenure) }, (_, index) => {
    const due = new Date(disbursedAt);
    due.setMonth(due.getMonth() + index + 1);
    return {
      id: `EMI-${String(index + 1).padStart(2, '0')}`,
      dueDate: due.toISOString().slice(0, 10),
      amount: emi,
      paidAmount: index === 0 ? emi : 0,
      status: index === 0 ? 'Paid' : 'Due',
      dpd: 0,
    };
  });
}

function makeScheduleFromFirstEmi(amount, tenure, firstEmiDate = today(), rate = PRODUCT_RULES.annualFlatRate) {
  const emi = emiFor(amount, tenure, rate);
  return Array.from({ length: Number(tenure) }, (_, index) => {
    const due = new Date(firstEmiDate || today());
    due.setMonth(due.getMonth() + index);
    return {
      id: `EMI-${String(index + 1).padStart(2, '0')}`,
      dueDate: due.toISOString().slice(0, 10),
      amount: emi,
      paidAmount: index === 0 ? emi : 0,
      status: index === 0 ? 'Paid' : 'Due',
      dpd: 0,
    };
  });
}

function createAudit(action, actor = 'Master Console', detail = '') {
  return { at: new Date().toLocaleString('en-IN'), action, actor, detail };
}

function normalizeFollowupHistory(history, fallback = {}) {
  const entries = Array.isArray(history) ? history : [];
  const normalized = entries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      at: entry.at || entry.createdAt || '',
      actor: entry.actor || 'System',
      action: entry.action || (entry.closed ? 'Followup closed' : 'Followup updated'),
      nextDate: entry.nextDate || fallback.nextDate || '',
      remark: entry.remark || '',
      closed: Boolean(entry.closed),
    }))
    .filter((entry) => entry.at || entry.remark || entry.nextDate || entry.closed);

  if (!normalized.length && fallback.remark) {
    return [{
      at: fallback.closedAt || fallback.nextDate || '',
      actor: 'System',
      action: fallback.closed ? 'Followup closed' : 'Followup updated',
      nextDate: fallback.nextDate || '',
      remark: fallback.remark,
      closed: Boolean(fallback.closed),
    }];
  }

  return normalized;
}

function normalizeFollowup(followup = {}, fallbackDate = today()) {
  const source = followup && typeof followup === 'object' ? followup : {};
  const base = {
    nextDate: source.nextDate || fallbackDate || today(),
    remark: source.remark || '',
    closed: Boolean(source.closed),
    closedAt: source.closedAt || '',
  };
  return {
    ...base,
    history: normalizeFollowupHistory(source.history, base),
  };
}

function createFollowupHistoryEntry(followup, actor = 'Master Console') {
  return {
    at: new Date().toLocaleString('en-IN'),
    actor,
    action: followup.closed ? 'Followup closed' : 'Followup updated',
    nextDate: followup.nextDate || '',
    remark: followup.remark || '',
    closed: Boolean(followup.closed),
  };
}

function resolveRole(role, email = '') {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'MASTER') return 'SUPER_ADMIN';
  if (ROLES.includes(normalized)) return normalized;
  return isMasterEmail(email) ? 'SUPER_ADMIN' : 'DSA';
}

function fallbackName(email) {
  const handle = String(email || '').split('@')[0];
  if (!handle) return 'Dhanurja User';
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function customerCodeFor(name, dateValue = new Date(), existingCodes = []) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const year = safeDate.getFullYear();
  const initials = String(name || '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, 'X');

  // Per-initials running sequence: increments each time the same 2-letter
  // initials repeats, never resets across months or years.
  const seqPattern = new RegExp(`/(\\d{2})/${initials}$`);
  let maxSeq = 0;
  if (Array.isArray(existingCodes)) {
    for (const code of existingCodes) {
      const match = seqPattern.exec(String(code || ''));
      if (match) {
        const value = parseInt(match[1], 10);
        if (Number.isFinite(value) && value > maxSeq) maxSeq = value;
      }
    }
  }
  const seq = String(maxSeq + 1).padStart(2, '0');

  return `${month}/${year}/${seq}/${initials}`;
}

function normalizeKycMarkings(kyc = {}) {
  const attempts = rowNumber(kyc.attempts);
  const reason = String(kyc.reason || '');
  const pan = kyc.pan === 'Failed' && attempts === 0 && reason.toLowerCase() === 'pan format invalid'
    ? 'Pending'
    : kyc.pan || 'Pending';

  return {
    aadhaar: kyc.aadhaar || 'Pending',
    pan,
    liveness: kyc.liveness || 'Pending',
    attempts,
    reason: pan === 'Pending' && attempts === 0 && reason.toLowerCase() === 'pan format invalid' ? '' : reason,
  };
}

function createApplicationRecord(overrides) {
  const amount = overrides.amount;
  const tenure = overrides.tenure;
  const rate = rowNumber(overrides.rate, PRODUCT_RULES.annualFlatRate);
  const emi = emiFor(amount, tenure, rate);
  const schedule = overrides.disbursedAt ? makeSchedule(amount, tenure, overrides.disbursedAt, rate) : [];
  return {
    id: overrides.id,
    leadId: overrides.leadId,
    customerCode: overrides.customerCode || customerCodeFor(overrides.customer, overrides.createdAt),
    customer: overrides.customer,
    mobile: overrides.mobile,
    createdAt: overrides.createdAt || today(),
    firstEmiDate: overrides.firstEmiDate || '',
    loanRemark: overrides.loanRemark || '',
    pincode: overrides.pincode || '',
    aadhaar: overrides.aadhaar || '',
    pan: overrides.pan || '',
    dob: overrides.dob || todayForDob(32),
    fatherName: overrides.fatherName || '',
    dsaId: overrides.dsaId,
    agentId: overrides.agentId,
    source: overrides.source || 'Agent',
    repaymentFrequency: overrides.repaymentFrequency || 'Daily',
    companyMake: overrides.companyMake || COMPANY_MAKE_OPTIONS[0],
    batteryModel: overrides.batteryModel || BATTERY_MODEL_OPTIONS[0],
    vehicleDetails: overrides.vehicleDetails || {},
    bankDetails: overrides.bankDetails || {},
    ovd: overrides.ovd || { dlNumber: '', dlDob: '', epicNumber: '', voterName: '', vehicleNumber: '' },
    referenceContacts: Array.isArray(overrides.referenceContacts) && overrides.referenceContacts.length
      ? overrides.referenceContacts.map(createReferenceContact)
      : [createReferenceContact()],
    monthlyExpense: overrides.monthlyExpense || 0,
    livingAddress: overrides.livingAddress || '',
    livingSince: overrides.livingSince || '',
    residenceType: overrides.residenceType || '',
    ownershipType: overrides.ownershipType || '',
    electricityBills: Array.isArray(overrides.electricityBills) ? overrides.electricityBills : [],
    itrImages: Array.isArray(overrides.itrImages) ? overrides.itrImages : [],
    aadhaarImages: Array.isArray(overrides.aadhaarImages) ? overrides.aadhaarImages : [],
    invoiceAmount: amount,
    amount,
    tenure,
    rate,
    emi,
    totalPayable: totalPayable(amount, tenure, rate),
    monthlyIncome: overrides.monthlyIncome || 0,
    existingEmi: overrides.existingEmi || 0,
    status: overrides.status,
    stage: overrides.stage,
    risk: overrides.risk || 'To Review',
    leadStatus: overrides.leadStatus || 'New',
    followup: normalizeFollowup(overrides.followup, overrides.createdAt || today()),
    kyc: normalizeKycMarkings(overrides.kyc),
    tvr: overrides.tvr || { status: 'Pending', audioName: '', audioUrl: '', answers: {}, remarks: '', completedAt: '' },
    aadhaarVerification: overrides.aadhaarVerification || null,
    panVerification: overrides.panVerification || null,
    drivingLicenseVerification: overrides.drivingLicenseVerification || null,
    voterIdVerification: overrides.voterIdVerification || null,
    vehicleRcVerification: overrides.vehicleRcVerification || null,
    faceLivenessVerification: overrides.faceLivenessVerification || null,
    bankAccountVerification: overrides.bankAccountVerification || null,
    documents: Object.fromEntries(documentTypes.map((doc) => [doc, overrides.documents?.[doc] || false])),
    geo: overrides.geo || { status: 'Pending', lat: '', lng: '', photo: false, evidencePhotos: [] },
    credit: overrides.credit || { bureauScore: 0, scorecard: 0, foir: 0, decision: 'Pending', reason: '', referred: false },
    sanction: overrides.sanction || { generated: false, kfsAccepted: false, acceptedAt: '', validity: today(30) },
    nach: overrides.nach || { accountMasked: '', ifsc: '', bank: '', pennyDrop: 'Pending', mandate: 'Pending' },
    disbursement: overrides.disbursement || { beneficiary: 'Customer', status: 'Pending', utr: '', releasedAt: '', slaDue: '' },
    servicing: overrides.servicing || { loanAccountNo: '', outstanding: totalPayable(amount, tenure, rate), dpd: 0, bucket: 'Current', schedule },
    collections: overrides.collections || { assignedTo: '', action: '', ptpDate: '', npaMarked: false },
    audit: overrides.audit || [createAudit('Application created', 'System', overrides.stage)],
  };
}

const operationalApplications = [];
const APPLICATION_CACHE_KEY = 'dhanurja-lead-applications-v1';
const SESSION_CACHE_KEY = 'dhanurja-session-v1';

function loadCachedSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.email) return parsed;
    return null;
  } catch (error) {
    return null;
  }
}

function saveCachedSession(session) {
  try {
    if (session && session.email) {
      window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch (error) {
    /* ignore */
  }
}
const LEAD_FORM_DRAFT_KEY = 'dhanurja-lead-form-draft-v1';
const TARGET_CACHE_KEY = 'dhanurja-dsa-agent-targets-v1';
const DEFAULT_TARGET = {
  leadTarget: 25,
  disbursementTarget: 10,
  amountTarget: 500000,
};

function loadCachedApplications() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(APPLICATION_CACHE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.map((app) => ({
        ...app,
        kyc: normalizeKycMarkings(app.kyc),
        followup: normalizeFollowup(app.followup, app.createdAt || today()),
      }))
      : [];
  } catch (error) {
    console.error('Unable to read cached lead applications', error);
    return [];
  }
}

function stripFileDataUrls(files) {
  if (!Array.isArray(files)) return files;
  return files.map((file) => {
    if (!file || typeof file !== 'object') return file;
    const { dataUrl: _dataUrl, ...rest } = file;
    return rest;
  });
}

function saveCachedApplications(apps) {
  try {
    const slim = (Array.isArray(apps) ? apps : []).map((app) => ({
      ...app,
      electricityBills: stripFileDataUrls(app.electricityBills),
      itrImages: stripFileDataUrls(app.itrImages),
      aadhaarImages: stripFileDataUrls(app.aadhaarImages),
    }));
    window.localStorage.setItem(APPLICATION_CACHE_KEY, JSON.stringify(slim));
  } catch (error) {
    console.error('Unable to cache lead applications', error);
  }
}

function loadCachedTargets() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TARGET_CACHE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error('Unable to read cached DSA and agent targets', error);
    return {};
  }
}

function saveCachedTargets(targets) {
  try {
    window.localStorage.setItem(TARGET_CACHE_KEY, JSON.stringify(targets));
  } catch (error) {
    console.error('Unable to cache DSA and agent targets', error);
  }
}

function mergeCachedLeadExtras(apps, cachedApps = loadCachedApplications()) {
  const cachedById = new Map(cachedApps.map((app) => [app.id, app]));
  return apps.map((app) => {
    const cached = cachedById.get(app.id);
    if (!cached) return app;
    return {
      ...app,
      electricityBills: app.electricityBills?.length ? app.electricityBills : cached.electricityBills || [],
      itrImages: app.itrImages?.length ? app.itrImages : cached.itrImages || [],
      aadhaarImages: app.aadhaarImages?.length ? app.aadhaarImages : cached.aadhaarImages || [],
      vehicleDetails: app.vehicleDetails && Object.keys(app.vehicleDetails).length ? app.vehicleDetails : cached.vehicleDetails || {},
      bankDetails: app.bankDetails && Object.keys(app.bankDetails).length ? app.bankDetails : cached.bankDetails || {},
      ovd: app.ovd && Object.values(app.ovd).some(Boolean) ? app.ovd : cached.ovd || app.ovd || { dlNumber: '', dlDob: '', epicNumber: '', voterName: '', vehicleNumber: '' },
      panVerification: app.panVerification || cached.panVerification || null,
      drivingLicenseVerification: app.drivingLicenseVerification || cached.drivingLicenseVerification || null,
      voterIdVerification: app.voterIdVerification || cached.voterIdVerification || null,
      vehicleRcVerification: app.vehicleRcVerification || cached.vehicleRcVerification || null,
      faceLivenessVerification: app.faceLivenessVerification || cached.faceLivenessVerification || null,
      bankAccountVerification: app.bankAccountVerification || cached.bankAccountVerification || null,
      referenceContacts: app.referenceContacts?.length ? app.referenceContacts : cached.referenceContacts || [createReferenceContact()],
      monthlyExpense: app.monthlyExpense || cached.monthlyExpense || 0,
      livingAddress: app.livingAddress || cached.livingAddress || '',
      livingSince: app.livingSince || cached.livingSince || '',
      residenceType: app.residenceType || cached.residenceType || '',
      ownershipType: app.ownershipType || cached.ownershipType || '',
      followup: normalizeFollowup(app.followup || cached.followup, app.createdAt || cached.createdAt || today()),
      audit: app.audit?.length ? app.audit : cached.audit || app.audit,
    };
  });
}

function isDraftApplication(app) {
  return [app?.stage, app?.status, app?.leadStatus].some((value) => String(value || '').toLowerCase() === 'draft');
}

async function persistLeadApplication(app, form) {
  const customerPayload = {
    customer_code: app.customerCode,
    full_name: app.customer,
    phone: app.mobile,
    aadhaar_masked: app.aadhaar,
    pan: app.pan,
    father_name: app.fatherName || null,
    dob: app.dob || null,
    dsa_id: app.dsaId || null,
  };

  async function insertCustomerWithFallback(payload) {
    const attempt = await supabase
      .from('customers')
      .insert(payload)
      .select('id')
      .single();
    if (!attempt.error) return attempt;
    const message = String(attempt.error.message || '');
    for (const column of ['father_name', 'dob', 'customer_code']) {
      if (message.includes(column) && column in payload) {
        const { [column]: _drop, ...rest } = payload;
        return insertCustomerWithFallback(rest);
      }
    }
    return attempt;
  }

  const inserted = await insertCustomerWithFallback(customerPayload);
  const customer = inserted.data;
  if (inserted.error) throw inserted.error;

  const loanApplicationPayload = {
    loan_number: app.id,
    customer_id: customer.id,
    dsa_id: app.dsaId || null,
    product: PRODUCT_RULES.product,
    amount: app.amount,
    tenure: app.tenure,
    emi: app.emi,
    annual_flat_rate: app.rate,
    stage: app.stage,
    risk: app.risk,
    documents_count: 0,
    documents_total: documentTypes.length,
  };

  let { data: loan, error: loanError } = await supabase
    .from('loan_applications')
    .insert(loanApplicationPayload)
    .select('id')
    .single();

  if (loanError && String(loanError.message || '').includes('annual_flat_rate')) {
    const { annual_flat_rate: _unused, ...legacyPayload } = loanApplicationPayload;
    const fallback = await supabase
      .from('loan_applications')
      .insert(legacyPayload)
      .select('id')
      .single();
    loan = fallback.data;
    loanError = fallback.error;
  }

  if (loanError) {
    await supabase.from('customers').delete().eq('id', customer.id);
    throw loanError;
  }

  const leadPayload = {
    lead_number: app.leadId,
    customer_name: app.customer,
    mobile: app.mobile,
    source: app.source,
    dsa_id: app.dsaId || null,
    agent_id: app.agentId || null,
    requested_amount: app.amount,
    requested_tenure: app.tenure,
    company_make: app.companyMake,
    battery_model: app.batteryModel,
    repayment_frequency: app.repaymentFrequency || 'Daily',
    status: app.leadStatus,
    followup_date: app.followup?.nextDate || app.createdAt || today(),
    followup_remark: app.followup?.remark || null,
    followup_closed: Boolean(app.followup?.closed),
    followup_closed_at: app.followup?.closedAt || null,
    followup_history: app.followup?.history || [],
    converted_application_id: loan.id,
  };

  const kycPayload = {
    aadhaar_status: app.kyc.aadhaar,
    pan_status: app.kyc.pan,
    liveness_status: app.kyc.liveness,
    failure_reason: app.kyc.reason || null,
    attempts: app.kyc.attempts,
    pan_verification: app.panVerification || null,
    secure_id_verifications: collectSecureIdVerifications(app),
    ovd: app.ovd || null,
  };
  const underwritingPayload = {
    net_monthly_income: parseFormattedNumber(form.monthlyIncome),
    existing_emi: parseFormattedNumber(form.existingEmi),
    new_emi: app.emi,
    decision: 'Pending',
  };

  const loanUpdatePayload = {
    kyc: kycPayload,
    underwriting: underwritingPayload,
    reference_contacts: Array.isArray(app.referenceContacts) ? app.referenceContacts : [],
  };

  let loanUpdate = await supabase
    .from('loan_applications')
    .update(loanUpdatePayload)
    .eq('id', loan.id);

  if (loanUpdate.error && String(loanUpdate.error.message || '').includes('reference_contacts')) {
    const { reference_contacts: _unused, ...legacyUpdate } = loanUpdatePayload;
    loanUpdate = await supabase
      .from('loan_applications')
      .update(legacyUpdate)
      .eq('id', loan.id);
  }

  const results = await Promise.all([
    insertLeadRow(leadPayload),
    Promise.resolve(loanUpdate),
  ]);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
}

function isMissingLeadsTableError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();
  const code = String(error.code || '');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    (message.includes('leads') && (message.includes('schema cache') || message.includes('does not exist'))) ||
    (details.includes('leads') && details.includes('does not exist'))
  );
}

const SECURE_ID_KEYS = [
  'drivingLicenseVerification',
  'voterIdVerification',
  'vehicleRcVerification',
  'faceLivenessVerification',
  'bankAccountVerification',
];

function collectSecureIdVerifications(app) {
  const collected = {};
  let hasAny = false;
  for (const key of SECURE_ID_KEYS) {
    if (app[key]) {
      collected[key] = app[key];
      hasAny = true;
    }
  }
  return hasAny ? collected : null;
}

const kycPersistQueue = new Map();

async function persistKycUpdate(app) {
  if (!isSupabaseConfigured || !supabase || !app?.id) return;
  const prev = kycPersistQueue.get(app.id) || Promise.resolve();
  const next = prev.catch(() => {}).then(async () => {
    const kycPayload = {
      aadhaar_status: app.kyc?.aadhaar || 'Pending',
      pan_status: app.kyc?.pan || 'Pending',
      liveness_status: app.kyc?.liveness || 'Pending',
      failure_reason: app.kyc?.reason || null,
      attempts: app.kyc?.attempts || 0,
      pan_verification: app.panVerification || null,
      secure_id_verifications: collectSecureIdVerifications(app),
      ovd: app.ovd || null,
    };
    const { error } = await supabase
      .from('loan_applications')
      .update({ kyc: kycPayload })
      .eq('loan_number', app.id);
    if (error) throw error;
  });
  kycPersistQueue.set(app.id, next.finally(() => {
    if (kycPersistQueue.get(app.id) === next) kycPersistQueue.delete(app.id);
  }));
  return next;
}

const appPersistQueue = new Map();

function buildApplicationUpdatePayload(app) {
  const kycPayload = {
    aadhaar_status: app.kyc?.aadhaar || 'Pending',
    pan_status: app.kyc?.pan || 'Pending',
    liveness_status: app.kyc?.liveness || 'Pending',
    failure_reason: app.kyc?.reason || null,
    attempts: app.kyc?.attempts || 0,
    pan_verification: app.panVerification || null,
    secure_id_verifications: collectSecureIdVerifications(app),
    ovd: app.ovd || null,
  };
  const docsPayload = {};
  Object.entries(app.documents || {}).forEach(([type, value]) => {
    docsPayload[type] = { status: value ? 'Verified' : 'Pending' };
  });
  const completedDocs = Object.values(app.documents || {}).filter(Boolean).length;
  const sanctionPayload = {
    id: app.sanction?.generated ? (app.sanction.id || app.id) : null,
    kfs_accepted: Boolean(app.sanction?.kfsAccepted),
    accepted_at: app.sanction?.acceptedAt || null,
    created_at: app.sanction?.validity || null,
  };
  const nachPayload = {
    account_masked: app.nach?.accountMasked || null,
    ifsc: app.nach?.ifsc || null,
    bank_name: app.nach?.bank || null,
    penny_drop_status: app.nach?.pennyDrop || 'Pending',
    mandate_status: app.nach?.mandate || 'Pending',
  };
  const disbursementPayload = {
    beneficiary_type: app.disbursement?.beneficiary || null,
    status: app.disbursement?.status || 'Pending',
    utr: app.disbursement?.utr || null,
    released_at: app.disbursement?.releasedAt || null,
    sla_due_at: app.disbursement?.slaDue || null,
  };
  const accountPayload = {
    loan_account_number: app.servicing?.loanAccountNo || null,
    outstanding: Number(app.servicing?.outstanding || 0),
    current_dpd: Number(app.servicing?.dpd || 0),
    dpd_bucket: app.servicing?.bucket || 'Current',
    annual_flat_rate: Number(app.rate || 0),
    status: app.status || null,
  };
  const emiSchedulePayload = (app.servicing?.schedule || []).map((emi, idx) => ({
    installment_number: idx + 1,
    due_date: emi.dueDate || null,
    emi_amount: Number(emi.amount || 0),
    paid_amount: Number(emi.paidAmount || 0),
    status: emi.status || 'Due',
    dpd: Number(emi.dpd || 0),
  }));
  const collectionsLog = Array.isArray(app.collections?.log) ? app.collections.log : [];
  const collectionsPayload = {
    log: collectionsLog.map((entry) => ({
      id: entry.id,
      assigned_to: entry.assignedTo || '',
      action_type: entry.actionType || '',
      notes: entry.notes || '',
      dpd: Number(entry.dpd || 0),
      bucket: entry.bucket || '',
      ptp_date: entry.ptpDate || null,
      npa_marked: Boolean(entry.npaMarked),
      created_at: entry.createdAt || null,
    })),
  };
  const underwritingPayload = {
    net_monthly_income: Number(app.monthlyIncome || 0),
    existing_emi: Number(app.existingEmi || 0),
    new_emi: Number(app.emi || 0),
    bureau_score: Number(app.credit?.bureauScore || 0),
    scorecard_score: Number(app.credit?.scorecard || 0),
    foir: Number(app.credit?.foir || 0),
    decision: app.credit?.decision || 'Pending',
    decision_reason: app.credit?.reason || null,
    referred_to: app.credit?.referred ? true : null,
    checklist: app.credit?.checklist || null,
  };
  return {
    amount: Number(app.amount || 0),
    tenure: Number(app.tenure || 0),
    emi: Number(app.emi || 0),
    annual_flat_rate: Number(app.rate || 0),
    stage: app.stage,
    risk: app.risk || 'To Review',
    geo_status: app.geo?.status || 'Pending',
    documents_count: completedDocs,
    documents_total: documentTypes.length,
    kyc: kycPayload,
    underwriting: underwritingPayload,
    sanction: sanctionPayload,
    nach: nachPayload,
    disbursement: disbursementPayload,
    account: accountPayload,
    emi_schedule: emiSchedulePayload,
    collections: collectionsPayload,
    docs: docsPayload,
    reference_contacts: Array.isArray(app.referenceContacts) ? app.referenceContacts : [],
    extras: buildApplicationExtrasPayload(app),
    audit_log: Array.isArray(app.audit) ? app.audit.slice(0, 200) : [],
    updated_at: new Date().toISOString(),
  };
}

function buildApplicationExtrasPayload(app) {
  return {
    vehicleDetails: app.vehicleDetails && typeof app.vehicleDetails === 'object' ? app.vehicleDetails : {},
    bankDetails: app.bankDetails && typeof app.bankDetails === 'object' ? app.bankDetails : {},
    monthlyExpense: Number(app.monthlyExpense || 0),
    livingAddress: app.livingAddress || '',
    livingSince: app.livingSince || '',
    residenceType: app.residenceType || '',
    ownershipType: app.ownershipType || '',
    electricityBills: stripFileDataUrls(app.electricityBills) || [],
    itrImages: stripFileDataUrls(app.itrImages) || [],
    aadhaarImages: stripFileDataUrls(app.aadhaarImages) || [],
    loanRemark: app.loanRemark || '',
    firstEmiDate: app.firstEmiDate || '',
    leadStatus: app.leadStatus || '',
    pincode: app.pincode || '',
    geo: app.geo && typeof app.geo === 'object'
      ? { lat: app.geo.lat || '', lng: app.geo.lng || '', photo: Boolean(app.geo.photo), evidencePhotos: app.geo.evidencePhotos || [] }
      : {},
  };
}

const APPLICATION_OPTIONAL_COLUMNS = [
  'reference_contacts',
  'annual_flat_rate',
  'docs',
  'emi_schedule',
  'collections',
  'sanction',
  'nach',
  'disbursement',
  'account',
  'underwriting',
  'kyc',
  'geo_status',
  'extras',
  'audit_log',
];

const LEAD_OPTIONAL_COLUMNS = [
  'followup_history',
  'repayment_frequency',
  'company_make',
  'battery_model',
];

const CUSTOMER_OPTIONAL_COLUMNS = [
  'father_name',
  'dob',
  'customer_code',
];

async function persistLeadUpdate(app) {
  if (!isSupabaseConfigured || !supabase || !app?.leadId) return;
  let payload = {
    customer_name: app.customer,
    mobile: app.mobile,
    source: app.source,
    dsa_id: app.dsaId || null,
    agent_id: app.agentId || null,
    requested_amount: Number(app.amount || 0),
    requested_tenure: Number(app.tenure || 0),
    company_make: app.companyMake || null,
    battery_model: app.batteryModel || null,
    repayment_frequency: app.repaymentFrequency || 'Daily',
    status: app.leadStatus || null,
    updated_at: new Date().toISOString(),
  };
  let attempts = 0;
  while (attempts < LEAD_OPTIONAL_COLUMNS.length + 1) {
    const result = await supabase.from('leads').update(payload).eq('lead_number', app.leadId);
    if (!result.error) return;
    if (isMissingLeadsTableError(result.error)) return;
    const message = String(result.error.message || '');
    const culprit = LEAD_OPTIONAL_COLUMNS.find((col) => message.includes(col) && col in payload);
    if (!culprit) throw result.error;
    const { [culprit]: _drop, ...rest } = payload;
    payload = rest;
    attempts += 1;
  }
}

async function persistCustomerUpdate(app) {
  if (!isSupabaseConfigured || !supabase || !app?.customerCode) return;
  let payload = {
    full_name: app.customer,
    phone: app.mobile,
    aadhaar_masked: app.aadhaar,
    pan: app.pan,
    father_name: app.fatherName || null,
    dob: app.dob || null,
    dsa_id: app.dsaId || null,
  };
  let attempts = 0;
  while (attempts < CUSTOMER_OPTIONAL_COLUMNS.length + 1) {
    const result = await supabase.from('customers').update(payload).eq('customer_code', app.customerCode);
    if (!result.error) return;
    const message = String(result.error.message || '');
    const culprit = CUSTOMER_OPTIONAL_COLUMNS.find((col) => message.includes(col) && col in payload);
    if (!culprit) throw result.error;
    const { [culprit]: _drop, ...rest } = payload;
    payload = rest;
    attempts += 1;
  }
}

async function persistApplicationUpdate(app) {
  if (!isSupabaseConfigured || !supabase || !app?.id) return;
  const prev = appPersistQueue.get(app.id) || Promise.resolve();
  const next = prev.catch(() => {}).then(async () => {
    let payload = buildApplicationUpdatePayload(app);
    let attempts = 0;
    while (attempts < APPLICATION_OPTIONAL_COLUMNS.length + 1) {
      const result = await supabase
        .from('loan_applications')
        .update(payload)
        .eq('loan_number', app.id);
      if (!result.error) break;
      const message = String(result.error.message || '');
      const culprit = APPLICATION_OPTIONAL_COLUMNS.find((col) => message.includes(col) && col in payload);
      if (!culprit) throw result.error;
      const { [culprit]: _drop, ...rest } = payload;
      payload = rest;
      attempts += 1;
    }
    await Promise.all([persistLeadUpdate(app), persistCustomerUpdate(app)]);
  });
  appPersistQueue.set(app.id, next.finally(() => {
    if (appPersistQueue.get(app.id) === next) appPersistQueue.delete(app.id);
  }));
  return next;
}

async function deletePersistedLeadDraft(app) {
  if (!isSupabaseConfigured || !supabase) return;

  const candidateCustomerIds = new Set();

  const { data: loanRows, error: lookupError } = await supabase
    .from('loan_applications')
    .select('id, customer_id')
    .eq('loan_number', app.id);
  if (lookupError) throw lookupError;
  (loanRows || []).forEach((row) => {
    if (row.customer_id) candidateCustomerIds.add(row.customer_id);
  });

  if (app.customerCode) {
    const { data: customerRows, error: customerLookupError } = await supabase
      .from('customers')
      .select('id')
      .eq('customer_code', app.customerCode);
    if (customerLookupError && !String(customerLookupError.message || '').includes('customer_code')) {
      throw customerLookupError;
    }
    (customerRows || []).forEach((row) => {
      if (row.id) candidateCustomerIds.add(row.id);
    });
  }

  if (app.leadId) {
    const { error: leadError } = await supabase
      .from('leads')
      .delete()
      .eq('lead_number', app.leadId);
    if (leadError && !isMissingLeadsTableError(leadError)) throw leadError;
  }

  const { error: loanError } = await supabase
    .from('loan_applications')
    .delete()
    .eq('loan_number', app.id);
  if (loanError) throw loanError;

  for (const customerId of candidateCustomerIds) {
    const { data: remainingLoans, error: remainingLoansError } = await supabase
      .from('loan_applications')
      .select('id')
      .eq('customer_id', customerId)
      .limit(1);
    if (remainingLoansError) throw remainingLoansError;

    if (!remainingLoans?.length) {
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      if (customerError) throw customerError;
    }
  }
}

async function insertLeadRow(payload) {
  const result = await supabase.from('leads').insert(payload);
  if (!result.error) return result;
  if (isMissingLeadsTableError(result.error)) {
    return { data: null, error: null };
  }
  const message = String(result.error.message || '');
  if (!message.includes('followup_') && !message.includes('repayment_frequency')) {
    return result;
  }

  const {
    followup_date: _followupDate,
    followup_remark: _followupRemark,
    followup_closed: _followupClosed,
    followup_closed_at: _followupClosedAt,
    followup_history: _followupHistory,
    repayment_frequency: _repaymentFrequency,
    ...legacyPayload
  } = payload;
  return supabase.from('leads').insert(legacyPayload);
}

function rowNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function rowDate(value, fallback = '') {
  if (!value) return fallback;
  return String(value).slice(0, 10);
}

function firstBy(rows, key, value) {
  return rows.find((row) => row?.[key] === value);
}

function mapById(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

function normalizeStage(stage = 'Lead / Enquiry') {
  const raw = String(stage || '').trim();
  const stageMap = {
    'Lead Created': 'Lead / Enquiry',
    New: 'Lead / Enquiry',
    'KYC Review': 'KYC Check',
    'Docs Pending': 'Login / Application',
    'Application Docs': 'Login / Application',
    'Sanction Approval': 'Sanction & KFS',
    'Sanction Letter': 'Sanction & KFS',
    'Borrower Acceptance': 'Sanction & KFS',
    Disbursement: 'NACH + Disbursement',
    'LMS Active': 'Loan Servicing',
    NPA: 'Closed / NPA',
    Rejected: 'Closed / NPA',
    Closed: 'Closed / NPA',
  };
  return lifecycle.includes(raw) ? raw : stageMap[raw] || raw || 'Lead / Enquiry';
}

function mapProductRules(row) {
  if (!row) return PRODUCT_RULES;
  return {
    product: row.product_name || PRODUCT_RULES.product,
    maxAmount: rowNumber(row.max_amount, PRODUCT_RULES.maxAmount),
    minAmount: rowNumber(row.min_amount, PRODUCT_RULES.minAmount),
    annualFlatRate: rowNumber(row.annual_flat_rate, PRODUCT_RULES.annualFlatRate),
    tenures: Array.isArray(row.allowed_tenures) && row.allowed_tenures.length ? row.allowed_tenures.map(Number) : PRODUCT_RULES.tenures,
    graceDays: rowNumber(row.grace_period_days, PRODUCT_RULES.graceDays),
    npaDpd: rowNumber(row.npa_threshold_dpd, PRODUCT_RULES.npaDpd),
    disbursementSlaHours: rowNumber(row.disbursement_sla_hours, PRODUCT_RULES.disbursementSlaHours),
    foirThreshold: rowNumber(row.foir_threshold, PRODUCT_RULES.foirThreshold),
    minBureauScore: rowNumber(row.min_bureau_score, PRODUCT_RULES.minBureauScore),
    minMonthlyIncome: PRODUCT_RULES.minMonthlyIncome,
  };
}

function documentsFromRow(appRow) {
  const documents = Object.fromEntries(documentTypes.map((doc) => [doc, false]));
  const docs = appRow?.docs && typeof appRow.docs === 'object' ? appRow.docs : null;
  if (docs) {
    Object.entries(docs).forEach(([type, info]) => {
      if (type in documents) {
        const status = info && typeof info === 'object' ? info.status : info;
        documents[type] = !['Pending', 'Rejected', 'Failed'].includes(status);
      }
    });
    return documents;
  }
  if (appRow?.documents_count) {
    documentTypes.slice(0, rowNumber(appRow.documents_count, 0)).forEach((doc) => {
      documents[doc] = true;
    });
  }
  return documents;
}

function mapSupabaseApplication(row, related) {
  const customer = related.customersById.get(row.customer_id);
  const lead = related.leads.find((item) => item.converted_application_id === row.id) || {};
  const kyc = (row.kyc && typeof row.kyc === 'object') ? row.kyc : {};
  const review = (row.underwriting && typeof row.underwriting === 'object') ? row.underwriting : {};
  const sanction = (row.sanction && typeof row.sanction === 'object') ? row.sanction : {};
  const mandate = (row.nach && typeof row.nach === 'object') ? row.nach : {};
  const disbursement = (row.disbursement && typeof row.disbursement === 'object') ? row.disbursement : {};
  const account = (row.account && typeof row.account === 'object') ? row.account : {};
  const collectionsData = (row.collections && typeof row.collections === 'object') ? row.collections : {};
  const allCollections = Array.isArray(collectionsData.log) ? collectionsData.log : [];
  const collection = allCollections[0] || {};
  const schedule = (Array.isArray(row.emi_schedule) ? row.emi_schedule : [])
    .slice()
    .sort((a, b) => rowNumber(a.installment_number) - rowNumber(b.installment_number))
    .map((emi) => ({
      id: `EMI-${String(emi.installment_number).padStart(2, '0')}`,
      dueDate: rowDate(emi.due_date),
      amount: rowNumber(emi.emi_amount),
      paidAmount: rowNumber(emi.paid_amount),
      status: emi.status || 'Due',
      dpd: rowNumber(emi.dpd),
    }));

  const extras = (row.extras && typeof row.extras === 'object' && !Array.isArray(row.extras)) ? row.extras : {};
  const auditLog = Array.isArray(row.audit_log) ? row.audit_log : null;
  const amount = rowNumber(row.amount);
  const tenure = rowNumber(row.tenure, 24);
  const rate = rowNumber(row.annual_flat_rate, rowNumber(account.annual_flat_rate, PRODUCT_RULES.annualFlatRate));
  return createApplicationRecord({
    id: row.loan_number || row.id,
    leadId: lead.lead_number || row.loan_number || row.id,
    referenceContacts: Array.isArray(row.reference_contacts) ? row.reference_contacts : [],
    customerCode: customer?.customer_code || customerCodeFor(customer?.full_name || lead.customer_name || 'Borrower', row.created_at || lead.created_at || customer?.created_at),
    customer: customer?.full_name || lead.customer_name || 'Borrower',
    mobile: customer?.phone || lead.mobile || '',
    pincode: extras.pincode || lead.pincode || '',
    vehicleDetails: extras.vehicleDetails || {},
    bankDetails: extras.bankDetails || {},
    monthlyExpense: rowNumber(extras.monthlyExpense),
    livingAddress: extras.livingAddress || '',
    livingSince: extras.livingSince || '',
    residenceType: extras.residenceType || '',
    ownershipType: extras.ownershipType || '',
    electricityBills: Array.isArray(extras.electricityBills) ? extras.electricityBills : [],
    itrImages: Array.isArray(extras.itrImages) ? extras.itrImages : [],
    aadhaarImages: Array.isArray(extras.aadhaarImages) ? extras.aadhaarImages : [],
    loanRemark: extras.loanRemark || '',
    firstEmiDate: extras.firstEmiDate || '',
    leadStatus: extras.leadStatus || undefined,
    aadhaar: customer?.aadhaar_masked || 'XXXX-XXXX-0000',
    pan: customer?.pan || '',
    fatherName: customer?.father_name || '',
    dob: customer?.dob || '',
    dsaId: row.dsa_id || lead.dsa_id,
    agentId: lead.agent_id,
    source: lead.source || 'Agent',
    repaymentFrequency: lead.repayment_frequency || 'Daily',
    companyMake: lead.company_make || COMPANY_MAKE_OPTIONS[0],
    batteryModel: lead.battery_model || BATTERY_MODEL_OPTIONS[0],
    amount,
    tenure,
    rate,
    monthlyIncome: rowNumber(review.net_monthly_income, PRODUCT_RULES.minMonthlyIncome),
    existingEmi: rowNumber(review.existing_emi),
    createdAt: rowDate(row.created_at || lead.created_at || customer?.created_at, today()),
    status: row.stage || account.status || 'Lead Created',
    stage: normalizeStage(row.stage),
    risk: row.risk || 'To Review',
    followup: normalizeFollowup({
      nextDate: rowDate(lead.followup_date, rowDate(row.created_at || lead.created_at || customer?.created_at, today())),
      remark: lead.followup_remark || '',
      closed: Boolean(lead.followup_closed),
      closedAt: rowDate(lead.followup_closed_at),
      history: lead.followup_history,
    }, rowDate(row.created_at || lead.created_at || customer?.created_at, today())),
    kyc: {
      aadhaar: kyc.aadhaar_status || 'Pending',
      pan: kyc.pan_status || 'Pending',
      liveness: kyc.liveness_status || 'Pending',
      attempts: rowNumber(kyc.attempts),
      reason: kyc.failure_reason || '',
    },
    panVerification: kyc.pan_verification || null,
    ovd: kyc.ovd || undefined,
    drivingLicenseVerification: kyc.secure_id_verifications?.drivingLicenseVerification || null,
    voterIdVerification: kyc.secure_id_verifications?.voterIdVerification || null,
    vehicleRcVerification: kyc.secure_id_verifications?.vehicleRcVerification || null,
    faceLivenessVerification: kyc.secure_id_verifications?.faceLivenessVerification || null,
    bankAccountVerification: kyc.secure_id_verifications?.bankAccountVerification || null,
    documents: documentsFromRow(row),
    geo: {
      status: row.geo_status || 'Pending',
      lat: extras.geo?.lat || '',
      lng: extras.geo?.lng || '',
      photo: Boolean(extras.geo?.photo),
      evidencePhotos: Array.isArray(extras.geo?.evidencePhotos) ? extras.geo.evidencePhotos : [],
    },
    credit: {
      bureauScore: rowNumber(review.bureau_score),
      scorecard: rowNumber(review.scorecard_score),
      foir: rowNumber(review.foir),
      decision: review.decision || 'Pending',
      reason: review.decision_reason || '',
      referred: Boolean(review.referred_to),
    },
    sanction: {
      generated: Boolean(sanction.id),
      kfsAccepted: Boolean(sanction.kfs_accepted),
      acceptedAt: rowDate(sanction.accepted_at),
      validity: rowDate(sanction.created_at, today(30)),
    },
    nach: {
      accountMasked: mandate.account_masked || 'XXXXXX0000',
      ifsc: mandate.ifsc || '',
      bank: mandate.bank_name || '',
      pennyDrop: mandate.penny_drop_status || 'Pending',
      mandate: mandate.mandate_status || 'Pending',
    },
    disbursement: {
      beneficiary: disbursement.beneficiary_type || 'Customer',
      status: disbursement.status || 'Pending',
      utr: disbursement.utr || '',
      releasedAt: rowDate(disbursement.released_at),
      slaDue: rowDate(disbursement.sla_due_at),
    },
    servicing: {
      loanAccountNo: account.loan_account_number || '',
      outstanding: rowNumber(account.outstanding),
      dpd: rowNumber(account.current_dpd),
      bucket: account.dpd_bucket || 'Current',
      schedule,
    },
    collections: {
      assignedTo: collection.assigned_to || '',
      action: collection.notes || collection.action_type || '',
      ptpDate: rowDate(collection.ptp_date),
      npaMarked: Boolean(collection.npa_marked),
      log: allCollections.map((item) => ({
        id: item.id,
        assignedTo: item.assigned_to || '',
        actionType: item.action_type || '',
        notes: item.notes || '',
        dpd: rowNumber(item.dpd),
        bucket: item.bucket || '',
        ptpDate: rowDate(item.ptp_date),
        npaMarked: Boolean(item.npa_marked),
        createdAt: rowDate(item.created_at),
      })),
    },
    audit: (auditLog && auditLog.length)
      ? auditLog
      : [createAudit('Loaded from Supabase', 'System', row.updated_at || row.created_at || '')],
  });
}

async function readSupabaseTable(table) {
  const { data, error } = await supabase.from(table).select('*').limit(500);
  return { rows: error ? [] : data || [], error };
}

function mapMasterDropdownRows(rows = []) {
  const next = {};
  rows.forEach((row) => {
    if (Array.isArray(row.values) || (row.values && typeof row.values === 'object')) {
      next[row.option_key] = row.values;
    }
  });
  return next;
}

async function loadOperationalData() {
  if (!isSupabaseConfigured || !supabase) {
    return { source: { label: 'No live data source', detail: 'Supabase is not configured.' } };
  }

  const tableNames = [
    'master_dropdown_options',
    'product_rules',
    'profiles',
    'dsas',
    'agents',
    'customers',
    'leads',
    'loan_applications',
  ];
  const results = Object.fromEntries(await Promise.all(tableNames.map(async (table) => [table, await readSupabaseTable(table)])));
  const visibleRows = tableNames.reduce((sum, table) => sum + results[table].rows.length, 0);
  const next = {
    source: visibleRows
      ? { label: 'Live Supabase data', detail: `${visibleRows} operational rows loaded from Supabase.` }
      : { label: 'No records loaded', detail: 'Supabase is connected, but no operational rows are visible for this user yet.' },
  };

  if (results.product_rules.rows.length) {
    next.rules = mapProductRules(results.product_rules.rows.find((row) => row.active) || results.product_rules.rows[0]);
  }

  if (results.master_dropdown_options.rows.length) {
    const mappedOptions = mapMasterDropdownRows(results.master_dropdown_options.rows);
    const normalizedPolicies = (mappedOptions.userAccessPolicies || mappedOptions.emailPolicies || [])
      .map(sanitizeUserAccessPolicy)
      .filter(Boolean);
    next.dropdownOptions = {
      ...mappedOptions,
      userAccessPolicies: normalizedPolicies,
      emailPolicies: normalizedPolicies,
    };
    if (mappedOptions.targets && typeof mappedOptions.targets === 'object' && !Array.isArray(mappedOptions.targets)) {
      next.targets = mappedOptions.targets;
    }
  }

  if (results.profiles.rows.length) {
    next.userEmails = Array.from(new Set(
      results.profiles.rows
        .map((row) => normalizePolicyEmail(row.email))
        .filter(Boolean)
    )).sort();
  }

  if (results.dsas.rows.length) {
    next.dsas = results.dsas.rows.filter((row) => row.active !== false).map((row) => ({
      id: row.id,
      code: row.code,
      firmName: row.name,
      nickname: row.nickname || '',
      owner: row.email || row.code,
      city: row.city || 'New Zone',
      state: row.state || '',
      status: row.active ? 'Active' : 'Suspended',
      commissionRate: rowNumber(row.commission_rate, 0),
      leads: 0,
    }));
  }

  if (results.agents.rows.length) {
    next.agents = results.agents.rows.filter((row) => row.status !== 'Inactive').map((row) => ({
      id: row.id,
      code: row.agent_code,
      name: row.name,
      dsaId: row.dsa_id,
      mobile: row.mobile,
    }));
  }

  if (!results.loan_applications.error) {
    const related = {
      customersById: mapById(results.customers.rows),
      leads: results.leads.rows,
    };
    next.applications = results.loan_applications.rows.map((row) => mapSupabaseApplication(row, related));
  }

  return next;
}

async function saveMasterDropdownOptions(optionKey, values) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from('master_dropdown_options')
    .upsert({
      option_key: optionKey,
      values,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'option_key' });
  if (error) throw error;
}

async function saveProfileAssignmentsForPolicies(policies) {
  if (!isSupabaseConfigured || !supabase) return;
  const scopedPolicies = policies.filter((policy) => policy.dsaId || policy.agentId);
  await Promise.all(scopedPolicies.map(async (policy) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: policy.role === 'AGENT' ? 'agent' : policy.role === 'SUPER_ADMIN' ? 'master' : 'dsa',
        dsa_id: policy.dsaId || null,
        assigned_agent_id: policy.agentId || null,
      })
      .eq('email', policy.email);
    if (error) throw error;
  }));
}

async function saveLeadFollowup(app, followup) {
  if (!isSupabaseConfigured || !supabase) return;
  const payload = {
    followup_date: followup.nextDate || null,
    followup_remark: followup.remark || null,
    followup_closed: Boolean(followup.closed),
    followup_closed_at: followup.closedAt || null,
    followup_history: followup.history || [],
    updated_at: new Date().toISOString(),
  };
  let { error } = await supabase
    .from('leads')
    .update(payload)
    .eq('lead_number', app.leadId);
  if (error && String(error.message || '').includes('followup_history')) {
    const { followup_history: _history, ...legacyPayload } = payload;
    const fallback = await supabase
      .from('leads')
      .update(legacyPayload)
      .eq('lead_number', app.leadId);
    error = fallback.error;
  }
  if (error) throw error;
}

async function saveProductRules(rules) {
  if (!isSupabaseConfigured || !supabase) return;
  const payload = {
    product_name: rules.product || PRODUCT_RULES.product,
    min_amount: Number(rules.minAmount || 0),
    max_amount: Number(rules.maxAmount || Math.max(...LOAN_AMOUNT_OPTIONS)),
    annual_flat_rate: Number(rules.annualFlatRate || DEFAULT_LOAN_INTEREST_RATE),
    allowed_tenures: rules.tenures.map(Number).filter(Boolean),
    grace_period_days: Number(rules.graceDays || PRODUCT_RULES.graceDays),
    npa_threshold_dpd: Number(rules.npaDpd || PRODUCT_RULES.npaDpd),
    disbursement_sla_hours: Number(rules.disbursementSlaHours || PRODUCT_RULES.disbursementSlaHours),
    min_bureau_score: Number(rules.minBureauScore || PRODUCT_RULES.minBureauScore),
    foir_threshold: Number(rules.foirThreshold || PRODUCT_RULES.foirThreshold),
    active: true,
    updated_at: new Date().toISOString(),
  };
  const existing = await supabase
    .from('product_rules')
    .select('id')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  const result = existing.data?.id
    ? await supabase.from('product_rules').update(payload).eq('id', existing.data.id)
    : await supabase.from('product_rules').insert(payload);
  if (result.error) throw result.error;
}

function quotedCodeList(codes) {
  return `(${codes.map((code) => `"${code}"`).join(',')})`;
}

function isUuid(value) {
  return /^[0-9a-f-]{36}$/i.test(String(value || ''));
}

function newEntityUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function saveDsaOptions(values) {
  if (!isSupabaseConfigured || !supabase) return;
  const rows = values.map((dsa) => {
    const code = dsa.code || slugCode(dsa.firmName || dsa.id, 'DSA');
    const row = {
      code,
      name: dsa.firmName,
      nickname: dsa.nickname ? String(dsa.nickname).trim() || null : null,
      email: dsa.owner?.includes('@') ? dsa.owner : `${code.toLowerCase()}@dhanurja.in`,
      city: dsa.city || 'New Zone',
      active: dsa.status !== 'Suspended',
    };
    if (isUuid(dsa.id)) row.id = dsa.id;
    return row;
  });
  const { error } = await supabase.from('dsas').upsert(rows, { onConflict: 'code' });
  if (error) throw error;
  if (rows.length) {
    const inactive = await supabase.from('dsas').update({ active: false }).not('code', 'in', quotedCodeList(rows.map((row) => row.code)));
    if (inactive.error) throw inactive.error;
  }
}

async function deleteDsaRecord(dsa) {
  if (!isSupabaseConfigured || !supabase) return;
  if (isUuid(dsa.id)) {
    const { error } = await supabase.from('dsas').delete().eq('id', dsa.id);
    if (error) throw error;
    return;
  }
  const code = dsa.code || slugCode(dsa.firmName || dsa.id, 'DSA');
  const { error } = await supabase.from('dsas').delete().eq('code', code);
  if (error) throw error;
}

async function saveAgentOptions(values, dsas) {
  if (!isSupabaseConfigured || !supabase) return;
  const defaultDsaId = dsas.find((dsa) => isUuid(dsa.id))?.id || null;
  const rows = values.map((agent) => ({
    agent_code: agent.code || slugCode(agent.name || agent.id, 'AGT'),
    name: agent.name,
    mobile: agent.mobile || '',
    dsa_id: isUuid(agent.dsaId) ? agent.dsaId : defaultDsaId,
    status: 'Active',
  }));
  const { error } = await supabase.from('agents').upsert(rows, { onConflict: 'agent_code' });
  if (error) throw error;
  if (rows.length) {
    const inactive = await supabase.from('agents').update({ status: 'Inactive' }).not('agent_code', 'in', quotedCodeList(rows.map((row) => row.agent_code)));
    if (inactive.error) throw inactive.error;
  }
}

function runBre(app, rules = PRODUCT_RULES) {
  const docsComplete = documentTypes.slice(0, 6).every((doc) => app.documents[doc]);
  const kycPass = app.kyc.pan === 'Verified' && app.kyc.liveness === 'Verified';
  const foir = (Number(app.existingEmi || 0) + Number(app.emi || 0)) / Math.max(Number(app.monthlyIncome || 1), 1);
  const checks = [
    { label: 'Aadhaar number captured', pass: Boolean(app.aadhaar), fail: 'Hold / Reject' },
    { label: 'PAN verified', pass: app.kyc.pan === 'Verified' && panValid(app.pan), fail: 'Hold / Reject' },
    { label: 'Liveness/selfie verified', pass: app.kyc.liveness === 'Verified', fail: 'Reject' },
    { label: `Amount at or below ${formatMoney(rules.maxAmount)}`, pass: app.amount <= rules.maxAmount && app.amount >= rules.minAmount, fail: 'Reject' },
    { label: 'Allowed tenure selected', pass: rules.tenures.includes(Number(app.tenure)), fail: 'Reject' },
    { label: 'Required login documents complete', pass: docsComplete, fail: 'Pend / Hold' },
    { label: `Monthly income at least ${formatMoney(rules.minMonthlyIncome)}`, pass: app.monthlyIncome >= rules.minMonthlyIncome, fail: 'Refer' },
    { label: `Bureau score at least ${rules.minBureauScore}`, pass: app.credit.bureauScore >= rules.minBureauScore, fail: 'Refer / Reject' },
    { label: `FOIR below ${(rules.foirThreshold * 100).toFixed(0)}%`, pass: foir <= rules.foirThreshold, fail: 'Refer' },
  ];
  const hardFail = checks.some((check) => !check.pass && check.fail === 'Reject');
  const hold = !docsComplete || !kycPass;
  const refer = !hardFail && !hold && checks.some((check) => !check.pass);
  const decision = hardFail ? 'Reject' : hold ? 'Hold' : refer ? 'Refer' : 'Approve';
  return { checks, decision, foir };
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin({ email, password });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please check your email and password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-art">
        <img className="hero-logo" src={dhanurjaLogo} alt="DhanUrja - Driving Every Journey Forward" />
        <div className="login-copy">
          <h1>EV Battery Loan Command Centre</h1>
        </div>
      </section>
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="panel-icon"><LockKeyhole size={22} /></div>
        <h2>Email Password Login</h2>
        <p>Sign in with your registered DhanUrja workspace credentials.</p>
        <div className="field">
          <label htmlFor="login-email">Email address</label>
          <div className="input-with-icon">
            <Mail size={17} />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="Enter email address"
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <div className="password-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide entry' : 'Show entry'}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && (
          <div className="login-error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
          <ChevronRight size={17} />
        </button>
        <div className="legal-login-links">
          <a className="link-button legal-login-link" href="#contact-us">Contact</a>
          <a className="link-button legal-login-link" href="#terms-and-conditions">Terms</a>
          <a className="link-button legal-login-link" href="#cancellation-policy">Cancellation</a>
        </div>
      </form>
      <PublicFooter />
    </main>
  );
}

function PublicLegalScreen({ route, onBack }) {
  return (
    <main className="public-legal-screen">
      <header className="public-legal-topbar">
        <img src={dhanurjaLogo} alt="DhanUrja - Driving Every Journey Forward" />
        <nav className="public-legal-links" aria-label="Legal pages">
          <a className={route === 'contact-us' ? 'active' : ''} href="#contact-us">Contact</a>
          <a className={route === 'terms-and-conditions' ? 'active' : ''} href="#terms-and-conditions">Terms</a>
          <a className={route === 'cancellation-policy' ? 'active' : ''} href="#cancellation-policy">Cancellation</a>
        </nav>
        <button className="ghost-action" onClick={onBack}>Back to login</button>
      </header>
      <LegalPageByRoute route={route} />
      <PublicFooter />
    </main>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div>
        <strong>{merchantContact.legalName}</strong>
        <span>{merchantContact.registeredAddress}</span>
      </div>
      <nav aria-label="Footer legal pages">
        <a href="#contact-us">Contact Us</a>
        <a href="#terms-and-conditions">Terms & Conditions</a>
        <a href="#cancellation-policy">Cancellation Policy</a>
      </nav>
      <span>Telephone: {merchantContact.telephone} | Email: {merchantContact.email}</span>
    </footer>
  );
}

async function sessionFromSupabaseUser(user) {
  let profile = null;
  try {
    const profileResult = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error('Unable to load profile for authenticated user', profileResult.error);
    } else {
      profile = profileResult.data;
    }
  } catch (error) {
    console.error('Unable to load profile for authenticated user', error);
  }

  const fullName = profile?.full_name || user.user_metadata?.full_name || fallbackName(user.email);

  return {
    name: fullName,
    role: resolveRole(profile?.role || user.user_metadata?.requested_role, user.email),
    email: user.email,
  };
}

function App() {
  const [session, setSession] = useState(() => loadCachedSession());
  const [authLoading, setAuthLoading] = useState(Boolean(isSupabaseConfigured && supabase));

  useEffect(() => {
    saveCachedSession(session);
  }, [session]);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [publicRoute, setPublicRoute] = useState(currentPublicRoute);
  const [applications, setApplications] = useState(() => loadCachedApplications().concat(operationalApplications));
  const [dsas, setDsas] = useState(dsaDirectory);
  const [agents, setAgents] = useState(agentDirectory);
  const [targets, setTargets] = useState(loadCachedTargets);
  const [rules, setRules] = useState(PRODUCT_RULES);
  const [roleOptions, setRoleOptions] = useState(ROLES);
  const [dropdownOptions, setDropdownOptions] = useState({
    loanAmounts: LOAN_AMOUNT_OPTIONS,
    sources: LEAD_SOURCE_OPTIONS,
    companyMakes: COMPANY_MAKE_OPTIONS,
    batteryModels: BATTERY_MODEL_OPTIONS,
    vehicleCategories: VEHICLE_CATEGORY_OPTIONS,
    userAccessPolicies: [],
    emailPolicies: [],
    userEmails: [],
    roleAccessMatrix: sanitizeRoleAccessMatrix(DEFAULT_ROLE_ACCESS_MATRIX),
  });
  const [selectedId, setSelectedId] = useState('');
  const [saveStatus, setSaveStatus] = useState({ pending: 0, lastError: '', lastErrorAt: 0 });
  const setNotice = () => {};
  function reportSaveStart() {
    setSaveStatus((current) => ({ ...current, pending: current.pending + 1 }));
  }
  function reportSaveEnd(error, label) {
    setSaveStatus((current) => ({
      pending: Math.max(0, current.pending - 1),
      lastError: error ? `${label}: ${String(error.message || error)}` : '',
      lastErrorAt: error ? Date.now() : current.lastErrorAt,
    }));
    if (error) console.error(`Unable to save ${label}`, error);
  }
  function trackSave(label, task) {
    reportSaveStart();
    return Promise.resolve()
      .then(() => task())
      .then((value) => { reportSaveEnd(null, label); return value; })
      .catch((error) => { reportSaveEnd(error, label); throw error; });
  }
  function dismissSaveError() {
    setSaveStatus((current) => ({ ...current, lastError: '' }));
  }

  useEffect(() => {
    function syncPublicRoute() {
      setPublicRoute(currentPublicRoute());
    }

    window.addEventListener('hashchange', syncPublicRoute);
    return () => window.removeEventListener('hashchange', syncPublicRoute);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function applySupabaseSession(authSession) {
      if (!authSession?.user) {
        if (!cancelled) setSession(null);
        return;
      }

      const nextSession = await sessionFromSupabaseUser(authSession.user);
      if (!cancelled) setSession(nextSession);
    }

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('Unable to restore Supabase session', error);
        }
        return applySupabaseSession(data?.session);
      })
      .catch((error) => {
        console.error('Unable to restore Supabase session', error);
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        return;
      }

      if (authSession?.user) {
        applySupabaseSession(authSession).catch((error) => {
          console.error('Unable to sync Supabase auth session', error);
        });
      }
    });

    return () => {
      cancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const activeUserPolicy = useMemo(
    () => findUserAccessPolicy(session?.email, dropdownOptions.userAccessPolicies || dropdownOptions.emailPolicies),
    [dropdownOptions.emailPolicies, dropdownOptions.userAccessPolicies, session?.email]
  );
  const visibleApplications = useMemo(
    () => scopeApplicationsForPolicy(applications, activeUserPolicy),
    [activeUserPolicy, applications]
  );
  const filteredApps = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return visibleApplications;
    return visibleApplications.filter((app) =>
      [app.id, app.leadId, app.customerCode, app.customer, app.mobile, app.aadhaar, app.pan, app.stage, app.status]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [query, visibleApplications]);

  const selected = visibleApplications.find((app) => app.id === selectedId) || visibleApplications[0] || null;
  const roleAccessMatrix = useMemo(() => sanitizeRoleAccessMatrix(dropdownOptions.roleAccessMatrix), [dropdownOptions.roleAccessMatrix]);
  const sessionAccess = roleAccessFor(session?.role, roleAccessMatrix);
  const visibleMenu = menu.filter(([label]) => sessionAccess.includes(label));
  useEffect(() => {
    if (selected?.id && selected.id !== selectedId) {
      setSelectedId(selected.id);
    } else if (!selected && selectedId) {
      setSelectedId('');
    }
  }, [selected, selectedId]);
  const visibleStageMenu = visibleMenu.filter(([label]) => STAGE_NAV_LABELS.includes(label));
  const hasLeadsNav = visibleMenu.some(([label]) => label === 'Leads');
  const firstPrimaryLabel = visibleMenu.find(([label]) => !STAGE_NAV_LABELS.includes(label))?.[0] || '';
  const [stagesOpen, setStagesOpen] = useState(() => STAGE_NAV_LABELS.includes(activeNav));
  useEffect(() => {
    if (!sessionAccess.length) return;
    if (!sessionAccess.includes(activeNav)) {
      setActiveNav(sessionAccess[0]);
    }
  }, [activeNav, sessionAccess]);

  useEffect(() => {
    if (STAGE_NAV_LABELS.includes(activeNav)) {
      setStagesOpen(true);
    }
  }, [activeNav]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [session?.email, activeNav]);

  useEffect(() => {
    saveCachedApplications(applications);
  }, [applications]);

  useEffect(() => {
    saveCachedTargets(targets);
  }, [targets]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    loadOperationalData().then((loaded) => {
      if (cancelled) return;
      if (loaded.rules) {
        setRules(loaded.rules);
        setDropdownOptions((current) => ({
          ...current,
          loanAmounts: Array.from(new Set([...current.loanAmounts, loaded.rules.maxAmount])).sort((a, b) => a - b),
        }));
      }
      if (loaded.dropdownOptions) {
        setDropdownOptions((current) => ({
          ...current,
          ...loaded.dropdownOptions,
        }));
        if (loaded.dropdownOptions.roles) {
          setRoleOptions(loaded.dropdownOptions.roles);
        }
        if (loaded.dropdownOptions.roleAccessMatrix) {
          setDropdownOptions((current) => ({
            ...current,
            roleAccessMatrix: sanitizeRoleAccessMatrix(loaded.dropdownOptions.roleAccessMatrix),
          }));
        }
      }
      if (loaded.userEmails?.length || session?.email) {
        setDropdownOptions((current) => ({
          ...current,
          userEmails: Array.from(new Set([
            ...(current.userEmails || []),
            ...(loaded.userEmails || []),
            normalizePolicyEmail(session?.email || ''),
          ].filter(Boolean))).sort(),
        }));
      }
      const loadedUserPolicy = findUserAccessPolicy(session?.email, loaded.dropdownOptions?.userAccessPolicies || loaded.dropdownOptions?.emailPolicies || []);
      if (loadedUserPolicy?.role) {
        setSession((current) => current ? { ...current, role: loadedUserPolicy.role } : current);
      }
      if (loaded.dsas?.length) setDsas(loaded.dsas);
      if (loaded.agents?.length) setAgents(loaded.agents);
      if (loaded.targets && typeof loaded.targets === 'object') setTargets(loaded.targets);
      if (Array.isArray(loaded.applications)) {
        const syncedApplications = mergeCachedLeadExtras(loaded.applications);
        setApplications(syncedApplications);
        const firstVisibleLoaded = scopeApplicationsForPolicy(syncedApplications, loadedUserPolicy)[0] || syncedApplications[0];
        setSelectedId(firstVisibleLoaded?.id || '');
      }
    }).catch((error) => {
      if (!cancelled) console.error(error);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.email]);

  function mutateApplication(appId, patch, action, detail = '') {
    let snapshot = null;
    setApplications((current) => current.map((app) => {
      if (app.id !== appId) return app;
      const next = typeof patch === 'function' ? patch(app) : { ...app, ...patch };
      const withAudit = { ...next, audit: [createAudit(action, session.name, detail), ...(next.audit || app.audit)] };
      snapshot = withAudit;
      return withAudit;
    }));
    if (snapshot) {
      trackSave(`application ${snapshot.id}`, () => persistApplicationUpdate(snapshot))
        .catch(() => {});
    }
    setNotice(action);
  }

  async function updateLeadFollowup(appId, nextFollowup) {
    const currentApp = applications.find((app) => app.id === appId);
    if (!currentApp) return;
    const followup = {
      nextDate: nextFollowup.nextDate || currentApp.followup?.nextDate || currentApp.createdAt || today(),
      remark: String(nextFollowup.remark || '').trim(),
      closed: Boolean(nextFollowup.closed),
      closedAt: nextFollowup.closed ? nextFollowup.closedAt || today() : '',
    };
    if (!followup.closed && isPastDate(followup.nextDate)) {
      throw new Error('Followup date cannot be in back date.');
    }
    followup.history = [
      createFollowupHistoryEntry(followup, session.name),
      ...normalizeFollowup(currentApp.followup, currentApp.createdAt || today()).history,
    ];

    setApplications((current) => current.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        followup,
        leadStatus: followup.closed ? 'Followup Closed' : app.leadStatus,
        audit: [
          createAudit(followup.closed ? 'Followup closed' : 'Followup updated', session.name, followup.remark || followup.nextDate),
          ...(app.audit || []),
        ],
      };
    }));

    await trackSave('lead followup', () => saveLeadFollowup(currentApp, followup));
    setNotice(followup.closed ? 'Followup closed' : 'Followup updated');
  }

  async function deleteLeadDraft(appId) {
    const app = applications.find((item) => item.id === appId);
    if (!app || !isDraftApplication(app)) return;

    await trackSave('draft delete', () => deletePersistedLeadDraft(app));
    setApplications((current) => current.filter((item) => item.id !== appId));
    if (selectedId === appId) {
      const next = applications.find((item) => item.id !== appId);
      setSelectedId(next?.id || '');
    }
    setNotice('Draft deleted');
  }

  async function deleteLead(appId) {
    if (String(session?.role || '').toUpperCase() !== 'SUPER_ADMIN') return;
    const app = applications.find((item) => item.id === appId);
    if (!app) return;

    await trackSave('lead delete', () => deletePersistedLeadDraft(app));
    setApplications((current) => current.filter((item) => item.id !== appId));
    if (selectedId === appId) {
      const next = applications.find((item) => item.id !== appId);
      setSelectedId(next?.id || '');
    }
    setNotice('Lead deleted');
  }

  function resolveUpdater(updater, currentValue) {
    return typeof updater === 'function' ? updater(currentValue) : updater;
  }

  function updateDropdownList(key, valuesOrUpdater) {
    let resolvedValues;
    setDropdownOptions((current) => {
      resolvedValues = resolveUpdater(valuesOrUpdater, current[key]);
      return { ...current, [key]: resolvedValues };
    });
    trackSave(`master dropdown:${key}`, () => saveMasterDropdownOptions(key, resolvedValues)).catch(() => {});
  }

  function updateRules(nextRulesOrUpdater) {
    let resolved;
    setRules((current) => {
      resolved = resolveUpdater(nextRulesOrUpdater, current);
      return resolved;
    });
    trackSave('product rules', () => saveProductRules(resolved)).catch(() => {});
  }

  function updateDsas(nextDsasOrUpdater) {
    let resolved;
    setDsas((current) => {
      resolved = resolveUpdater(nextDsasOrUpdater, current);
      return resolved;
    });
    trackSave('DSA master', () => saveDsaOptions(resolved)).catch(() => {});
  }

  function deleteDsa(dsa) {
    const remaining = dsas.filter((item) => item.id !== dsa.id);
    const remainingAgents = agents.filter((agent) => agent.dsaId !== dsa.id);
    setDsas(remaining);
    setAgents(remainingAgents);
    trackSave(`DSA "${dsaDisplayName(dsa) || dsa.id}" deleted`, async () => {
      await deleteDsaRecord(dsa);
      await saveAgentOptions(remainingAgents, remaining);
    }).catch(() => {});
  }

  function updateAgents(nextAgentsOrUpdater) {
    let resolved;
    setAgents((current) => {
      resolved = resolveUpdater(nextAgentsOrUpdater, current);
      return resolved;
    });
    trackSave('agent master', () => saveAgentOptions(resolved, dsas)).catch(() => {});
  }

  function updateDsaNetwork(nextDsas, nextAgents = agents) {
    setDsas(nextDsas);
    setAgents(nextAgents);
    trackSave('DSA and agent master', async () => {
      await saveDsaOptions(nextDsas);
      await saveAgentOptions(nextAgents, nextDsas);
    }).catch(() => {});
  }

  function updateRoleOptions(nextRolesOrUpdater) {
    let resolved;
    setRoleOptions((current) => {
      resolved = resolveUpdater(nextRolesOrUpdater, current);
      return resolved;
    });
    trackSave('role master', () => saveMasterDropdownOptions('roles', resolved)).catch(() => {});
  }

  function updateTargets(nextTargetsOrUpdater) {
    let resolved;
    setTargets((current) => {
      resolved = resolveUpdater(nextTargetsOrUpdater, current);
      return resolved;
    });
    trackSave('targets', () => saveMasterDropdownOptions('targets', resolved || {})).catch(() => {});
  }

  function updateEmailPolicies(nextPolicies) {
    const incoming = typeof nextPolicies === 'function'
      ? nextPolicies(dropdownOptions.emailPolicies || dropdownOptions.userAccessPolicies || [])
      : nextPolicies;
    const sanitized = (Array.isArray(incoming) ? incoming : []).map(sanitizeUserAccessPolicy).filter(Boolean);
    setDropdownOptions((current) => ({ ...current, emailPolicies: sanitized, userAccessPolicies: sanitized }));
    trackSave('user access policies', async () => {
      await saveMasterDropdownOptions('userAccessPolicies', sanitized);
      await saveMasterDropdownOptions('emailPolicies', sanitized);
      await saveProfileAssignmentsForPolicies(sanitized);
    }).catch(() => {});
    const activeUserPolicy = findUserAccessPolicy(session?.email, sanitized);
    if (activeUserPolicy?.role) {
      setSession((current) => current ? { ...current, role: activeUserPolicy.role } : current);
    }
  }

  function updateRoleAccessMatrix(nextMatrix) {
    const incoming = typeof nextMatrix === 'function' ? nextMatrix(dropdownOptions.roleAccessMatrix) : nextMatrix;
    const sanitized = sanitizeRoleAccessMatrix(incoming);
    setDropdownOptions((current) => ({ ...current, roleAccessMatrix: sanitized }));
    trackSave('role access matrix', () => saveMasterDropdownOptions('roleAccessMatrix', sanitized)).catch(() => {});
  }

  async function createLead(form) {
    const activePolicy = findUserAccessPolicy(session?.email, dropdownOptions.userAccessPolicies || dropdownOptions.emailPolicies);
    const constrainedForm = applyLeadPolicy(form, activePolicy, dropdownOptions, rules);
    const amount = Number(constrainedForm.amount || dropdownOptions.loanAmounts[0] || PRODUCT_RULES.minAmount);
    const tenure = Number(constrainedForm.tenure || 24);
    const rate = Number(constrainedForm.interestRate || DEFAULT_LOAN_INTEREST_RATE);
    const monthlyIncome = parseFormattedNumber(constrainedForm.monthlyIncome);
    const existingEmi = parseFormattedNumber(constrainedForm.existingEmi);
    const customerCode = customerCodeFor(
      constrainedForm.customer,
      constrainedForm.loanDate,
      applications.map((entry) => entry.customerCode)
    );
    const aadhaar = normalizeAadhaarInput(constrainedForm.aadhaar);
    const pan = normalizePanInput(constrainedForm.pan);
    const id = String(constrainedForm.loanNo || '').trim();
    const app = createApplicationRecord({
      id,
      leadId: `LEAD-${Math.floor(2000 + Math.random() * 7000)}`,
      customerCode,
      customer: constrainedForm.customer,
      mobile: constrainedForm.mobile,
      createdAt: constrainedForm.loanDate,
      firstEmiDate: constrainedForm.firstEmiDate,
      loanRemark: constrainedForm.remark,
      aadhaar,
      pan,
      dob: constrainedForm.dob,
      fatherName: constrainedForm.fatherName,
      dsaId: constrainedForm.dsaId,
      agentId: constrainedForm.agentId,
      source: constrainedForm.source,
      repaymentFrequency: constrainedForm.repaymentFrequency,
      companyMake: constrainedForm.companyMake,
      batteryModel: constrainedForm.batteryModel,
      vehicleDetails: constrainedForm.vehicleDetails,
      bankDetails: constrainedForm.bankDetails,
      ovd: constrainedForm.ovd,
      referenceContacts: constrainedForm.referenceContacts,
      monthlyExpense: parseFormattedNumber(constrainedForm.monthlyExpense),
      livingAddress: constrainedForm.livingAddress,
      livingSince: constrainedForm.livingSince,
      residenceType: constrainedForm.residenceType,
      ownershipType: constrainedForm.ownershipType,
      electricityBills: constrainedForm.electricityBills,
      itrImages: constrainedForm.itrImages,
      aadhaarImages: constrainedForm.aadhaarImages,
      amount,
      tenure,
      rate,
      monthlyIncome,
      existingEmi,
      stage: form.asDraft ? 'Draft' : 'KYC Check',
      status: form.asDraft ? 'Draft' : 'KYC Pending',
      leadStatus: form.asDraft ? 'Draft' : 'Application Initiated',
      panVerification: form.panVerification || null,
      kyc: {
        aadhaar: aadhaar ? 'Captured' : 'Pending',
        pan: form.panVerification?.verified ? 'Verified' : 'Pending',
        liveness: 'Pending',
        attempts: form.panVerification ? 1 : 0,
        reason: form.panVerification && !form.panVerification.verified ? form.panVerification.reason : '',
      },
    });

    if (form.panVerification?.verified) {
      app.documents = { ...app.documents, 'PAN Card': true };
    }

    const existingDraft = applications.find((item) => item.id === id && isDraftApplication(item));
    if (existingDraft && isSupabaseConfigured && supabase) {
      await deletePersistedLeadDraft(existingDraft);
    }

    if (isSupabaseConfigured && supabase) {
      await trackSave('lead create', () => persistLeadApplication(app, constrainedForm));
      await trackSave(`application ${app.id} extras`, () => persistApplicationUpdate(app));
    }

    setApplications((current) => [app, ...current.filter((item) => item.id !== id)]);
    setSelectedId(id);
    if (form.asDraft) {
      setNotice('Lead saved as draft');
    } else {
      setActiveNav('KYC Verification');
      setNotice('Lead created and moved to KYC');
    }
  }

  async function handleLogin({ email, password }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      throw new Error('Enter both email and password.');
    }

    if (!isSupabaseConfigured || !supabase) {
      setSession({
        name: isMasterEmail(normalizedEmail) ? 'Dhanurja Master' : fallbackName(normalizedEmail),
        role: resolveRole('', normalizedEmail),
        email: normalizedEmail,
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    setSession(await sessionFromSupabaseUser(data.user));
  }

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }

  if (isPublicLegalRoute(publicRoute)) {
    return <PublicLegalScreen route={publicRoute} onBack={() => {
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
      setPublicRoute('');
    }} />;
  }

  if (authLoading) {
    return (
      <main className="login-screen">
        <section className="login-panel">
          <p>Checking your session...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      {mobileNavOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <aside className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img className="sidebar-logo" src={dhanurjaLogo} alt="DhanUrja - Driving Every Journey Forward" />
          <span>Battery Finance Master Portal</span>
        </div>
        <nav>
          {visibleMenu.map(([label, Icon]) => {
            if (STAGE_NAV_LABELS.includes(label)) return null;
            return (
              <React.Fragment key={label}>
                <button
                  className={activeNav === label ? 'active' : ''}
                  onClick={() => {
                    setActiveNav(label);
                    setMobileNavOpen(false);
                  }}
                >
                  <Icon size={18} />
                  {label}
                </button>
                {(label === 'Leads' || (!hasLeadsNav && label === firstPrimaryLabel)) && visibleStageMenu.length ? (
                  <div className={`sidebar-nav-group ${stagesOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className={`sidebar-group-trigger ${STAGE_NAV_LABELS.includes(activeNav) ? 'active' : ''}`}
                      onClick={() => setStagesOpen((current) => !current)}
                      aria-expanded={stagesOpen}
                    >
                      <ClipboardCheck size={18} />
                      Stages
                      <ChevronRight className="sidebar-group-chevron" size={16} />
                    </button>
                    {stagesOpen ? (
                      <div className="sidebar-subnav">
                        {visibleStageMenu.map(([stageLabel, StageIcon]) => (
                          <button
                            key={stageLabel}
                            className={activeNav === stageLabel ? 'active' : ''}
                            onClick={() => {
                              setActiveNav(stageLabel);
                              setMobileNavOpen(false);
                            }}
                          >
                            <StageIcon size={16} />
                            {stageLabel}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <span className="sidebar-user-avatar" aria-hidden="true">
            {(session.name?.trim()?.slice(0, 1) || 'U').toUpperCase()}
          </span>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">{session.name}</div>
            <div className="sidebar-user-role">{session.role}</div>
          </div>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="search-box">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search loan ID, mobile, PAN, Aadhaar suffix, DSA" />
          </div>
          <div className="topbar-actions">
            {saveStatus.pending > 0 && (
              <span className="save-status save-status-pending" aria-live="polite">
                Saving… ({saveStatus.pending})
              </span>
            )}
            {saveStatus.lastError && (
              <button className="save-status save-status-error" onClick={dismissSaveError} title={saveStatus.lastError}>
                Save failed — retry next change. Dismiss
              </button>
            )}
            <button className="ghost-action" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <PageRouter
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          apps={filteredApps}
          allApps={visibleApplications}
          selected={selected}
          setSelectedId={setSelectedId}
          mutateApplication={mutateApplication}
          updateLeadFollowup={updateLeadFollowup}
          createLead={createLead}
          deleteLeadDraft={deleteLeadDraft}
          deleteLead={deleteLead}
          dsas={dsas}
          setDsas={updateDsas}
          deleteDsa={deleteDsa}
          agents={agents}
          setAgents={updateAgents}
          targets={targets}
          setTargets={updateTargets}
          setDsaNetwork={updateDsaNetwork}
          rules={rules}
          setRules={updateRules}
          roleOptions={roleOptions}
          setRoleOptions={updateRoleOptions}
          roleAccessMatrix={roleAccessMatrix}
          setRoleAccessMatrix={updateRoleAccessMatrix}
          setEmailPolicies={updateEmailPolicies}
          dropdownOptions={dropdownOptions}
          updateDropdownList={updateDropdownList}
          session={session}
        />
      </main>
    </div>
  );
}

function PageRouter(props) {
  const page = {
    Dashboard: <DashboardPage {...props} />,
    Leads: <LeadsPage {...props} />,
    'Lead List': <LeadListPage {...props} />,
    Followup: <FollowupPage {...props} />,
    'KYC Verification': <KycPageContent {...props} />,
    TVR: <TvrPage {...props} />,
    'Loan Applications': <ApplicationsPage {...props} />,
    'Field Investigation': <FieldPage {...props} />,
    'Credit Review': <CreditPage {...props} />,
    'E-Sign': <SanctionPage {...props} />,
    Disbursement: <DisbursementPage {...props} />,
    Rejected: <RejectedPage {...props} />,
    Collections: <CollectionsPage {...props} />,
    'Delinquency Report': <DelinquencyReportPage {...props} />,
    Reports: <ReportsPage {...props} />,
    Targets: <TargetsPage {...props} />,
    'DSA Network': <DsaPage {...props} />,
    'User Management': <UserManagementPage {...props} />,
    'Master Data': <MasterDataPage {...props} />,
    'Contact Us': <ContactUsPage />,
    'Terms & Conditions': <TermsConditionsPage />,
    'Cancellation Policy': <CancellationPolicyPage />,
  }[props.activeNav];
  return <section className="page-shell">{page}</section>;
}

function pct(part, total) {
  return total ? `${Math.round((part / total) * 100)}%` : '0%';
}

function ratio(part, total) {
  return total ? part / total : 0;
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? clean.reduce((sum, value) => sum + Number(value), 0) / clean.length : 0;
}

function countBy(items, resolver) {
  return items.reduce((acc, item) => {
    const key = resolver(item) || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildBreakdown(items, resolver, total = items.length) {
  return Object.entries(countBy(items, resolver))
    .map(([label, count]) => ({ label, count, share: pct(count, total) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function ticketBand(amount) {
  if (amount >= 100000) return '1L+ ticket';
  if (amount >= 62000) return '62K-1L ticket';
  if (amount >= 50000) return '50K-62K ticket';
  return 'Sub-50K ticket';
}

function dpdBand(dpd) {
  if (dpd >= 90) return '90+ NPA';
  if (dpd >= 61) return '61-89 DPD';
  if (dpd >= 31) return '31-60 DPD';
  if (dpd >= 1) return '1-30 DPD';
  return 'Current';
}

function isBouncedEmi(emi) {
  const status = String(emi?.status || '').toLowerCase();
  return status.includes('bounce') || status.includes('failed') || status.includes('reject') || status.includes('unpaid');
}

function emiBounceCount(app) {
  const scheduleBounces = (app.servicing?.schedule || []).filter(isBouncedEmi).length;
  if (scheduleBounces) return scheduleBounces;
  return Math.floor(rowNumber(app.servicing?.dpd) / 30);
}

function delinquencyRows(apps) {
  return apps
    .map((app) => ({ app, bounces: emiBounceCount(app) }))
    .filter((row) => row.bounces >= 3)
    .sort((a, b) => b.bounces - a.bounces || rowNumber(b.app.servicing?.dpd) - rowNumber(a.app.servicing?.dpd));
}

function markNextEmiBounce(app) {
  const schedule = (app.servicing.schedule.length ? app.servicing.schedule : makeSchedule(app.amount, app.tenure, app.disbursement.releasedAt || today(), app.rate)).map((emi) => ({ ...emi }));
  const nextIndex = schedule.findIndex((emi) => !['paid', 'bounced'].includes(String(emi.status || '').toLowerCase()));
  const targetIndex = nextIndex >= 0 ? nextIndex : schedule.length - 1;
  if (targetIndex >= 0) {
    schedule[targetIndex] = {
      ...schedule[targetIndex],
      status: 'Bounced',
      paidAmount: 0,
      dpd: Math.max(rowNumber(schedule[targetIndex].dpd), PRODUCT_RULES.graceDays + 1),
    };
  }
  const bounceCount = emiBounceCount({ ...app, servicing: { ...app.servicing, schedule } });
  const nextDpd = Math.max(rowNumber(app.servicing.dpd) + 30, bounceCount * 30);
  return {
    ...app,
    servicing: {
      ...app.servicing,
      schedule,
      dpd: nextDpd,
      bucket: dpdBand(nextDpd),
    },
    status: nextDpd >= PRODUCT_RULES.npaDpd ? 'NPA' : 'Overdue',
  };
}

function documentCompletion(app) {
  return ratio(Object.values(app.documents || {}).filter(Boolean).length, documentTypes.length);
}

function appReportDate(app) {
  return rowDate(app.createdAt || app.disbursement?.releasedAt || app.sanction?.acceptedAt || today());
}

function isWithinDateRange(app, from, to) {
  const reportDate = appReportDate(app);
  return (!from || reportDate >= from) && (!to || reportDate <= to);
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function reportCsvRows(apps, rules) {
  return [
    ['Report Date', 'Customer Code', 'Application ID', 'Customer', 'Mobile', 'Stage', 'Status', 'Source', 'DSA ID', 'Amount', 'Tenure', 'EMI', 'Total Payable', 'Outstanding', 'DPD', 'DPD Bucket', 'Risk', 'Bureau Score', 'FOIR %', 'KYC Aadhaar', 'KYC PAN', 'KYC Liveness', 'Docs Complete %', 'KFS Accepted', 'NACH Mandate', 'Disbursement Status', 'Disbursed At'],
    ...apps.map((app) => [
      appReportDate(app),
      app.customerCode,
      app.id,
      app.customer,
      app.mobile,
      app.stage,
      app.status,
      app.source,
      app.dsaId,
      app.amount,
      app.tenure,
      app.emi,
      app.totalPayable,
      app.servicing.outstanding,
      app.servicing.dpd,
      dpdBand(app.servicing.dpd),
      app.risk,
      app.credit.bureauScore || '',
      (runBre(app, rules).foir * 100).toFixed(1),
      app.kyc.aadhaar,
      app.kyc.pan,
      app.kyc.liveness,
      Math.round(documentCompletion(app) * 100),
      app.sanction.kfsAccepted ? 'Yes' : 'No',
      app.nach.mandate,
      app.disbursement.status,
      app.disbursement.releasedAt || '',
    ]),
  ];
}

function buildPortfolioAnalytics(allApps, dsas, rules) {
  const total = allApps.length;
  const released = allApps.filter((app) => app.disbursement.status === 'Released');
  const active = allApps.filter((app) => ['Loan Servicing', 'Closed / NPA'].includes(app.stage) || app.disbursement.status === 'Released');
  const npa = allApps.filter((app) => app.servicing.dpd >= rules.npaDpd);
  const overdue = allApps.filter((app) => app.servicing.dpd > 0);
  const creditQueue = allApps.filter((app) => app.stage === 'Credit Underwriting' || app.credit.decision === 'Refer');
  const docsGaps = allApps.filter((app) => documentCompletion(app) < 1);
  const kycBlocked = allApps.filter((app) => ['Failed', 'Pending'].some((status) => [app.kyc.pan, app.kyc.liveness].includes(status)));
  const totalRequested = allApps.reduce((sum, app) => sum + app.amount, 0);
  const totalBooked = released.reduce((sum, app) => sum + app.amount, 0);
  const outstanding = active.reduce((sum, app) => sum + app.servicing.outstanding, 0);
  const overdueExposure = overdue.reduce((sum, app) => sum + app.servicing.outstanding, 0);
  const npaExposure = npa.reduce((sum, app) => sum + app.servicing.outstanding, 0);
  const avgTicket = average(allApps.map((app) => app.amount));
  const avgFoir = average(allApps.map((app) => runBre(app, rules).foir));
  const avgScore = average(allApps.map((app) => app.credit.bureauScore).filter(Boolean));
  const docsCompletion = average(allApps.map(documentCompletion));
  const kycPassed = allApps.filter((app) => app.kyc.pan === 'Verified' && app.kyc.liveness === 'Verified').length;

  const stages = lifecycle.map((stage) => {
    const rows = allApps.filter((app) => app.stage === stage);
    const exposure = rows.reduce((sum, app) => sum + app.amount, 0);
    return { label: stage, count: rows.length, share: pct(rows.length, total), exposure };
  });

  const riskRows = ['Low', 'Medium', 'High', 'To Review'].map((risk) => {
    const rows = allApps.filter((app) => app.risk === risk || (!app.risk && risk === 'To Review'));
    return {
      label: risk,
      count: rows.length,
      exposure: rows.reduce((sum, app) => sum + app.amount, 0),
      npa: rows.filter((app) => app.servicing.dpd >= rules.npaDpd).length,
    };
  });

  const dpdRows = ['Current', '1-30 DPD', '31-60 DPD', '61-89 DPD', '90+ NPA'].map((label) => {
    const rows = allApps.filter((app) => dpdBand(app.servicing.dpd) === label);
    return {
      label,
      count: rows.length,
      outstanding: rows.reduce((sum, app) => sum + app.servicing.outstanding, 0),
      share: pct(rows.length, total),
    };
  });

  const dsaRows = dsas.map((dsa) => {
    const rows = allApps.filter((app) => app.dsaId === dsa.id);
    const dsaReleased = rows.filter((app) => app.disbursement.status === 'Released');
    const dsaNpa = rows.filter((app) => app.servicing.dpd >= rules.npaDpd);
    return {
      id: dsa.id,
      label: dsaDisplayName(dsa),
      owner: dsa.owner,
      count: rows.length,
      booked: dsaReleased.reduce((sum, app) => sum + app.amount, 0),
      conversion: pct(dsaReleased.length, rows.length),
      avgTicket: average(rows.map((app) => app.amount)),
      npa: dsaNpa.length,
      npaExposure: dsaNpa.reduce((sum, app) => sum + app.servicing.outstanding, 0),
    };
  }).sort((a, b) => b.booked - a.booked || b.count - a.count);

  const exceptionRows = [
    { label: 'KYC blocked', count: kycBlocked.length, severity: kycBlocked.length ? 'High' : 'Clean', detail: `${pct(kycBlocked.length, total)} of pipeline` },
    { label: 'Document gaps', count: docsGaps.length, severity: docsGaps.length ? 'Medium' : 'Clean', detail: `${Math.round(docsCompletion * 100)}% avg completion` },
    { label: 'Credit refer queue', count: creditQueue.length, severity: creditQueue.length ? 'High' : 'Clean', detail: `${pct(creditQueue.length, total)} needs decision` },
    { label: 'KFS not accepted', count: allApps.filter((app) => app.sanction.generated && !app.sanction.kfsAccepted).length, severity: 'Medium', detail: 'Borrower acceptance friction' },
    { label: 'Mandate pending', count: allApps.filter((app) => app.stage === 'NACH + Disbursement' && app.nach.mandate !== 'Registered').length, severity: 'Medium', detail: 'Ops disbursal blocker' },
    { label: 'DPD cases', count: overdue.length, severity: overdue.length ? 'High' : 'Clean', detail: formatMoney(overdueExposure) },
  ];

  return {
    total,
    released,
    active,
    npa,
    overdue,
    totalRequested,
    totalBooked,
    outstanding,
    overdueExposure,
    npaExposure,
    avgTicket,
    avgFoir,
    avgScore,
    docsCompletion,
    kycPassRate: pct(kycPassed, total),
    conversion: pct(released.length, total),
    portfolioAtRisk: pct(overdueExposure, outstanding),
    npaRate: pct(npa.length, active.length || total),
    stages,
    riskRows,
    dpdRows,
    dsaRows,
    exceptionRows,
    sourceRows: buildBreakdown(allApps, (app) => app.source, total),
    tenureRows: buildBreakdown(allApps, (app) => `${app.tenure} months`, total),
    ticketRows: buildBreakdown(allApps, (app) => ticketBand(app.amount), total),
  };
}

function Sparkline({ series, height = 64, color = 'var(--green-dark)', fill = 'rgba(109, 207, 106, 0.18)' }) {
  if (!series.length) return null;
  const w = 320;
  const h = height;
  const pad = 6;
  const max = Math.max(1, ...series.map((p) => p.value));
  const step = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0;
  const points = series.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M${pad},${h - pad} L${points.join(' L')} L${(pad + (series.length - 1) * step).toFixed(1)},${h - pad} Z`;
  return (
    <svg className="dash-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img">
      <path d={area} fill={fill} />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function DonutChart({ slices, size = 168, thickness = 26, centerLabel, centerValue }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="dash-donut">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line-soft)" strokeWidth={thickness} />
        {total > 0 && slices.map((s) => {
          const dash = (s.value / total) * circ;
          const seg = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return seg;
        })}
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="dash-donut-value">{centerValue}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="dash-donut-label">{centerLabel}</text>
      </svg>
      <ul className="dash-donut-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <small>{total ? `${Math.round((s.value / total) * 100)}%` : '0%'}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HBarRow({ label, value, max, detail, color = 'var(--green-2)' }) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="dash-hbar">
      <span className="dash-hbar-label">{label}</span>
      <div className="dash-hbar-track"><i style={{ width: `${w}%`, background: color }} /></div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function buildDashboardSnapshot(allApps, rules) {
  const t = today();
  const t1 = today(-1);
  const t7 = today(-6);
  const newToday = allApps.filter((a) => a.createdAt === t).length;
  const newYesterday = allApps.filter((a) => a.createdAt === t1).length;
  const new7d = allApps.filter((a) => a.createdAt >= t7).length;
  const disbursedToday = allApps.filter((a) => a.disbursement?.releasedAt === t);
  const disbursed7d = allApps.filter((a) => a.disbursement?.releasedAt && a.disbursement.releasedAt >= t7);
  const collectionsToday = allApps.reduce((sum, app) => {
    const sch = app.servicing?.schedule || [];
    return sum + sch.filter((e) => e.dueDate === t && !e.paid).reduce((s, e) => s + (e.amount || 0), 0);
  }, 0);
  const overdueNow = allApps.filter((a) => (a.servicing?.dpd || 0) > 0);
  const overdueAmount = overdueNow.reduce((sum, a) => sum + (a.servicing?.outstanding || 0), 0);
  const series30 = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = today(-i);
    series30.push({
      date: d,
      leads: allApps.filter((a) => a.createdAt === d).length,
      disbursed: allApps.filter((a) => a.disbursement?.releasedAt === d).length,
    });
  }
  const slaBreaches = allApps.filter((app) => {
    if (['Loan Servicing', 'Closed / NPA'].includes(app.stage)) return false;
    const created = new Date(app.createdAt || t);
    const days = Math.round((new Date(t) - created) / (1000 * 60 * 60 * 24));
    return days >= 7;
  });
  return {
    newToday,
    newYesterday,
    new7d,
    disbursedToday,
    disbursed7d,
    collectionsToday,
    overdueNow,
    overdueAmount,
    series30,
    slaBreaches,
  };
}

function DashboardPage({ apps, allApps, selected, setSelectedId, dsas, rules, setActiveNav }) {
  const analytics = buildPortfolioAnalytics(allApps, dsas, rules);
  const snapshot = buildDashboardSnapshot(allApps, rules);
  const go = (nav) => () => { if (typeof setActiveNav === 'function') setActiveNav(nav); };

  const kfsPending = allApps.filter((a) => a.sanction?.generated && !a.sanction?.kfsAccepted).length;
  const nachPending = allApps.filter((a) => a.stage === 'NACH + Disbursement' && a.nach?.mandate !== 'Registered').length;
  const creditQueueCount = allApps.filter((a) => a.stage === 'Credit Underwriting' || a.credit?.decision === 'Refer').length;
  const kycBlockedCount = analytics.exceptionRows[0].count;

  const dpdColors = ['#4fb159', '#f1b162', '#e8964a', '#dd6f47', '#ef6a6a'];
  const dpdSlices = analytics.dpdRows.map((r, i) => ({ label: r.label, value: r.count, color: dpdColors[i] || '#999' }));

  const sourceColors = ['#297a37', '#4fb159', '#6dcf6a', '#a4cd9c', '#4eb699', '#f1b162'];
  const sourceSlices = analytics.sourceRows.map((r, i) => ({ label: r.label, value: r.count, color: sourceColors[i % sourceColors.length] }));

  const stageMax = Math.max(1, ...analytics.stages.map((s) => s.count));
  const ticketMax = Math.max(1, ...analytics.ticketRows.map((r) => r.count));
  const trendMax = Math.max(1, ...snapshot.series30.flatMap((p) => [p.leads, p.disbursed]));
  const sparkLeads = snapshot.series30.map((p) => ({ value: p.leads }));
  const sparkDisb = snapshot.series30.map((p) => ({ value: p.disbursed }));

  const topDsas = analytics.dsaRows.slice(0, 5);
  const dsaMax = Math.max(1, ...topDsas.map((d) => d.booked));

  const todayIntakeDelta = snapshot.newToday - snapshot.newYesterday;
  const queue = allApps.filter((app) => ['KYC Pending', 'Docs Hold', 'Credit Queue', 'Mandate Pending', 'NPA'].includes(app.status));

  const exceptionNav = {
    'KYC blocked': 'KYC Verification',
    'Document gaps': 'Loan Applications',
    'Credit refer queue': 'Credit Review',
    'KFS not accepted': 'E-Sign',
    'Mandate pending': 'Disbursement',
    'DPD cases': 'Collections',
  };

  return (
    <div className="dashboard-layout">
      <section className="hero-panel dash-hero">
        <div>
          <h1>Portfolio Command Center</h1>
          <p>Live view of pipeline, disbursement, collections, exceptions, and channel performance — click any tile to drill in.</p>
        </div>
        <div className="rule-strip">
          <strong>{formatMoney(rules.maxAmount)}</strong><span>Max ticket</span>
          <strong>{(rules.annualFlatRate * 100).toFixed(0)}%</strong><span>Flat p.a.</span>
          <strong>{rules.tenures[0]}-{rules.tenures.at(-1)} mo</strong><span>Tenure</span>
          <strong>{rules.minBureauScore}</strong><span>Min bureau</span>
        </div>
      </section>

      <section className="kpi-row">
        <Metric icon={Users} label="Pipeline" value={analytics.total} trend={`${analytics.conversion} converted`} onClick={go('Lead List')} />
        <Metric icon={BadgeIndianRupee} label="Booked value" value={formatMoney(analytics.totalBooked)} trend={`${formatMoney(analytics.avgTicket)} avg ticket`} onClick={go('Disbursement')} />
        <Metric icon={ReceiptIndianRupee} label="Outstanding" value={formatMoney(analytics.outstanding)} trend={`${analytics.portfolioAtRisk} at risk`} onClick={go('Collections')} />
        <Metric icon={AlertTriangle} label="NPA 90+" value={analytics.npa.length} trend={`${formatMoney(analytics.npaExposure)} · ${analytics.npaRate}`} onClick={go('Delinquency Report')} />
        <Metric icon={Gauge} label="Avg FOIR" value={`${(analytics.avgFoir * 100).toFixed(1)}%`} trend={`Limit ${(rules.foirThreshold * 100).toFixed(0)}%`} />
        <Metric icon={ShieldCheck} label="KYC pass" value={analytics.kycPassRate} trend={`${kycBlockedCount} blocked`} onClick={go('KYC Verification')} />
        <Metric icon={FileCheck2} label="KFS pending" value={kfsPending} trend="Awaiting accept" onClick={go('E-Sign')} />
        <Metric icon={BanknoteArrowDown} label="NACH pending" value={nachPending} trend="Ops queue" onClick={go('Disbursement')} />
      </section>

      <section className="dash-today-grid">
        <Panel title="Today's Snapshot" subtitle={`As of ${today()}`}>
          <div className="dash-today">
            <button type="button" className="dash-today-card" onClick={go('Leads')}>
              <span>New leads today</span>
              <strong>{snapshot.newToday}</strong>
              <em className={todayIntakeDelta >= 0 ? 'pos' : 'neg'}>
                {todayIntakeDelta >= 0 ? '+' : ''}{todayIntakeDelta} vs yest · {snapshot.new7d} in 7d
              </em>
            </button>
            <button type="button" className="dash-today-card" onClick={go('Disbursement')}>
              <span>Disbursed today</span>
              <strong>{snapshot.disbursedToday.length}</strong>
              <em>{formatMoney(snapshot.disbursedToday.reduce((s, a) => s + a.amount, 0))} · {snapshot.disbursed7d.length} in 7d</em>
            </button>
            <button type="button" className="dash-today-card" onClick={go('Collections')}>
              <span>Collections due today</span>
              <strong>{formatMoney(snapshot.collectionsToday)}</strong>
              <em>EMI demand</em>
            </button>
            <button type="button" className="dash-today-card" onClick={go('Collections')}>
              <span>Overdue now</span>
              <strong>{snapshot.overdueNow.length}</strong>
              <em>{formatMoney(snapshot.overdueAmount)} exposure</em>
            </button>
            <button type="button" className="dash-today-card" onClick={go('Credit Review')}>
              <span>Credit queue</span>
              <strong>{creditQueueCount}</strong>
              <em>Awaiting decision</em>
            </button>
            <button type="button" className="dash-today-card" onClick={go('Loan Applications')}>
              <span>SLA breaches</span>
              <strong>{snapshot.slaBreaches.length}</strong>
              <em>Stuck 7d+ in stage</em>
            </button>
          </div>
        </Panel>
        <Panel title="30-day Trend" subtitle={`Daily intake vs disbursement · max ${trendMax}/day`}>
          <div className="dash-trend">
            <div className="dash-trend-row">
              <div className="dash-trend-meta">
                <i style={{ background: 'var(--green-dark)' }} />
                <span>Leads created</span>
                <strong>{snapshot.series30.reduce((s, p) => s + p.leads, 0)}</strong>
              </div>
              <Sparkline series={sparkLeads} color="var(--green-dark)" fill="rgba(41, 122, 55, 0.18)" />
            </div>
            <div className="dash-trend-row">
              <div className="dash-trend-meta">
                <i style={{ background: 'var(--cyan)' }} />
                <span>Disbursed</span>
                <strong>{snapshot.series30.reduce((s, p) => s + p.disbursed, 0)}</strong>
              </div>
              <Sparkline series={sparkDisb} color="var(--cyan)" fill="rgba(78, 182, 153, 0.18)" />
            </div>
          </div>
        </Panel>
      </section>

      <section className="analysis-grid">
        <Panel title="Lifecycle Funnel" subtitle="Stage stock with rupee exposure.">
          <div className="dash-funnel">
            {analytics.stages.map((stage) => (
              <HBarRow
                key={stage.label}
                label={stage.label}
                value={stage.count}
                max={stageMax}
                detail={`${stage.share} · ${formatMoney(stage.exposure)}`}
                color="var(--green-2)"
              />
            ))}
          </div>
        </Panel>
        <Panel title="DPD Buckets" subtitle="Where the book sits today.">
          <DonutChart
            slices={dpdSlices}
            centerValue={analytics.overdue.length}
            centerLabel="overdue"
          />
        </Panel>
      </section>

      <section className="analysis-grid">
        <Panel title="Source Mix" subtitle="Channel contribution to pipeline.">
          <DonutChart
            slices={sourceSlices}
            centerValue={analytics.total}
            centerLabel="apps"
          />
        </Panel>
        <Panel title="Ticket Size Mix" subtitle="Loan amount concentration.">
          <div className="dash-funnel">
            {analytics.ticketRows.map((row) => (
              <HBarRow key={row.label} label={row.label} value={row.count} max={ticketMax} detail={row.share} color="var(--cyan)" />
            ))}
          </div>
        </Panel>
      </section>

      <section className="analysis-grid">
        <Panel title="Top DSAs by Booked Value" subtitle="Channel performance leaderboard.">
          {topDsas.length ? (
            <div className="dash-leaderboard">
              {topDsas.map((dsa, i) => (
                <div key={dsa.id} className="dash-leader-row">
                  <span className="dash-leader-rank">#{i + 1}</span>
                  <div className="dash-leader-meta">
                    <strong>{dsa.label}</strong>
                    <small>{dsa.owner} · {dsa.count} apps · {dsa.conversion} conv</small>
                  </div>
                  <div className="dash-leader-bar"><i style={{ width: `${(dsa.booked / dsaMax) * 100}%` }} /></div>
                  <div className="dash-leader-value">
                    <strong>{formatMoney(dsa.booked)}</strong>
                    <small>{dsa.npa ? `${dsa.npa} NPA` : 'Clean'}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No DSA performance yet" detail="Channel data will appear once bookings come in." />}
        </Panel>
        <Panel title="Exception Control Tower" subtitle="What to attack first — click to open queue.">
          <div className="dash-exceptions">
            {analytics.exceptionRows.map((row) => (
              <button
                key={row.label}
                type="button"
                className="dash-exception-row"
                onClick={go(exceptionNav[row.label] || 'Loan Applications')}
              >
                <span className="dash-exception-label">{row.label}</span>
                <strong>{row.count}</strong>
                <Status value={row.severity} />
                <small>{row.detail}</small>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </Panel>
      </section>

      <section className="analysis-grid">
        <Panel title="Executive Diagnostics" subtitle="Portfolio health at a glance.">
          <div className="insight-grid">
            <Insight label="KYC pass rate" value={analytics.kycPassRate} detail={`${kycBlockedCount} blocked`} />
            <Insight label="Document completion" value={`${Math.round(analytics.docsCompletion * 100)}%`} detail={`${analytics.exceptionRows[1].count} incomplete`} />
            <Insight label="Bureau strength" value={analytics.avgScore ? Math.round(analytics.avgScore) : '-'} detail={`Policy min ${rules.minBureauScore}`} />
            <Insight label="PAR exposure" value={formatMoney(analytics.overdueExposure)} detail={`${analytics.portfolioAtRisk} of outstanding`} />
            <Insight label="Avg ticket" value={formatMoney(analytics.avgTicket)} detail={`${analytics.released.length} disbursed`} />
            <Insight label="NPA exposure" value={formatMoney(analytics.npaExposure)} detail={`${analytics.npa.length} loans @ 90+`} />
          </div>
        </Panel>
        <Panel title="Action Queue" subtitle="Live items needing a role decision.">
          <div className="action-list">
            {queue.length ? queue.slice(0, 12).map((app) => (
              <button key={app.id} onClick={() => setSelectedId(app.id)}>
                <span><strong>{app.customer}</strong><small>{app.customerCode} · {app.id} · {app.status}</small></span>
                <Status value={app.stage} />
              </button>
            )) : <EmptyState title="No work items" detail="Queues are clear." />}
          </div>
        </Panel>
      </section>

    </div>
  );
}

function LeadsPage({ apps, createLead, deleteLeadDraft, dsas, agents, rules, dropdownOptions, setSelectedId, session }) {
  const activePolicy = useMemo(
    () => findUserAccessPolicy(session?.email, dropdownOptions.userAccessPolicies || dropdownOptions.emailPolicies),
    [dropdownOptions.emailPolicies, dropdownOptions.userAccessPolicies, session?.email]
  );
  const allowedLoanAmounts = useMemo(
    () => constrainOptions(dropdownOptions.loanAmounts, activePolicy?.loanAmounts),
    [activePolicy?.loanAmounts, dropdownOptions.loanAmounts]
  );
  const allowedTenures = useMemo(
    () => constrainOptions(rules.tenures, activePolicy?.tenures),
    [activePolicy?.tenures, rules.tenures]
  );
  const allowedBatteryModels = useMemo(
    () => constrainOptions(dropdownOptions.batteryModels, activePolicy?.batteryModels),
    [activePolicy?.batteryModels, dropdownOptions.batteryModels]
  );
  const allowedCompanyMakes = useMemo(
    () => constrainOptions(dropdownOptions.companyMakes, activePolicy?.companyMakes),
    [activePolicy?.companyMakes, dropdownOptions.companyMakes]
  );
  const minAllowedInterestRate = Math.max(
    MIN_LOAN_INTEREST_RATE,
    Number.isFinite(activePolicy?.minInterestRate) ? activePolicy.minInterestRate : MIN_LOAN_INTEREST_RATE
  );
  const maxAllowedInterestRate = Math.max(
    minAllowedInterestRate,
    Math.min(
      MAX_LOAN_INTEREST_RATE,
      Number.isFinite(activePolicy?.maxInterestRate) ? activePolicy.maxInterestRate : MAX_LOAN_INTEREST_RATE
    )
  );
  const allowedDsas = useMemo(
    () => activePolicy?.dsaId ? dsas.filter((dsa) => dsa.id === activePolicy.dsaId) : dsas,
    [activePolicy?.dsaId, dsas]
  );
  const allowedAgents = useMemo(
    () => activePolicy?.agentId ? agents.filter((agent) => agent.id === activePolicy.agentId) : agents,
    [activePolicy?.agentId, agents]
  );

  const [form, setForm] = useState(() => {
    const defaults = {
    customer: '',
    mobile: '+91 ',
    aadhaar: '',
    pan: '',
    dob: todayForDob(30),
    fatherName: '',
    loanNo: nextLoanNumber(apps),
    loanDate: today(),
    firstEmiDate: addMonthsToDate(today(), 1),
    remark: '',
    amount: allowedLoanAmounts[0],
    tenure: allowedTenures[0],
    interestRate: Math.min(maxAllowedInterestRate, Math.max(minAllowedInterestRate, DEFAULT_LOAN_INTEREST_RATE)),
    monthlyIncome: formatNumberInput(24000),
    existingEmi: '',
    fileCharge: 2000,
    processingFee: 2000,
    repaymentFrequency: 'Daily',
    source: dropdownOptions.sources[0],
    dsaId: allowedDsas[0]?.id || '',
    agentId: allowedAgents[0]?.id || '',
    companyMake: allowedCompanyMakes[0],
    batteryModel: allowedBatteryModels[0],
    vehicleDetails: {
      condition: 'New',
      usage: 'Commercial',
      manufacture: '',
      category: '',
      modelName: '',
      variant: '',
      manufactureYear: '',
      registrationNo: '',
      registrationDate: '',
      registrationExpiryDate: '',
      fuelType: '',
      roadTaxUpto: '',
      color: '',
    },
    bankDetails: {
      bankName: '',
      accountNo: '',
      ifsc: '',
      accountHolderName: '',
      branch: '',
    },
    referenceContacts: [createReferenceContact()],
    electricityBills: [],
    itrImages: [],
    aadhaarImages: [],
    monthlyExpense: '',
    livingAddress: '',
    livingSince: '',
    residenceType: '',
    ownershipType: '',
    ovd: {
      dlNumber: '',
      dlDob: '',
      epicNumber: '',
      voterName: '',
      vehicleNumber: '',
    },
    };
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LEAD_FORM_DRAFT_KEY) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed, loanNo: defaults.loanNo };
      }
    } catch (error) {
      console.warn('Failed to restore lead draft', error);
    }
    return defaults;
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(LEAD_FORM_DRAFT_KEY, JSON.stringify(form));
    } catch (error) {
      console.warn('Failed to persist lead draft', error);
    }
  }, [form]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [billUploadError, setBillUploadError] = useState('');
  const [uploadingBills, setUploadingBills] = useState(false);
  const [itrUploadError, setItrUploadError] = useState('');
  const [uploadingItrImages, setUploadingItrImages] = useState(false);
  const [aadhaarUploadError, setAadhaarUploadError] = useState('');
  const [uploadingAadhaarImages, setUploadingAadhaarImages] = useState(false);
  const [draftActionError, setDraftActionError] = useState('');
  const [deletingDraftId, setDeletingDraftId] = useState('');
  const draftLeads = useMemo(() => apps.filter(isDraftApplication), [apps]);
  const duplicate = apps.find((app) => app.mobile.replace(/\D/g, '') === form.mobile.replace(/\D/g, '') && form.mobile.replace(/\D/g, '').length >= 10);

  function continueDraft(app) {
    setDraftActionError('');
    setSelectedId(app.id);
    setForm((current) => ({
      ...current,
      customer: app.customer || '',
      mobile: app.mobile || '+91 ',
      aadhaar: app.aadhaar || '',
      pan: app.pan || '',
      dob: app.dob || current.dob,
      fatherName: app.fatherName || '',
      loanNo: app.id || current.loanNo,
      loanDate: app.createdAt || today(),
      firstEmiDate: addMonthsToDate(app.createdAt || today(), 1),
      remark: app.loanRemark || '',
      amount: app.amount || current.amount,
      tenure: app.tenure || current.tenure,
      interestRate: app.rate || current.interestRate,
      monthlyIncome: formatNumberInput(app.monthlyIncome || ''),
      existingEmi: formatNumberInput(app.existingEmi || ''),
      fileCharge: app.fileCharge || current.fileCharge,
      processingFee: app.processingFee || current.processingFee,
      repaymentFrequency: app.repaymentFrequency || current.repaymentFrequency,
      source: app.source || current.source,
      dsaId: app.dsaId || current.dsaId,
      agentId: app.agentId || current.agentId,
      companyMake: app.companyMake || current.companyMake,
      batteryModel: app.batteryModel || current.batteryModel,
      vehicleDetails: { ...current.vehicleDetails, ...(app.vehicleDetails || {}) },
      bankDetails: { ...current.bankDetails, ...(app.bankDetails || {}) },
      referenceContacts: app.referenceContacts?.length ? app.referenceContacts : [createReferenceContact()],
      electricityBills: app.electricityBills || [],
      itrImages: app.itrImages || [],
      aadhaarImages: app.aadhaarImages || [],
      monthlyExpense: formatNumberInput(app.monthlyExpense || ''),
      livingAddress: app.livingAddress || '',
      livingSince: app.livingSince || '',
      residenceType: app.residenceType || '',
      ownershipType: app.ownershipType || '',
    }));
  }

  async function removeDraft(app) {
    setDraftActionError('');
    setDeletingDraftId(app.id);
    try {
      await deleteLeadDraft(app.id);
      if (form.loanNo === app.id) {
        setForm((current) => ({ ...current, loanNo: nextLoanNumber(apps) }));
      }
    } catch (error) {
      setDraftActionError(error.message || 'Draft could not be deleted. Please try again.');
    } finally {
      setDeletingDraftId('');
    }
  }

  async function handleElectricityBillUpload(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    setBillUploadError('');

    if (!selectedFiles.length) return;
    if (selectedFiles.some((file) => !String(file.type || '').startsWith('image/'))) {
      setBillUploadError('Only image files are allowed for electricity bill upload.');
      return;
    }

    const availableSlots = 2 - form.electricityBills.length;
    if (availableSlots <= 0) {
      setBillUploadError('Maximum 2 electricity bill images can be uploaded.');
      return;
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);
    if (filesToProcess.length < selectedFiles.length) {
      setBillUploadError('Only first 2 images are allowed.');
    }

    setUploadingBills(true);
    try {
      const compressedBills = await Promise.all(
        filesToProcess.map(async (file) => {
          const compressed = await compressImageToLimit(file, 100 * 1024);
          if (compressed.size > 100 * 1024) {
            throw new Error(`"${file.name}" could not be compressed below 100 KB.`);
          }
          return compressed;
        }),
      );
      setForm((current) => ({
        ...current,
        electricityBills: [...current.electricityBills, ...compressedBills].slice(0, 2),
      }));
    } catch (error) {
      setBillUploadError(error.message || 'Unable to upload electricity bill image.');
    } finally {
      setUploadingBills(false);
    }
  }

  function removeElectricityBill(indexToRemove) {
    setBillUploadError('');
    setForm((current) => ({
      ...current,
      electricityBills: current.electricityBills.filter((_, index) => index !== indexToRemove),
    }));
  }

  async function handleItrImageUpload(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    setItrUploadError('');

    if (!selectedFiles.length) return;
    if (selectedFiles.some((file) => !String(file.type || '').startsWith('image/'))) {
      setItrUploadError('Only image files are allowed for ITR upload.');
      return;
    }

    const availableSlots = 3 - form.itrImages.length;
    if (availableSlots <= 0) {
      setItrUploadError('Maximum 3 ITR images can be uploaded.');
      return;
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);
    if (filesToProcess.length < selectedFiles.length) {
      setItrUploadError('Only first 3 ITR images are allowed.');
    }

    setUploadingItrImages(true);
    try {
      const compressedItrImages = await Promise.all(
        filesToProcess.map(async (file) => {
          const compressed = await compressImageToLimit(file, 100 * 1024);
          if (compressed.size > 100 * 1024) {
            throw new Error(`"${file.name}" could not be compressed below 100 KB.`);
          }
          return compressed;
        }),
      );
      setForm((current) => ({
        ...current,
        itrImages: [...current.itrImages, ...compressedItrImages].slice(0, 3),
      }));
    } catch (error) {
      setItrUploadError(error.message || 'Unable to upload ITR image.');
    } finally {
      setUploadingItrImages(false);
    }
  }

  function removeItrImage(indexToRemove) {
    setItrUploadError('');
    setForm((current) => ({
      ...current,
      itrImages: current.itrImages.filter((_, index) => index !== indexToRemove),
    }));
  }

  async function handleAadhaarImageUpload(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    setAadhaarUploadError('');

    if (!selectedFiles.length) return;
    if (selectedFiles.some((file) => !String(file.type || '').startsWith('image/'))) {
      setAadhaarUploadError('Only image files are allowed for Aadhaar upload.');
      return;
    }

    const availableSlots = 2 - form.aadhaarImages.length;
    if (availableSlots <= 0) {
      setAadhaarUploadError('Maximum 2 Aadhaar images (front and back) can be uploaded.');
      return;
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);
    if (filesToProcess.length < selectedFiles.length) {
      setAadhaarUploadError('Only first 2 Aadhaar images are allowed.');
    }

    setUploadingAadhaarImages(true);
    try {
      const compressedAadhaarImages = await Promise.all(
        filesToProcess.map(async (file) => {
          const compressed = await compressImageToLimit(file, 100 * 1024);
          if (compressed.size > 100 * 1024) {
            throw new Error(`"${file.name}" could not be compressed below 100 KB.`);
          }
          return compressed;
        }),
      );
      setForm((current) => ({
        ...current,
        aadhaarImages: [...current.aadhaarImages, ...compressedAadhaarImages].slice(0, 2),
      }));
    } catch (error) {
      setAadhaarUploadError(error.message || 'Unable to upload Aadhaar image.');
    } finally {
      setUploadingAadhaarImages(false);
    }
  }

  function removeAadhaarImage(indexToRemove) {
    setAadhaarUploadError('');
    setForm((current) => ({
      ...current,
      aadhaarImages: current.aadhaarImages.filter((_, index) => index !== indexToRemove),
    }));
  }

  function updateVehicleDetails(field, value) {
    setForm((current) => ({
      ...current,
      vehicleDetails: { ...current.vehicleDetails, [field]: value },
    }));
  }

  function updateBankDetails(field, value) {
    setForm((current) => ({
      ...current,
      bankDetails: { ...current.bankDetails, [field]: value },
    }));
  }

  function updateReferenceContact(indexToUpdate, field, value) {
    setForm((current) => ({
      ...current,
      referenceContacts: current.referenceContacts.map((contact, index) => (
        index === indexToUpdate ? { ...contact, [field]: value } : contact
      )),
    }));
  }

  function addReferenceContact() {
    setForm((current) => ({
      ...current,
      referenceContacts: [...current.referenceContacts, createReferenceContact()],
    }));
  }

  function removeReferenceContact(indexToRemove) {
    setForm((current) => ({
      ...current,
      referenceContacts: current.referenceContacts.length > 1
        ? current.referenceContacts.filter((_, index) => index !== indexToRemove)
        : current.referenceContacts,
    }));
  }

  async function handleSubmit(event, { asDraft = false } = {}) {
    if (event?.preventDefault) event.preventDefault();
    const normalizedPan = normalizePanInput(form.pan);
    if (!normalizedPan) {
      setSaveError('PAN is mandatory. Please enter the customer PAN before saving.');
      return;
    }
    if (!panValid(normalizedPan)) {
      setSaveError('PAN format is invalid. Use 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
      return;
    }
    setSaving(true);
    setSaveError('');

    try {
      await createLead({
        ...form,
        pan: normalizedPan,
        asDraft,
      });
      try { window.localStorage.removeItem(LEAD_FORM_DRAFT_KEY); } catch (error) { /* ignore */ }
      setForm((current) => ({
        ...current,
        customer: '',
        aadhaar: '',
        pan: '',
        mobile: '+91 ',
        fatherName: '',
        loanNo: nextLoanNumber([...apps, { id: current.loanNo }]),
        loanDate: today(),
        firstEmiDate: addMonthsToDate(today(), 1),
        remark: '',
        vehicleDetails: {
          condition: 'New',
          usage: 'Commercial',
          manufacture: '',
          category: '',
          modelName: '',
          variant: '',
          manufactureYear: '',
          registrationNo: '',
          registrationDate: '',
          registrationExpiryDate: '',
          fuelType: '',
          roadTaxUpto: '',
          color: '',
        },
        bankDetails: {
          bankName: '',
          accountNo: '',
          ifsc: '',
          accountHolderName: '',
          branch: '',
        },
        referenceContacts: [createReferenceContact()],
        electricityBills: [],
        itrImages: [],
        aadhaarImages: [],
        monthlyExpense: '',
        livingAddress: '',
        livingSince: '',
        residenceType: '',
        ownershipType: '',
        ovd: {
          dlNumber: '',
          dlDob: '',
          epicNumber: '',
          voterName: '',
          vehicleNumber: '',
        },
      }));
    } catch (error) {
      console.error(error);
      setSaveError(error.message || 'Lead could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    setForm((current) => {
      const dsaId = allowedDsas.some((dsa) => dsa.id === current.dsaId) ? current.dsaId : allowedDsas[0]?.id || '';
      const dsaAgents = allowedAgents.filter((agent) => agent.dsaId === dsaId);
      const agentId = dsaAgents.some((agent) => agent.id === current.agentId) ? current.agentId : dsaAgents[0]?.id || '';
      return {
        ...current,
        amount: Number(current.amount) || 0,
        tenure: allowedTenures.includes(Number(current.tenure)) ? current.tenure : allowedTenures[0],
        interestRate: Math.min(maxAllowedInterestRate, Math.max(minAllowedInterestRate, Number(current.interestRate || DEFAULT_LOAN_INTEREST_RATE))),
        repaymentFrequency: REPAYMENT_FREQUENCY_OPTIONS.some((option) => option.value === current.repaymentFrequency && !option.disabled) ? current.repaymentFrequency : 'Daily',
        source: dropdownOptions.sources.includes(current.source) ? current.source : dropdownOptions.sources[0],
        dsaId,
        agentId,
        companyMake: allowedCompanyMakes.includes(current.companyMake) ? current.companyMake : allowedCompanyMakes[0],
        batteryModel: allowedBatteryModels.includes(current.batteryModel) ? current.batteryModel : allowedBatteryModels[0],
      };
    });
  }, [allowedAgents, allowedBatteryModels, allowedCompanyMakes, allowedDsas, allowedLoanAmounts, allowedTenures, dropdownOptions, maxAllowedInterestRate, minAllowedInterestRate]);

  const dailyEmi = dailyEmiFor(form.amount, form.tenure, form.interestRate);
  const weeklyEmi = weeklyEmiFor(form.amount, form.tenure, form.interestRate);
  const monthlyEmi = emiFor(form.amount, form.tenure, form.interestRate);
  const totalDue = totalPayable(form.amount, form.tenure, form.interestRate);
  const selectedRepayment = repaymentAmountFor(form.repaymentFrequency, form.amount, form.tenure, form.interestRate);
  const dsaAgents = allowedAgents.filter((agent) => agent.dsaId === form.dsaId);

  return (
    <form className="lead-capture-layout" onSubmit={handleSubmit}>
      <section className="lead-main-column">
        <div className="lead-page-header">
          <div>
            <h1>Lead / Enquiry Capture</h1>
            <p>Capture customer, loan, and sourcing details for battery finance onboarding.</p>
          </div>
          <div className="lead-header-actions">
            <button className="secondary-action save-draft-action" type="button" disabled={saving} onClick={() => handleSubmit(null, { asDraft: true })}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button className="primary-action submit-lead-action" type="submit" disabled={saving}>
              {saving ? 'Saving lead...' : 'Submit Lead'}
            </button>
          </div>
        </div>

        <section className="lead-form-card">
          <div className="lead-section">
            <h2>Customer Info</h2>
            <div className="form-grid">
              <Field label="Customer name"><input required value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} /></Field>
              <Field label="Customer code"><input readOnly value={form.customer.trim() ? customerCodeFor(form.customer, form.loanDate, apps.map((entry) => entry.customerCode)) : ''} placeholder="Auto generated" /></Field>
              <Field label="Mobile">
                <div className="phone-input">
                  <span>{INDIA_DIAL_CODE}</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Mobile number"
                    value={localMobileDigits(form.mobile)}
                    onChange={(event) => setForm({ ...form, mobile: formatIndianMobile(event.target.value) })}
                  />
                </div>
              </Field>
              <Field label="Aadhaar">
                <input
                  required
                  value={maskAadhaarTyping(form.aadhaar)}
                  inputMode="numeric"
                  maxLength={12}
                  pattern="X{8}[0-9]{4}|[0-9]{1,12}"
                  title="Enter 12-digit Aadhaar number"
                  onChange={(event) => {
                    const newDisplay = event.target.value;
                    const currentDigits = form.aadhaar || '';
                    const currentDisplay = maskAadhaarTyping(currentDigits);
                    let nextDigits = currentDigits;
                    if (newDisplay.length > currentDisplay.length) {
                      const appended = newDisplay.slice(currentDisplay.length).replace(/\D/g, '');
                      nextDigits = normalizeAadhaarInput(currentDigits + appended);
                    } else if (newDisplay.length < currentDisplay.length) {
                      const removeCount = currentDisplay.length - newDisplay.length;
                      nextDigits = currentDigits.slice(0, Math.max(0, currentDigits.length - removeCount));
                    } else {
                      nextDigits = normalizeAadhaarInput(newDisplay.replace(/X/gi, ''));
                    }
                    setForm({ ...form, aadhaar: nextDigits });
                  }}
                />
              </Field>
              <Field label="PAN *">
                <input
                  required
                  value={form.pan}
                  maxLength={10}
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                  title="PAN must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)"
                  onChange={(event) => setForm({ ...form, pan: normalizePanInput(event.target.value) })}
                />
                <small className="hint">PAN is mandatory and will be verified in KYC Verification.</small>
              </Field>
              <Field label="Date of birth"><input required type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} /></Field>
              <Field label="Father name"><input value={form.fatherName} onChange={(event) => setForm({ ...form, fatherName: event.target.value })} /></Field>
              <Field label="Aadhaar card images (front & back)">
                <div className="bill-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAadhaarImageUpload}
                    disabled={uploadingAadhaarImages || form.aadhaarImages.length >= 2}
                  />
                  <small className="file-upload-hint">Each image is auto-compressed to max 100 KB before save.</small>
                  {uploadingAadhaarImages && <small className="file-upload-hint">Compressing images...</small>}
                  {aadhaarUploadError && <small className="file-upload-hint error">{aadhaarUploadError}</small>}
                  {!!form.aadhaarImages.length && (
                    <div className="bill-preview-list">
                      {form.aadhaarImages.map((aadhaarImage, index) => (
                        <div className="bill-preview-item" key={`${aadhaarImage.name}-${index}`}>
                          <img src={aadhaarImage.dataUrl} alt={`Aadhaar ${index + 1}`} />
                          <span>{aadhaarImage.name} ({Math.max(1, Math.round(aadhaarImage.size / 1024))} KB)</span>
                          <button type="button" onClick={() => removeAadhaarImage(index)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Electricity bill images (max 2)">
                <div className="bill-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleElectricityBillUpload}
                    disabled={uploadingBills || form.electricityBills.length >= 2}
                  />
                  <small className="file-upload-hint">Each image is auto-compressed to max 100 KB before save.</small>
                  {uploadingBills && <small className="file-upload-hint">Compressing images...</small>}
                  {!!form.electricityBills.length && (
                    <div className="bill-preview-list">
                      {form.electricityBills.map((bill, index) => (
                        <div className="bill-preview-item" key={`${bill.name}-${index}`}>
                          <img src={bill.dataUrl} alt={`Electricity bill ${index + 1}`} />
                          <span>{bill.name} ({Math.max(1, Math.round(bill.size / 1024))} KB)</span>
                          <button type="button" onClick={() => removeElectricityBill(index)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              <Field label="ITR images (max 3)">
                <div className="bill-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleItrImageUpload}
                    disabled={uploadingItrImages || form.itrImages.length >= 3}
                  />
                  <small className="file-upload-hint">Each image is auto-compressed to max 100 KB before save.</small>
                  {uploadingItrImages && <small className="file-upload-hint">Compressing images...</small>}
                  {!!form.itrImages.length && (
                    <div className="bill-preview-list">
                      {form.itrImages.map((itrImage, index) => (
                        <div className="bill-preview-item" key={`${itrImage.name}-${index}`}>
                          <img src={itrImage.dataUrl} alt={`ITR ${index + 1}`} />
                          <span>{itrImage.name} ({Math.max(1, Math.round(itrImage.size / 1024))} KB)</span>
                          <button type="button" onClick={() => removeItrImage(index)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div className="lead-section">
            <h2>OVD Verification Details</h2>
            <p className="lead-section-hint">Driving licence, voter ID, and vehicle RC. Captured here and frozen for KYC verification.</p>
            <div className="form-grid">
              <Field label="Driving licence number">
                <input
                  value={form.ovd.dlNumber}
                  maxLength={16}
                  onChange={(event) => setForm({ ...form, ovd: { ...form.ovd, dlNumber: event.target.value.toUpperCase().slice(0, 16) } })}
                  placeholder="DL state code + number"
                />
              </Field>
              <Field label="Voter EPIC number">
                <input
                  value={form.ovd.epicNumber}
                  maxLength={10}
                  onChange={(event) => setForm({ ...form, ovd: { ...form.ovd, epicNumber: event.target.value.toUpperCase().slice(0, 10) } })}
                  placeholder="EPIC card number"
                />
              </Field>
              <Field label="Vehicle registration number">
                <input
                  value={form.ovd.vehicleNumber}
                  maxLength={10}
                  onChange={(event) => setForm({ ...form, ovd: { ...form.ovd, vehicleNumber: event.target.value.toUpperCase().slice(0, 10) } })}
                  placeholder="e.g. DL01AB1234"
                />
              </Field>
            </div>
          </div>

          <div className="lead-section loan-info-section">
            <h2>Loan Info</h2>
            <div className="loan-info-body">
            <div className="form-grid">
              <Field label="Loan no"><input required value={form.loanNo} onChange={(event) => setForm({ ...form, loanNo: event.target.value.toUpperCase() })} /></Field>
              <Field label="Date"><input required type="date" value={form.loanDate} onChange={(event) => setForm({ ...form, loanDate: event.target.value, firstEmiDate: addMonthsToDate(event.target.value, 1) })} /></Field>
              <Field label="First EMI date"><input required type="date" value={form.firstEmiDate} onChange={(event) => setForm({ ...form, firstEmiDate: event.target.value })} /></Field>
              <Field label="Loan amount"><input required type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} /></Field>
              <Field label="Tenure"><select value={form.tenure} onChange={(event) => setForm({ ...form, tenure: Number(event.target.value) })}>{allowedTenures.map((tenure) => <option key={tenure} value={tenure}>{tenure} months</option>)}</select></Field>
              <Field label="Loan int">
                <div className="rate-slider">
                  <strong>{Math.round(form.interestRate * 100)}%</strong>
                  <input
                    type="range"
                    min={minAllowedInterestRate * 100}
                    max={maxAllowedInterestRate * 100}
                    step="1"
                    value={Math.round(form.interestRate * 100)}
                    onChange={(event) => setForm({ ...form, interestRate: Number(event.target.value) / 100 })}
                  />
                  <span>{Math.round(minAllowedInterestRate * 100)}% - {Math.round(maxAllowedInterestRate * 100)}%</span>
                </div>
              </Field>
              <Field label="Collection frequency">
                <select value={form.repaymentFrequency} onChange={(event) => setForm({ ...form, repaymentFrequency: event.target.value })}>
                  {REPAYMENT_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                      {option.disabled ? `${option.label} (blocked)` : option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Monthly income"><input value={form.monthlyIncome} inputMode="numeric" onChange={(event) => setForm({ ...form, monthlyIncome: formatNumberInput(event.target.value) })} /></Field>
              <Field label="Existing EMI"><input value={form.existingEmi} inputMode="numeric" onChange={(event) => setForm({ ...form, existingEmi: formatNumberInput(event.target.value) })} /></Field>
              <Field label="Monthly expense"><input value={form.monthlyExpense} inputMode="numeric" onChange={(event) => setForm({ ...form, monthlyExpense: formatNumberInput(event.target.value) })} /></Field>
              <Field label="File charge">
                <div className="rate-slider">
                  <strong>{formatMoney(form.fileCharge)}</strong>
                  <input
                    type="range"
                    min={2000}
                    max={5000}
                    step={500}
                    value={form.fileCharge}
                    onChange={(event) => setForm({ ...form, fileCharge: Number(event.target.value) })}
                  />
                  <span>{formatMoney(2000)} - {formatMoney(5000)}</span>
                </div>
              </Field>
              <Field label="Processing fee">
                <div className="rate-slider">
                  <strong>{formatMoney(form.processingFee)}</strong>
                  <input
                    type="range"
                    min={2000}
                    max={5000}
                    step={500}
                    value={form.processingFee}
                    onChange={(event) => setForm({ ...form, processingFee: Number(event.target.value) })}
                  />
                  <span>{formatMoney(2000)} - {formatMoney(5000)}</span>
                </div>
              </Field>
              <Field className="field-span-3" label="Remark"><textarea rows={3} value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} /></Field>
            </div>
            <div className="lead-emi-summary loan-info-emi">
              <div className="emi-card-header">
                <span>EMI preview</span>
                <strong>{formatMoney(selectedRepayment)}</strong>
                <small>{form.repaymentFrequency} collection</small>
              </div>
              <div className="emi-breakdown">
                <div className={form.repaymentFrequency === 'Daily' ? 'active' : ''}><span>Daily</span><strong>{formatMoney(dailyEmi)}</strong></div>
                <div className={form.repaymentFrequency === 'Weekly' ? 'active' : ''}><span>Weekly</span><strong>{formatMoney(weeklyEmi)}</strong></div>
                <div className="blocked"><span>Monthly</span><strong>{formatMoney(monthlyEmi)}</strong></div>
                <div><span>Total</span><strong>{formatMoney(totalDue)}</strong></div>
              </div>
            </div>
            </div>
          </div>

          <div className="lead-section">
            <h2>Vehicle Details</h2>
            <div className="form-grid">
              <Field label="Vehicle condition" required><select required value={form.vehicleDetails.condition} onChange={(event) => updateVehicleDetails('condition', event.target.value)}><option>New</option><option>Used</option></select></Field>
              <Field label="Vehicle use" required><select required value={form.vehicleDetails.usage} onChange={(event) => updateVehicleDetails('usage', event.target.value)}><option>Commercial</option><option>Personal</option></select></Field>
              <Field label="Vehicle manufacture" required><input required placeholder="Select Vehicle Manufacture" value={form.vehicleDetails.manufacture} onChange={(event) => updateVehicleDetails('manufacture', event.target.value)} /></Field>
              <Field label="Vehicle category" required><select required value={form.vehicleDetails.category} onChange={(event) => updateVehicleDetails('category', event.target.value)}><option value="">Select Vehicle Category</option>{(dropdownOptions.vehicleCategories || []).map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
              <Field label="Vehicle model name"><input placeholder="Select Vehicle Model Name" value={form.vehicleDetails.modelName} onChange={(event) => updateVehicleDetails('modelName', event.target.value)} /></Field>
              <Field label="Variant"><input value={form.vehicleDetails.variant} onChange={(event) => updateVehicleDetails('variant', event.target.value)} /></Field>
              <Field label="Manufacture year"><input inputMode="numeric" maxLength={4} value={form.vehicleDetails.manufactureYear} onChange={(event) => updateVehicleDetails('manufactureYear', formatNumberInput(event.target.value).slice(0, 4))} /></Field>
              <Field label="Vehicle registration no"><input value={form.vehicleDetails.registrationNo} onChange={(event) => updateVehicleDetails('registrationNo', event.target.value.toUpperCase())} /></Field>
              <Field label="Registration date"><input type="date" value={form.vehicleDetails.registrationDate} onChange={(event) => updateVehicleDetails('registrationDate', event.target.value)} /></Field>
              <Field label="Registration expiry date"><input type="date" value={form.vehicleDetails.registrationExpiryDate} onChange={(event) => updateVehicleDetails('registrationExpiryDate', event.target.value)} /></Field>
              <Field label="Fuel type"><select value={form.vehicleDetails.fuelType} onChange={(event) => updateVehicleDetails('fuelType', event.target.value)}><option value="">Select Fuel Type</option><option>Electric</option><option>Petrol</option><option>Diesel</option><option>CNG</option><option>LPG</option></select></Field>
              <Field label="Road tax upto"><input type="date" value={form.vehicleDetails.roadTaxUpto} onChange={(event) => updateVehicleDetails('roadTaxUpto', event.target.value)} /></Field>
              <Field label="Color"><input value={form.vehicleDetails.color} onChange={(event) => updateVehicleDetails('color', event.target.value)} /></Field>
            </div>
          </div>

          <div className="lead-section">
            <h2>Bank Details</h2>
            <div className="form-grid">
              <Field label="Bank name"><input value={form.bankDetails.bankName} onChange={(event) => updateBankDetails('bankName', event.target.value)} /></Field>
              <Field label="Account holder name"><input value={form.bankDetails.accountHolderName} onChange={(event) => updateBankDetails('accountHolderName', event.target.value)} /></Field>
              <Field label="Account no"><input inputMode="numeric" value={form.bankDetails.accountNo} onChange={(event) => updateBankDetails('accountNo', formatNumberInput(event.target.value))} /></Field>
              <Field label="IFSC"><input maxLength={11} value={form.bankDetails.ifsc} onChange={(event) => updateBankDetails('ifsc', event.target.value.toUpperCase())} /></Field>
              <Field label="Branch"><input value={form.bankDetails.branch} onChange={(event) => updateBankDetails('branch', event.target.value)} /></Field>
            </div>
          </div>

          <div className="lead-section">
            <div className="lead-section-title-row">
              <h2>Family And References</h2>
              <button className="secondary-action inline-add-action" type="button" onClick={addReferenceContact}><Plus size={15} /> Add</button>
            </div>
            <div className="reference-contact-list">
              {form.referenceContacts.map((contact, index) => (
                <div className="reference-contact-row" key={`reference-${index}`}>
                  <Field label="Relation type"><select value={contact.type} onChange={(event) => updateReferenceContact(index, 'type', event.target.value)}><option>Family</option><option>Friend</option><option>Relative</option></select></Field>
                  <Field label="Name"><input value={contact.name} onChange={(event) => updateReferenceContact(index, 'name', event.target.value)} /></Field>
                  <Field label="Contact no"><input inputMode="numeric" maxLength={10} pattern="[0-9]{10}" title="Enter a 10-digit phone number" value={contact.contactNo} onChange={(event) => updateReferenceContact(index, 'contactNo', event.target.value.replace(/\D/g, '').slice(0, 10))} /></Field>
                  <Field label="Address"><input value={contact.address} onChange={(event) => updateReferenceContact(index, 'address', event.target.value)} /></Field>
                  <button className="icon-button reference-remove-action" type="button" onClick={() => removeReferenceContact(index)} disabled={form.referenceContacts.length === 1} aria-label="Remove reference"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="lead-section">
            <h2>Residence Details</h2>
            <div className="form-grid">
              <Field label="Current living address"><input value={form.livingAddress} onChange={(event) => setForm({ ...form, livingAddress: event.target.value })} /></Field>
              <Field label="Living since"><input type="date" value={form.livingSince} onChange={(event) => setForm({ ...form, livingSince: event.target.value })} /></Field>
              <Field label="Residence type">
                <select value={form.residenceType || ''} onChange={(event) => setForm({ ...form, residenceType: event.target.value, ownershipType: event.target.value === 'Owned' ? form.ownershipType : '' })}>
                  <option value="">Select</option>
                  <option value="Rented">Rented</option>
                  <option value="Owned">Owned</option>
                </select>
              </Field>
              {form.residenceType === 'Owned' && (
                <Field label="Ownership">
                  <select value={form.ownershipType || ''} onChange={(event) => setForm({ ...form, ownershipType: event.target.value })}>
                    <option value="">Select</option>
                    <option value="Self-owned">Self-owned</option>
                    <option value="Father-owned">Father-owned</option>
                  </select>
                </Field>
              )}
            </div>
          </div>

          <div className="lead-section">
            <h2>Sourcing Info</h2>
            <div className="form-grid">
              <Field label="Source"><select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>{dropdownOptions.sources.map((source) => <option key={source}>{source}</option>)}</select></Field>
              <Field label="DSA">
                <select
                  value={form.dsaId}
                  onChange={(event) => {
                    const nextDsaId = event.target.value;
	                    const nextAgent = allowedAgents.find((agent) => agent.dsaId === nextDsaId);
	                    setForm({ ...form, dsaId: nextDsaId, agentId: nextAgent?.id || '' });
	                  }}
	                  disabled={Boolean(activePolicy?.dsaId)}
	                >
	                  {!allowedDsas.length && <option value="">Assign DSA in User Management</option>}
	                  {allowedDsas.map((dsa) => <option key={dsa.id} value={dsa.id}>{dsaDisplayName(dsa)}</option>)}
	                </select>
	              </Field>
	              <Field label="Agent">
	                <select value={form.agentId} onChange={(event) => setForm({ ...form, agentId: event.target.value })} disabled={!form.dsaId || !dsaAgents.length || Boolean(activePolicy?.agentId)}>
	                  {!form.dsaId && <option value="">Select DSA first</option>}
	                  {form.dsaId && !dsaAgents.length && <option value="">Assign agent in User Management</option>}
	                  {dsaAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
	                </select>
              </Field>
              <Field label="Company make"><select value={form.companyMake} onChange={(event) => setForm({ ...form, companyMake: event.target.value })}>{allowedCompanyMakes.map((make) => <option key={make} value={make}>{make}</option>)}</select></Field>
              <Field label="Battery model"><select value={form.batteryModel} onChange={(event) => setForm({ ...form, batteryModel: event.target.value })}>{allowedBatteryModels.map((model) => <option key={model} value={model}>{model}</option>)}</select></Field>
            </div>
          </div>
        </section>

        {activePolicy && <div className="warning-box"><AlertTriangle size={17} /> Lead form is restricted by email policy for {activePolicy.email}.</div>}
        {duplicate && <div className="warning-box"><AlertTriangle size={17} /> Duplicate mobile found in {duplicate.id}</div>}
        {billUploadError && <div className="warning-box"><AlertTriangle size={17} /> {billUploadError}</div>}
        {itrUploadError && <div className="warning-box"><AlertTriangle size={17} /> {itrUploadError}</div>}
        {saveError && <div className="warning-box"><AlertTriangle size={17} /> {saveError}</div>}
      </section>

      <aside className="lead-side-column">
        <div className="lead-emi-summary">
          <div className="emi-card-header">
            <span>EMI preview</span>
            <strong>{formatMoney(selectedRepayment)}</strong>
            <small>{form.repaymentFrequency} collection</small>
          </div>
          <div className="emi-breakdown">
            <div className={form.repaymentFrequency === 'Daily' ? 'active' : ''}><span>Daily</span><strong>{formatMoney(dailyEmi)}</strong></div>
            <div className={form.repaymentFrequency === 'Weekly' ? 'active' : ''}><span>Weekly</span><strong>{formatMoney(weeklyEmi)}</strong></div>
            <div className="blocked"><span>Monthly</span><strong>{formatMoney(monthlyEmi)}</strong></div>
            <div><span>Total</span><strong>{formatMoney(totalDue)}</strong></div>
          </div>
        </div>

        <div className="lead-drafts-panel">
          <div className="drafts-panel-header">
            <div>
              <span>Saved drafts</span>
              <strong>{draftLeads.length}</strong>
            </div>
          </div>
          {draftLeads.length ? (
            <div className="draft-list">
              {draftLeads.map((app) => (
                <div className="draft-item" key={app.id}>
                  <div className="draft-item-main">
                    <strong>{app.customer || 'Unnamed customer'}</strong>
                    <span>{app.id} · {formatMoney(app.amount)} · {app.createdAt || today()}</span>
                  </div>
                  <div className="draft-item-actions">
                    <button className="secondary-action compact" type="button" onClick={() => continueDraft(app)}>
                      Continue
                    </button>
                    <button className="ghost-action danger-action compact" type="button" disabled={deletingDraftId === app.id} onClick={() => removeDraft(app)}>
                      {deletingDraftId === app.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="draft-empty-text">No saved drafts yet.</p>
          )}
          {draftActionError && <small className="inline-verify-error"><AlertTriangle size={13} /> {draftActionError}</small>}
        </div>

      </aside>
    </form>
  );
}

function LeadListPage({ apps, selected, setSelectedId, dsas, agents, session, deleteLead }) {
  const canDeleteLead = String(session?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const [deletingId, setDeletingId] = useState('');
  const [deleteError, setDeleteError] = useState('');

  async function handleDeleteLead(event, app) {
    event.stopPropagation();
    if (!canDeleteLead || !deleteLead) return;
    const confirmed = window.confirm(`Delete lead ${app.leadId || app.id} for ${app.customer}? This cannot be undone.`);
    if (!confirmed) return;
    setDeleteError('');
    setDeletingId(app.id);
    try {
      await deleteLead(app.id);
    } catch (error) {
      console.error(error);
      setDeleteError(error.message || 'Lead could not be deleted.');
    } finally {
      setDeletingId('');
    }
  }

  const [stageFilter, setStageFilter] = useState('All');
  const visibleApps = useMemo(() => apps.filter((app) => !isDraftApplication(app)), [apps]);
  const stages = useMemo(() => ['All', ...lifecycle.filter((stage) => visibleApps.some((app) => app.stage === stage))], [visibleApps]);
  const filteredLeads = useMemo(
    () => stageFilter === 'All' ? visibleApps : visibleApps.filter((app) => app.stage === stageFilter),
    [visibleApps, stageFilter]
  );
  const active = selected && filteredLeads.some((app) => app.id === selected.id) ? selected : filteredLeads[0] || visibleApps[0] || null;

  useEffect(() => {
    if (active?.id && active.id !== selected?.id) {
      setSelectedId(active.id);
    }
  }, [active?.id, selected?.id, setSelectedId]);

  return (
    <div className="lead-list-page">
      <section className="lead-list-sidebar">
        <div className="lead-page-header">
          <div>
            <h1>Lead List</h1>
            <p>Every captured lead, its current page, attached images, markings, status, and workflow history.</p>
          </div>
        </div>
        <div className="lead-list-toolbar">
          <div className="segmented-control">
            {stages.map((stage) => (
              <button key={stage} type="button" className={stageFilter === stage ? 'active' : ''} onClick={() => setStageFilter(stage)}>
                {stage}
              </button>
            ))}
          </div>
          <span>{filteredLeads.length} leads</span>
        </div>
        {deleteError && <div className="warning-box"><AlertTriangle size={15} /> {deleteError}</div>}
        <div className="lead-list-items">
          {filteredLeads.length ? filteredLeads.map((app) => {
            const relatives = (app.referenceContacts || []).filter((contact) => contact && (contact.name || contact.contactNo || contact.address));
            return (
            <div key={app.id} className={`lead-list-row ${active?.id === app.id ? 'selected' : ''}`}>
              <button type="button" className="lead-list-row-main" onClick={() => setSelectedId(app.id)}>
                <span>
                  <strong>{app.customer}</strong>
                  <small>{app.leadId} · {app.id} · {app.mobile}</small>
                  {relatives.length > 0 && (
                    <span className="lead-list-row-relatives">
                      {relatives.map((contact, index) => (
                        <span className="lead-list-row-relative" key={`${app.id}-rel-${index}`}>
                          <em>{contact.type || 'Relative'}:</em> {contact.name || '—'}
                          {contact.contactNo ? ` · ${contact.contactNo}` : ''}
                          {contact.address ? ` · ${contact.address}` : ''}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <Status value={app.status} />
              </button>
              {canDeleteLead && (
                <button
                  type="button"
                  className="ghost-action danger-action compact lead-list-row-delete"
                  disabled={deletingId === app.id}
                  onClick={(event) => handleDeleteLead(event, app)}
                  aria-label={`Delete lead ${app.leadId || app.id}`}
                  title="Delete lead"
                >
                  {deletingId === app.id ? '...' : <X size={15} />}
                </button>
              )}
            </div>
            );
          }) : <EmptyState title="No leads found" detail="Create a lead from the Leads page and it will appear here." />}
        </div>
      </section>
      <LeadDetailPanel app={active} dsas={dsas} agents={agents} />
    </div>
  );
}

function isRejectedApplication(app) {
  const status = String(app?.status || '').toLowerCase();
  const kycReason = String(app?.kyc?.reason || '').toLowerCase();
  return status.includes('reject') || status.includes('failed') || kycReason.includes('failed');
}

function RejectedPage({ apps, selected, setSelectedId, dsas, agents }) {
  const rejectedApps = useMemo(() => apps.filter(isRejectedApplication), [apps]);
  const active = selected && rejectedApps.some((app) => app.id === selected.id) ? selected : rejectedApps[0] || null;

  useEffect(() => {
    if (active?.id && active.id !== selected?.id) {
      setSelectedId(active.id);
    }
  }, [active?.id, selected?.id, setSelectedId]);

  return (
    <div className="lead-list-page">
      <section className="lead-list-sidebar">
        <div className="lead-page-header">
          <div>
            <h1>Rejected</h1>
            <p>All leads and applications rejected during KYC, credit, borrower confirmation, or other workflow checks.</p>
          </div>
        </div>
        <div className="lead-list-toolbar">
          <span>{rejectedApps.length} rejected</span>
        </div>
        <div className="lead-list-items">
          {rejectedApps.length ? rejectedApps.map((app) => (
            <button key={app.id} type="button" className={active?.id === app.id ? 'selected' : ''} onClick={() => setSelectedId(app.id)}>
              <span>
                <strong>{app.customer}</strong>
                <small>{app.leadId} · {app.id} · {app.mobile}</small>
              </span>
              <Status value={app.status} />
            </button>
          )) : <EmptyState title="No rejected records" detail="Rejected leads and failed verification records will appear here." />}
        </div>
      </section>
      <LeadDetailPanel app={active} dsas={dsas} agents={agents} />
    </div>
  );
}

function FollowupPage({ apps, updateLeadFollowup, setSelectedId, dsas = [], agents = [] }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const dsaById = useMemo(() => new Map(dsas.map((dsa) => [dsa.id, dsa])), [dsas]);
  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);
  const leadsForDate = useMemo(
    () => apps.filter((app) => (app.followup?.nextDate || app.createdAt) === selectedDate),
    [apps, selectedDate]
  );
  const openCount = leadsForDate.filter((app) => !app.followup?.closed).length;

  function draftFor(app) {
    return drafts[app.id] || {
      nextDate: app.followup?.nextDate || selectedDate,
      remark: app.followup?.remark || '',
    };
  }

  function updateDraft(appId, patch) {
    setDrafts((current) => ({
      ...current,
      [appId]: { ...(current[appId] || {}), ...patch },
    }));
  }

  async function saveFollowup(app, closed = false) {
    const draft = draftFor(app);
    const nextDate = draft.nextDate || selectedDate;
    if (!closed && isPastDate(nextDate)) {
      setError('Followup date cannot be in back date.');
      return;
    }
    setSavingId(app.id);
    setError('');
    try {
      await updateLeadFollowup(app.id, {
        nextDate,
        remark: draft.remark,
        closed,
        closedAt: closed ? today() : '',
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[app.id];
        return next;
      });
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Followup could not be saved.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="followup-page">
      <div className="lead-page-header">
        <div>
          <h1>Followup</h1>
          <p>Select a date to see leads due that day, set the next followup date, add remarks, or close the followup.</p>
        </div>
        <div className="followup-date-filter">
          <Field label="Followup date">
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </Field>
        </div>
      </div>

      <div className="followup-summary">
        <div><span>Total leads</span><strong>{leadsForDate.length}</strong></div>
        <div><span>Open followups</span><strong>{openCount}</strong></div>
        <div><span>Closed</span><strong>{leadsForDate.length - openCount}</strong></div>
      </div>

      {error && <div className="warning-box"><AlertTriangle size={17} /> {error}</div>}

      <section className="followup-list">
        {leadsForDate.length ? leadsForDate.map((app) => {
          const draft = draftFor(app);
          const isClosed = Boolean(app.followup?.closed);
          const followup = normalizeFollowup(app.followup, app.createdAt || selectedDate);
          const dsa = dsaById.get(app.dsaId);
          const agent = agentById.get(app.agentId);
          const assignment = [dsa ? dsaDisplayName(dsa) : app.dsaId, agent?.name || app.agentId].filter(Boolean).join(' · ') || 'Unassigned';
          return (
            <article className="followup-card" key={app.id}>
              <header className="followup-card-head">
                <div className="followup-card-head-left">
                  <button type="button" className="link-button" onClick={() => setSelectedId(app.id)}>
                    {app.customer}
                  </button>
                  <span className="followup-card-ids">{app.leadId} · {app.id} · {app.mobile}</span>
                </div>
                <div className="followup-card-head-right">
                  <Status value={isClosed ? 'Closed' : app.status} />
                  <small>{assignment}</small>
                </div>
              </header>

              <div className="followup-chips">
                <span><strong>{formatMoney(app.amount)}</strong> · {app.tenure}m</span>
                <span>{app.stage || app.leadStatus || 'New'}</span>
                <span>{app.source || '—'}</span>
                <span>{app.batteryModel || '—'}</span>
                <span>Created {app.createdAt}</span>
                <span>Next {followup.nextDate || '—'}</span>
              </div>

              <div className="followup-actions">
                <Field label="Next followup">
                  <input
                    type="date"
                    min={today()}
                    value={draft.nextDate}
                    disabled={isClosed}
                    onChange={(event) => updateDraft(app.id, { nextDate: event.target.value })}
                  />
                </Field>
                <Field label="Remark">
                  <textarea
                    rows={2}
                    value={draft.remark}
                    disabled={isClosed}
                    placeholder="Add followup remark"
                    onChange={(event) => updateDraft(app.id, { remark: event.target.value })}
                  />
                </Field>
                <div className="followup-buttons">
                  <button className="secondary-action compact" type="button" disabled={isClosed || savingId === app.id} onClick={() => saveFollowup(app, false)}>
                    {savingId === app.id ? 'Saving…' : 'Next Followup'}
                  </button>
                  <button className="primary-action compact" type="button" disabled={isClosed || savingId === app.id} onClick={() => saveFollowup(app, true)}>
                    Close Followup
                  </button>
                </div>
              </div>

              <details className="followup-history-toggle" open={followup.history.length === 1}>
                <summary>
                  <Clock3 size={13} />
                  History · {followup.history.length} {followup.history.length === 1 ? 'entry' : 'entries'}
                </summary>
                {followup.history.length ? (
                  <ol className="followup-timeline">
                    {followup.history.map((item, index) => (
                      <li className="followup-timeline-item" key={`${item.at}-${index}`}>
                        <span className="followup-timeline-dot" data-kind={item.closed ? 'closed' : 'open'} />
                        <div>
                          <strong>{item.remark || (item.closed ? 'Followup closed' : 'No remark added')}</strong>
                          <small>
                            {item.actor || 'System'} · {item.at || '—'}
                            {item.closed ? ' · Closed' : ` · Next ${item.nextDate || '—'}`}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="followup-timeline-empty">No remarks saved yet.</p>
                )}
              </details>
            </article>
          );
        }) : <EmptyState title="No followups for this date" detail="Change the date or create a lead to schedule a followup." />}
      </section>
    </div>
  );
}

function LeadDetailPanel({ app, dsas, agents }) {
  if (!app) {
    return <EmptyState title="No lead selected" detail="Create or select a lead to see its full record." />;
  }

  const dsa = dsas.find((item) => item.id === app.dsaId);
  const agent = agents.find((item) => item.id === app.agentId);
  const attachments = [
    ...imageAttachments(app.electricityBills, 'Electricity bill'),
    ...imageAttachments(app.itrImages, 'ITR'),
  ];
  const documentRows = documentTypes.map((doc) => ({ label: doc, value: app.documents?.[doc] ? 'Marked' : 'Pending' }));
  const pan360 = app.panVerification?.result || null;
  const tvrAnswered = countTvrAnswered(app.tvr?.answers || {});
  const tvrApplicable = countTvrApplicable(app.tvr?.answers || {});

  return (
    <section className="lead-detail-panel">
      <Panel title={app.customer} subtitle={`${app.leadId} · ${app.id} · ${app.customerCode}`}>
        <div className="lead-detail-hero">
          <div>
            <span>Current page</span>
            <strong>{app.stage}</strong>
            <Status value={app.status} />
          </div>
          <div>
            <span>Loan amount</span>
            <strong>{formatMoney(app.amount)}</strong>
            <small>{app.tenure} months · {formatMoney(app.emi)} EMI</small>
          </div>
          <div>
            <span>Created</span>
            <strong>{app.createdAt}</strong>
            <small>{app.source}</small>
          </div>
        </div>

        <div className="timeline lead-progress">
          {lifecycle.map((stage) => {
            const stageIdx = lifecycle.indexOf(stage);
            const currentIdx = lifecycle.indexOf(app.stage);
            const rejected = isRejectedApplication(app);
            const isClosedStage = stage === 'Closed / NPA';
            let done = false;
            let icon = stageIdx + 1;
            if (rejected) {
              if (isClosedStage) {
                done = true;
                icon = <X size={13} />;
              }
            } else {
              done = stageIdx <= currentIdx;
              if (stageIdx < currentIdx) icon = <Check size={13} />;
            }
            return (
              <div key={stage} className={`timeline-step ${done ? 'done' : ''} ${rejected && isClosedStage ? 'rejected' : ''}`}>
                <span>{icon}</span>
                <p>{stage}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="lead-detail-grid">
        <div className="lead-detail-column">
          <LeadInfoCard title="Customer Details" rows={[
            ['Customer name', app.customer],
            ['Mobile', app.mobile],
            ['Aadhaar (entered in lead)', app.aadhaar ? maskAadhaarTyping(app.aadhaar) : 'Not filled'],
            ['Aadhaar (PAN 360 masked)', panMaskedAadhaar(pan360) || 'Not verified'],
            ['PAN', app.pan],
            ['DOB', app.dob],
            ['Father name', app.fatherName || 'Not filled'],
            ['Pincode', app.pincode || 'Not filled'],
          ]} />
          <LeadInfoCard title="PAN 360 Verification" rows={pan360 ? [
            ['PAN', pan360.pan || app.pan || 'Not verified'],
            ['Status', panIsValidFlag(pan360) ? 'VALID' : (pan360.message || 'INVALID')],
            ['Message', pan360.message || '—'],
            ['Name provided', pan360.name_provided || '—'],
            ['Registered name', panRegisteredName(pan360) || '—'],
            ['Name on PAN card', pan360.name_pan_card || '—'],
            ['First name', pan360.first_name || '—'],
            ['Last name', pan360.last_name || '—'],
            ['Type', pan360.type || '—'],
            ['Gender', pan360.gender || '—'],
            ['Date of birth', panDob(pan360) || '—'],
            ['Masked Aadhaar', panMaskedAadhaar(pan360) || '—'],
            ['Aadhaar linked', panSeedingStatus(pan360) || '—'],
            ['Email', pan360.email || '—'],
            ['Mobile', panMobile(pan360) || '—'],
            ['Full address', pan360.address?.full_address || formatPanAddress(pan360.address) || '—'],
            ['Street', pan360.address?.street || '—'],
            ['City', pan360.address?.city || '—'],
            ['State', pan360.address?.state || '—'],
            ['Pincode', pan360.address?.pincode || '—'],
            ['Country', pan360.address?.country || '—'],
            ['Verification ID', pan360.verification_id || app.panVerification?.verificationId || '—'],
            ['Reference ID', pan360.reference_id || app.panVerification?.referenceId || '—'],
            ['Checked at', app.panVerification?.checkedAt || '—'],
          ] : [['PAN 360', 'Not verified yet']]} />
          <LeadInfoCard title="Vehicle Details" rows={[
            ['Condition', app.vehicleDetails?.condition || 'Not filled'],
            ['Use', app.vehicleDetails?.usage || 'Not filled'],
            ['Manufacture', app.vehicleDetails?.manufacture || 'Not filled'],
            ['Category', app.vehicleDetails?.category || 'Not filled'],
            ['Model name', app.vehicleDetails?.modelName || 'Not filled'],
            ['Variant', app.vehicleDetails?.variant || 'Not filled'],
            ['Manufacture year', app.vehicleDetails?.manufactureYear || 'Not filled'],
            ['Registration no', app.vehicleDetails?.registrationNo || 'Not filled'],
            ['Registration date', app.vehicleDetails?.registrationDate || 'Not filled'],
            ['Registration expiry', app.vehicleDetails?.registrationExpiryDate || 'Not filled'],
            ['Fuel type', app.vehicleDetails?.fuelType || 'Not filled'],
            ['Road tax upto', app.vehicleDetails?.roadTaxUpto || 'Not filled'],
            ['Color', app.vehicleDetails?.color || 'Not filled'],
          ]} />
          <LeadInfoCard title="Driving Licence Verification" rows={app.drivingLicenseVerification?.result ? [
            ...flattenDlResult(app.drivingLicenseVerification.result),
            ['Verification ID', app.drivingLicenseVerification.result.verification_id || app.drivingLicenseVerification.verificationId || '—'],
            ['Reference ID', app.drivingLicenseVerification.result.reference_id || app.drivingLicenseVerification.referenceId || '—'],
            ['Checked at', app.drivingLicenseVerification.checkedAt || '—'],
            ...(dlPhotoUrl(app.drivingLicenseVerification.result) ? [['Photo', <a key="dl-photo" href={dlPhotoUrl(app.drivingLicenseVerification.result)} target="_blank" rel="noreferrer">View photo</a>]] : []),
          ] : [['Driving licence', 'Not verified yet']]} />
          <LeadInfoCard title="Vehicle RC Verification" rows={app.vehicleRcVerification?.result ? [
            ...flattenRcResult(app.vehicleRcVerification.result),
            ['Verification ID', app.vehicleRcVerification.result.verification_id || app.vehicleRcVerification.verificationId || '—'],
            ['Reference ID', app.vehicleRcVerification.result.reference_id || app.vehicleRcVerification.referenceId || '—'],
            ['Checked at', app.vehicleRcVerification.checkedAt || '—'],
          ] : [['Vehicle RC', 'Not verified yet']]} />
          <LeadInfoCard title="Family And References" rows={(app.referenceContacts || []).map((contact) => [
            contact.type || 'Contact',
            [contact.name, contact.contactNo, contact.address].filter(Boolean).join(' · ') || 'Not filled',
          ])} />
          <LeadInfoCard title="Sourcing Details" rows={[
            ['Source', app.source],
            ['DSA', (dsa && dsaDisplayName(dsa)) || app.dsaId || 'Not assigned'],
            ['Agent', agent?.name || app.agentId || 'Not assigned'],
          ]} />
          <LeadStatusCard title="Page Markings" rows={[
            ['Lead status', app.leadStatus],
            ['Followup', app.followup?.closed ? 'Closed' : app.followup?.nextDate || 'Pending'],
            ['Followup remark', app.followup?.remark || 'No remark'],
            ['TVR', app.tvr?.status || 'Pending'],
            ['TVR answers', `${tvrAnswered}/${tvrApplicable}`],
            ['Geo', app.geo?.status || 'Pending'],
            ['Geo photo', app.geo?.photo ? 'Marked' : 'Pending'],
            ['Credit', app.credit?.decision || 'Pending'],
            ['Sanction', app.sanction?.generated ? 'Generated' : 'Pending'],
            ['KFS', app.sanction?.kfsAccepted ? 'Accepted' : 'Pending'],
            ['Penny drop', app.nach?.pennyDrop || 'Pending'],
            ['Mandate', app.nach?.mandate || 'Pending'],
            ['Disbursement', app.disbursement?.status || 'Pending'],
            ['Servicing bucket', app.servicing?.bucket || 'Current'],
          ]} />
        </div>
        <div className="lead-detail-column">
          <LeadInfoCard title="Loan Details" rows={[
            ['Amount', formatMoney(app.amount)],
            ['Tenure', `${app.tenure} months`],
            ['Interest', `${Math.round(app.rate * 100)}% flat p.a.`],
            ['Frequency', app.repaymentFrequency],
            ['Monthly income', formatMoney(app.monthlyIncome)],
            ['Existing EMI', formatMoney(app.existingEmi)],
            ['Monthly expense', formatMoney(app.monthlyExpense)],
            ['Battery', app.batteryModel],
            ['Company make', app.companyMake],
          ]} />
          <LeadInfoCard title="Bank Details" rows={[
            ['Bank name', app.bankDetails?.bankName || 'Not filled'],
            ['Account holder', app.bankDetails?.accountHolderName || 'Not filled'],
            ['Account no', app.bankDetails?.accountNo || 'Not filled'],
            ['IFSC', app.bankDetails?.ifsc || 'Not filled'],
            ['Branch', app.bankDetails?.branch || 'Not filled'],
          ]} />
          <LeadInfoCard title="Bank Account Verification" rows={app.bankAccountVerification?.result ? [
            ...flattenBankResult(app.bankAccountVerification.result),
            ['Verification ID', app.bankAccountVerification.result.verification_id || app.bankAccountVerification.verificationId || '—'],
            ['Reference ID', app.bankAccountVerification.result.reference_id || app.bankAccountVerification.referenceId || '—'],
            ['Checked at', app.bankAccountVerification.checkedAt || '—'],
          ] : [['Bank account', 'Not verified yet']]} />
          <LeadInfoCard title="Residence Details" rows={[
            ['Address', app.livingAddress || 'Not filled'],
            ['Living since', app.livingSince || 'Not filled'],
            ['Residence type', app.residenceType || 'Not filled'],
            ...(app.residenceType === 'Owned' ? [['Ownership', app.ownershipType || 'Not filled']] : []),
          ]} />
          <LeadStatusCard title="Documents" rows={documentRows.map((row) => [row.label, row.value])} />
        </div>
      </div>

      <Panel title="Attached Images" subtitle="Images uploaded while creating the lead.">
        {attachments.length ? (
          <div className="lead-attachment-grid">
            {attachments.map((file, index) => (
              <a key={`${file.label}-${file.name}-${index}`} href={file.dataUrl} target="_blank" rel="noreferrer">
                <img src={file.dataUrl} alt={`${file.label} ${index + 1}`} />
                <span>{file.label}</span>
                <small>{file.name} · {Math.max(1, Math.round((file.size || 0) / 1024))} KB</small>
              </a>
            ))}
          </div>
        ) : <EmptyState title="No images attached" detail="Electricity bill and ITR uploads from lead capture will show here." />}
      </Panel>

    </section>
  );
}

function imageAttachments(files = [], label) {
  return (Array.isArray(files) ? files : [])
    .filter((file) => file?.dataUrl)
    .map((file) => ({ ...file, label }));
}

function LeadInfoCard({ title, rows }) {
  return (
    <Panel title={title}>
      <div className="lead-detail-table">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <span>{label}</span>
            <strong>{value || 'Not filled'}</strong>
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

function LeadStatusCard({ title, rows }) {
  return (
    <Panel title={title}>
      <div className="lead-marking-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <Status value={value || 'Pending'} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ApplicationsPage({ apps, selected, setSelectedId, mutateApplication, dsas, setActiveNav }) {
  return (
    <div className="bodyshop-board">
      <div className="board-toolbar">
        <div className="search-box board-search">
          <Search size={18} />
          <input readOnly placeholder="Search by name, reg, R/O..." />
        </div>
      </div>
      <div className="board-detail-drawer">
        <ApplicationWorkspace app={selected} mutateApplication={mutateApplication} setActiveNav={setActiveNav} />
      </div>
    </div>
  );
}

function ApplicationWorkspace({ app, mutateApplication, setActiveNav }) {
  const kycSummary = app ? deriveKycSummary(app) : [];
  const autoDocs = app ? autoDocsFromKyc(app) : {};
  const failureReasons = app ? collectVerificationFailures(app, kycSummary) : [];
  const isAlreadyRejected = app && (String(app.status || '').toLowerCase().includes('reject') || app.stage === 'Closed / NPA');

  useEffect(() => {
    if (!app || isAlreadyRejected || !failureReasons.length) return;
    mutateApplication(app.id, {
      status: 'Rejected',
      stage: 'Closed / NPA',
      kyc: { ...app.kyc, reason: failureReasons.join(' · ') },
    }, `Application auto-rejected: ${failureReasons.join(', ')}`);
  }, [app?.id, failureReasons.join('|'), isAlreadyRejected]);

  if (!app) return null;

  const docStatuses = app ? docStatusesFromKyc(app) : {};
  const isDocDone = (doc) => docStatuses[doc] === 'verified';
  const verifiedDocs = documentTypes.filter(isDocDone);
  const docsComplete = documentTypes.every(isDocDone);
  const panVerified = app.kyc?.pan === 'Verified';
  const livenessVerified = app.kyc?.liveness === 'Verified';

  return (
    <Panel title="Application Workspace" subtitle={`${app.id} · ${app.customer}`}>
      <div className="amount-box">
        <span>Requested / eligible amount</span>
        <strong>{formatMoney(app.amount)}</strong>
        <small>{app.tenure} months · EMI {formatMoney(app.emi)} · Total {formatMoney(app.totalPayable)}</small>
      </div>

      {failureReasons.length > 0 && (
        <div className="warning-box">
          <AlertTriangle size={17} />
          <span>Verification failed: {failureReasons.join(', ')}. Application moved to Rejected.</span>
        </div>
      )}

      {kycSummary.some((item) => item.verified) && (
        <div className="kyc-summary-card">
          <div className="kyc-summary-header">
            <ShieldCheck size={16} />
            <strong>KYC Verification Summary</strong>
            <Status value={panVerified && livenessVerified ? 'Verified' : 'Partial'} />
          </div>
          <div className="kyc-summary-grid">
            {kycSummary.filter((item) => item.verified).map((item) => (
              <div key={item.label} className="kyc-summary-row done">
                <span className="kyc-summary-icon"><Check size={14} /></span>
                <span className="kyc-summary-label">{item.label}</span>
                <span className="kyc-summary-value">{item.value || 'Verified'}</span>
                {item.detail && <small className="kyc-summary-detail">{item.detail}</small>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="document-grid">
        {documentTypes.map((doc) => {
          const state = docStatuses[doc] || 'pending';
          const icon = state === 'verified' ? <Check size={16} /> : state === 'rejected' ? <X size={16} /> : <Clock3 size={16} />;
          const title = state === 'verified'
            ? 'Auto-verified from KYC'
            : state === 'rejected'
              ? 'Auto-rejected by KYC verification'
              : 'Awaiting KYC verification';
          return (
            <div key={doc} className={`doc-status ${state}`} title={title}>
              {icon}
              <span>{doc}</span>
              <small className="doc-auto-tag">{state}</small>
            </div>
          );
        })}
      </div>
      <div className="button-row">
        <button className="secondary-action" onClick={() => {
          mutateApplication(app.id, { status: 'Rejected', stage: 'Closed / NPA', kyc: { ...app.kyc, reason: 'Rejected from application workspace' } }, 'Application rejected');
          setActiveNav?.('Rejected');
        }}>Rejected</button>
        <button
          className="primary-action compact"
          disabled={!docsComplete || !panVerified || !livenessVerified || failureReasons.length > 0}
          onClick={() => mutateApplication(app.id, { status: 'Credit Queue', stage: 'Credit Underwriting' }, 'Submitted to credit underwriting')}
        >
          Submit to Credit
        </button>
      </div>
    </Panel>
  );
}

function collectVerificationFailures(app, kycSummary) {
  const reasons = [];
  if (app.kyc?.pan === 'Failed') reasons.push('PAN');
  if (app.kyc?.liveness === 'Failed') reasons.push('Liveness');
  if (app.drivingLicenseVerification && app.drivingLicenseVerification.verified === false) reasons.push('Driving License');
  if (app.voterIdVerification && app.voterIdVerification.verified === false) reasons.push('Voter ID');
  if (app.vehicleRcVerification && app.vehicleRcVerification.verified === false) reasons.push('Vehicle RC');
  (kycSummary || []).forEach((item) => {
    if (item.failed && !reasons.includes(item.label)) reasons.push(item.label);
  });
  return reasons;
}

function deriveKycSummary(app) {
  const panRes = app.panVerification?.result;
  const panVerified = app.kyc?.pan === 'Verified' || Boolean(app.panVerification?.verified);
  const panFailed = app.kyc?.pan === 'Failed';
  const masked = panMaskedAadhaar(panRes);
  const registeredName = panRes?.registered_name || '';
  const livenessRes = app.faceLivenessVerification;
  const livenessVerified = app.kyc?.liveness === 'Verified' || Boolean(livenessRes?.verified);
  const livenessFailed = app.kyc?.liveness === 'Failed';
  const dl = app.drivingLicenseVerification;
  const voter = app.voterIdVerification;
  const rc = app.vehicleRcVerification;

  const rows = [
    {
      label: 'PAN',
      verified: panVerified,
      failed: panFailed,
      value: app.pan || '',
      detail: [registeredName, app.panVerification?.referenceId && `Ref ${app.panVerification.referenceId}`].filter(Boolean).join(' · '),
    },
    {
      label: 'Aadhaar (masked)',
      verified: Boolean(masked) || app.kyc?.aadhaar === 'Verified',
      failed: app.kyc?.aadhaar === 'Failed',
      value: masked || maskAadhaar(app.aadhaar) || '—',
      detail: masked ? 'From PAN 360' : '',
    },
    {
      label: 'Liveness / Selfie',
      verified: livenessVerified,
      failed: livenessFailed,
      value: livenessVerified ? 'Verified' : livenessFailed ? 'Failed' : 'Pending',
      detail: livenessRes?.referenceId ? `Ref ${livenessRes.referenceId}` : '',
    },
  ];
  if (dl) {
    rows.push({
      label: 'Driving License',
      verified: Boolean(dl.verified),
      failed: dl.verified === false,
      value: dl.result?.dl_number || '',
      detail: dl.referenceId ? `Ref ${dl.referenceId}` : '',
    });
  }
  if (voter) {
    rows.push({
      label: 'Voter ID',
      verified: Boolean(voter.verified),
      failed: voter.verified === false,
      value: voter.result?.epic_number || '',
      detail: voter.referenceId ? `Ref ${voter.referenceId}` : '',
    });
  }
  if (rc) {
    rows.push({
      label: 'Vehicle RC',
      verified: Boolean(rc.verified),
      failed: rc.verified === false,
      value: rc.result?.reg_no || '',
      detail: rc.referenceId ? `Ref ${rc.referenceId}` : '',
    });
  }
  return rows;
}

function autoDocsFromKyc(app) {
  const statuses = docStatusesFromKyc(app);
  return Object.fromEntries(Object.entries(statuses).map(([k, v]) => [k, v === 'verified']));
}

function docStatusesFromKyc(app) {
  const status = (verified, hasResult) => {
    if (verified === true) return 'verified';
    if (verified === false) return 'rejected';
    return hasResult ? 'rejected' : 'pending';
  };
  const pan = app.panVerification;
  const live = app.faceLivenessVerification;
  const dl = app.drivingLicenseVerification;
  const voter = app.voterIdVerification;
  const rc = app.vehicleRcVerification;
  const aadhaarVerified = Boolean(panMaskedAadhaar(pan?.result)) || app.kyc?.aadhaar === 'Verified';
  return {
    'PAN Card': app.kyc?.pan === 'Verified' || pan?.verified === true
      ? 'verified'
      : app.kyc?.pan === 'Failed' || pan?.verified === false
        ? 'rejected'
        : 'pending',
    'Selfie / liveness': app.kyc?.liveness === 'Verified' || live?.verified === true
      ? 'verified'
      : app.kyc?.liveness === 'Failed' || live?.verified === false
        ? 'rejected'
        : 'pending',
    'Driving License': status(dl?.verified, Boolean(dl)),
    'Voter ID': status(voter?.verified, Boolean(voter)),
    'Vehicle RC': status(rc?.verified, Boolean(rc)),
    'Aadhaar eKYC': aadhaarVerified ? 'verified' : app.kyc?.aadhaar === 'Failed' ? 'rejected' : 'pending',
  };
}

function KycPageContent({ apps, selected, setSelectedId, mutateApplication }) {
  const kycApps = apps.filter((app) => ['KYC Check', 'Login / Application'].includes(app.stage) || ['KYC Pending', 'Rejected'].includes(app.status));
  return (
    <div className="content-grid">
      <Panel title="KYC Verification Queue" subtitle="PAN verification and liveness are hard gates. Aadhaar is captured in the lead form.">
        <div className="stack-list">
          {kycApps.map((app) => (
            <button key={app.id} className={selected?.id === app.id ? 'selected' : ''} onClick={() => setSelectedId(app.id)}>
              <span><strong>{app.customer}</strong><small>{app.id} · {app.mobile}</small></span>
              <Status value={app.status} />
            </button>
          ))}
        </div>
      </Panel>
      <KycPanel app={selected} mutateApplication={mutateApplication} apps={apps} />
    </div>
  );
}

function KycPanel({ app, mutateApplication, apps = [] }) {
  const [panForm, setPanForm] = useState({
    pan: app?.pan || '',
    name: app?.customer || '',
    fatherName: app?.fatherName || '',
    dob: app?.dob || todayForDob(30),
  });
  const [panLoading, setPanLoading] = useState(false);
  const [panError, setPanError] = useState('');
  const [secureIdForm, setSecureIdForm] = useState({
    dlNumber: '',
    dob: app?.dob || todayForDob(30),
    epicNumber: '',
    voterName: app?.customer || '',
    vehicleNumber: '',
    selfieImage: null,
    bankAccount: app?.bankDetails?.accountNo || '',
    ifsc: app?.bankDetails?.ifsc || '',
    bankAccountHolder: app?.bankDetails?.accountHolderName || app?.customer || '',
  });
  const [secureIdLoading, setSecureIdLoading] = useState('');
  const [secureIdError, setSecureIdError] = useState('');
  const [livenessCameraActive, setLivenessCameraActive] = useState(false);
  const [livenessCameraError, setLivenessCameraError] = useState('');
  const livenessVideoRef = useRef(null);
  const livenessStreamRef = useRef(null);

  function stopLivenessCamera() {
    if (livenessStreamRef.current) {
      livenessStreamRef.current.getTracks().forEach((track) => track.stop());
      livenessStreamRef.current = null;
    }
    if (livenessVideoRef.current) livenessVideoRef.current.srcObject = null;
    setLivenessCameraActive(false);
  }

  useEffect(() => () => stopLivenessCamera(), []);

  async function startLivenessCamera() {
    setLivenessCameraError('');
    setSecureIdError('');
    if (!navigator?.mediaDevices?.getUserMedia) {
      setLivenessCameraError('Camera is not available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      livenessStreamRef.current = stream;
      setLivenessCameraActive(true);
      setTimeout(() => {
        if (livenessVideoRef.current) {
          livenessVideoRef.current.srcObject = stream;
          livenessVideoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch (error) {
      setLivenessCameraError(error?.message || 'Unable to access the camera.');
    }
  }

  async function captureAndVerifyLiveness() {
    const video = livenessVideoRef.current;
    if (!video || !video.videoWidth) {
      setLivenessCameraError('Camera is still warming up. Please wait a moment and try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSecureIdForm((current) => ({ ...current, selfieImage: dataUrl }));
    stopLivenessCamera();
    await runSecureId('face-liveness', dataUrl);
  }

  useEffect(() => {
    if (!app) return;
    setPanForm({
      pan: app.pan || '',
      name: app.customer || '',
      fatherName: app.fatherName || '',
      dob: app.dob || todayForDob(30),
    });
    setPanError('');
    setSecureIdForm({
      dlNumber: app.ovd?.dlNumber || app.drivingLicenseVerification?.result?.dl_number || '',
      dob: app.ovd?.dlDob || app.dob || todayForDob(30),
      epicNumber: app.ovd?.epicNumber || app.voterIdVerification?.result?.epic_number || '',
      voterName: app.ovd?.voterName || app.customer || '',
      vehicleNumber: app.ovd?.vehicleNumber || app.vehicleRcVerification?.result?.reg_no || app.vehicleDetails?.registrationNumber || '',
      selfieImage: null,
      bankAccount: app.bankDetails?.accountNo || '',
      ifsc: app.bankDetails?.ifsc || '',
      bankAccountHolder: app.bankDetails?.accountHolderName || app.customer || '',
    });
    setSecureIdError('');
  }, [app?.id]);

  if (!app) return null;
  const allVerified = app.kyc.pan === 'Verified' && app.kyc.liveness === 'Verified';

  function updateKyc(key, value, reason = '') {
    mutateApplication(app.id, (current) => ({
      ...current,
      kyc: { ...current.kyc, [key]: value, attempts: current.kyc.attempts + 1, reason },
      status: value === 'Failed' ? 'Rejected' : current.status,
      stage: value === 'Failed' ? 'Closed / NPA' : current.stage,
    }), `${key} ${value}`, reason);
  }

  async function runPanVerification() {
    setPanError('');
    if (!panValid(panForm.pan)) {
      setPanError('Enter a valid 10-character PAN before verification.');
      return;
    }

    if (app.panVerification?.verified || app.kyc?.pan === 'Verified') {
      setPanError(`PAN ${app.pan} already verified for this customer on ${app.panVerification?.checkedAt || 'a previous attempt'}.`);
      return;
    }

    const normalizedPan = panForm.pan.toUpperCase();
    const priorMatch = apps.find((other) => other.id !== app.id
      && (other.pan || '').toUpperCase() === normalizedPan
      && other.panVerification?.verified);
    if (priorMatch) {
      const reused = priorMatch.panVerification;
      mutateApplication(app.id, (current) => ({
        ...current,
        pan: normalizedPan,
        dob: panForm.dob || current.dob,
        fatherName: panForm.fatherName || current.fatherName,
        kyc: {
          ...current.kyc,
          pan: 'Verified',
          attempts: current.kyc.attempts + 1,
          reason: '',
        },
        documents: { ...current.documents, 'PAN Card': true },
        panVerification: { ...reused, reusedFrom: priorMatch.id, reusedAt: new Date().toLocaleString('en-IN') },
        status: current.status,
        stage: current.stage,
      }), `PAN reused from ${priorMatch.id}`, `Avoided duplicate Cashfree PAN 360 call for ${normalizedPan}`);
      return;
    }

    setPanLoading(true);
    try {
      const data = await verifyPanWithCashfree({
        pan: panForm.pan,
        name: panForm.name,
      });
      const result = data.outputData?.[0];
      const verified = panResultVerdict(result, panForm.name);
      const reason = panResultReason(result, panForm.name);

      mutateApplication(app.id, (current) => ({
        ...current,
        pan: panForm.pan.toUpperCase(),
        dob: panForm.dob,
        fatherName: panForm.fatherName,
        kyc: {
          ...current.kyc,
          pan: verified ? 'Verified' : 'Failed',
          attempts: current.kyc.attempts + 1,
          reason: verified ? '' : reason,
        },
        documents: { ...current.documents, 'PAN Card': verified || current.documents['PAN Card'] },
        panVerification: {
          provider: 'Cashfree PAN 360',
          verificationId: data.verificationId,
          referenceId: data.referenceId,
          result,
          verified,
          reason,
          checkedAt: new Date().toLocaleString('en-IN'),
        },
        status: verified ? current.status : 'Rejected',
        stage: verified ? current.stage : 'Closed / NPA',
      }), verified ? 'PAN verified via Cashfree PAN 360' : 'PAN verification failed', reason);
    } catch (error) {
      setPanError(error instanceof Error ? error.message : 'PAN verification failed.');
    } finally {
      setPanLoading(false);
    }
  }

  function storeSecureIdResult(key, documentName, data, verified, label, reason = '') {
    const ovdPatch = {};
    let bankPatch = null;
    if (key === 'drivingLicenseVerification') {
      ovdPatch.dlNumber = secureIdForm.dlNumber;
      ovdPatch.dlDob = secureIdForm.dob;
    } else if (key === 'voterIdVerification') {
      ovdPatch.epicNumber = secureIdForm.epicNumber;
      ovdPatch.voterName = secureIdForm.voterName;
    } else if (key === 'vehicleRcVerification') {
      ovdPatch.vehicleNumber = secureIdForm.vehicleNumber;
    } else if (key === 'bankAccountVerification') {
      bankPatch = {
        accountNo: secureIdForm.bankAccount,
        ifsc: secureIdForm.ifsc,
        accountHolderName: data?.result?.name_at_bank || secureIdForm.bankAccountHolder,
        bankName: data?.result?.bank_name || data?.result?.bank || '',
        branch: data?.result?.branch || '',
      };
    }
    mutateApplication(app.id, (current) => ({
      ...current,
      ovd: { ...(current.ovd || {}), ...ovdPatch },
      bankDetails: bankPatch ? { ...(current.bankDetails || {}), ...Object.fromEntries(Object.entries(bankPatch).filter(([, v]) => v)) } : current.bankDetails,
      documents: documentName ? { ...current.documents, [documentName]: verified || current.documents[documentName] } : current.documents,
      kyc: {
        ...current.kyc,
        attempts: current.kyc.attempts + 1,
        reason: verified ? current.kyc.reason : reason,
        liveness: key === 'faceLivenessVerification' ? (verified ? 'Verified' : 'Failed') : current.kyc.liveness,
      },
      [key]: {
        provider: 'Cashfree Secure ID',
        verificationId: data.verificationId,
        referenceId: data.referenceId,
        result: data.result,
        verified,
        reason,
        checkedAt: new Date().toLocaleString('en-IN'),
      },
      status: verified ? current.status : 'Rejected',
      stage: verified ? current.stage : 'Closed / NPA',
    }), verified ? `${label} verified via Cashfree` : `${label} verification failed`, reason);
  }

  async function runSecureId(action, selfieOverride) {
    setSecureIdError('');
    setSecureIdLoading(action);
    try {
      if (action === 'driving-license') {
        const data = await verifyDrivingLicenseWithCashfree({
          verificationId: `dl-${app.id}`,
          dlNumber: secureIdForm.dlNumber,
          dob: secureIdForm.dob,
        });
        const verified = cashfreeValidStatus(data.result);
        storeSecureIdResult('drivingLicenseVerification', 'Driving License', data, verified, 'Driving license', verified ? '' : `Cashfree DL status: ${data.result?.status || 'Invalid'}`);
      }

      if (action === 'voter-id') {
        const data = await verifyVoterIdWithCashfree({
          verificationId: `voter-${app.id}`,
          epicNumber: secureIdForm.epicNumber,
          name: secureIdForm.voterName,
        });
        const verified = cashfreeValidStatus(data.result);
        storeSecureIdResult('voterIdVerification', 'Voter ID', data, verified, 'Voter ID', verified ? '' : `Cashfree voter status: ${data.result?.status || 'Invalid'}`);
      }

      if (action === 'vehicle-rc') {
        const data = await verifyVehicleRcWithCashfree({
          verificationId: `rc-${app.id}`,
          vehicleNumber: secureIdForm.vehicleNumber,
        });
        const verified = cashfreeValidStatus(data.result);
        storeSecureIdResult('vehicleRcVerification', 'Vehicle RC', data, verified, 'Vehicle RC', verified ? '' : `Cashfree RC status: ${data.result?.status || 'Invalid'}`);
      }

      if (action === 'face-liveness') {
        const data = await verifyFaceLivenessWithCashfree({
          verificationId: `live-${app.id}`,
          selfieImage: selfieOverride || secureIdForm.selfieImage,
        });
        const verified = cashfreeLivenessPassed(data.result);
        storeSecureIdResult('faceLivenessVerification', 'Selfie / liveness', data, verified, 'Face liveness', verified ? '' : `Cashfree liveness result: ${data.result?.liveness || data.result?.liveness_result || 'No'}`);
      }

      if (action === 'bank-account') {
        const data = await verifyBankAccountWithCashfree({
          verificationId: `bank-${app.id}`,
          bankAccount: secureIdForm.bankAccount,
          ifsc: secureIdForm.ifsc,
          name: secureIdForm.bankAccountHolder,
        });
        const verified = cashfreeBankAccountValid(data.result);
        storeSecureIdResult('bankAccountVerification', '', data, verified, 'Bank account', verified ? '' : `Cashfree bank status: ${data.result?.account_status || data.result?.account_status_code || 'Invalid'}`);
      }
    } catch (error) {
      setSecureIdError(error instanceof Error ? error.message : 'Cashfree Secure ID verification failed.');
    } finally {
      setSecureIdLoading('');
    }
  }

  const panVerification = app.panVerification;
  const panOutput = panVerification?.result;
  const panAlreadyVerified = Boolean(app.panVerification?.verified) || app.kyc?.pan === 'Verified';
  const dlVerification = app.drivingLicenseVerification;
  const voterVerification = app.voterIdVerification;
  const rcVerification = app.vehicleRcVerification;
  const livenessVerification = app.faceLivenessVerification;
  const bankAccountVerification = app.bankAccountVerification;

  return (
    <Panel title="KYC Gate" subtitle={`${app.customer} · PAN and liveness are checked before docs can open.`}>
      <div className="verification-grid">
        <div className="verify-card">
          <Camera size={22} />
          <strong>Cashfree face liveness</strong>
          <Status value={app.kyc.liveness} />
          <div className="liveness-camera-box">
            {livenessCameraActive ? (
              <video ref={livenessVideoRef} autoPlay playsInline muted className="liveness-video" />
            ) : (
              <small className="file-upload-hint">Press "Check Live" to start your camera and capture a live selfie.</small>
            )}
            {livenessCameraError && <small className="form-error">{livenessCameraError}</small>}
          </div>
          <div className="button-row">
            {!livenessCameraActive ? (
              <button className="primary-action compact" disabled={secureIdLoading === 'face-liveness'} onClick={startLivenessCamera}>
                <Camera size={15} /> {secureIdLoading === 'face-liveness' ? 'Checking...' : 'Check Live'}
              </button>
            ) : (
              <>
                <button className="primary-action compact" disabled={secureIdLoading === 'face-liveness'} onClick={captureAndVerifyLiveness}>
                  <Check size={15} /> {secureIdLoading === 'face-liveness' ? 'Checking...' : 'Capture & Verify'}
                </button>
                <button className="secondary-action compact" disabled={secureIdLoading === 'face-liveness'} onClick={stopLivenessCamera}>
                  Cancel
                </button>
              </>
            )}
          </div>
          {livenessVerification?.result && <small>Score: {livenessVerification.result.liveness_score || 'Not returned'} · {livenessVerification.result.liveness || livenessVerification.result.liveness_result || 'Pending'}</small>}
        </div>
      </div>
      <div className="pan-opv-card">
        <div className="pan-opv-header">
          <FileCheck2 size={22} />
          <div>
            <strong>Cashfree PAN Verification</strong>
            <span>PAN 360 API</span>
          </div>
          <Status value={app.kyc.pan} />
        </div>
        <div className="form-grid compact-form">
          <Field label="PAN"><input value={panForm.pan} readOnly tabIndex={-1} /></Field>
          <Field label="Name as per PAN"><input value={panForm.name} readOnly tabIndex={-1} /></Field>
          <Field label="Date of birth"><input type="date" value={panForm.dob} readOnly tabIndex={-1} /></Field>
          <Field label="Father name"><input value={panForm.fatherName} readOnly tabIndex={-1} placeholder="Captured at lead generation" /></Field>
        </div>
        <p className="kyc-locked-hint">These fields are locked to the values captured at lead generation. Edit the lead to change them.</p>
        <div className="button-row">
          <button className="primary-action compact" disabled={panLoading || panAlreadyVerified} onClick={runPanVerification}>
            <ShieldCheck size={15} /> {panLoading ? 'Verifying...' : (panAlreadyVerified ? 'PAN Already Verified' : 'Verify PAN')}
          </button>
        </div>
        {panError && <div className="warning-box"><AlertTriangle size={17} /> {panError}</div>}
        {panOutput && (
          <>
            <div className="pan-result-grid">
              <span>PAN</span><strong>{panOutput.pan || app.pan || '—'}</strong>
              <span>Status</span><strong>{panIsValidFlag(panOutput) ? 'VALID' : (panOutput.message || 'INVALID')}</strong>
              <span>Message</span><strong>{panOutput.message || '—'}</strong>
              <span>Name provided</span><strong>{panOutput.name_provided || '—'}</strong>
              <span>Registered name</span><strong>{panRegisteredName(panOutput) || '—'}</strong>
              <span>Name on PAN card</span><strong>{panOutput.name_pan_card || '—'}</strong>
              <span>First name</span><strong>{panOutput.first_name || '—'}</strong>
              <span>Last name</span><strong>{panOutput.last_name || '—'}</strong>
              <span>Type</span><strong>{panOutput.type || '—'}</strong>
              <span>Gender</span><strong>{panOutput.gender || '—'}</strong>
              <span>Date of birth</span><strong>{panDob(panOutput) || '—'}</strong>
              <span>Masked Aadhaar</span><strong>{panMaskedAadhaar(panOutput) || '—'}</strong>
              <span>Aadhaar linked</span><strong>{panSeedingStatus(panOutput) || '—'}</strong>
              <span>Email</span><strong>{panOutput.email || '—'}</strong>
              <span>Mobile</span><strong>{panMobile(panOutput) || '—'}</strong>
              <span>Full address</span><strong>{panOutput.address?.full_address || formatPanAddress(panOutput.address) || '—'}</strong>
              <span>Street</span><strong>{panOutput.address?.street || '—'}</strong>
              <span>City</span><strong>{panOutput.address?.city || '—'}</strong>
              <span>State</span><strong>{panOutput.address?.state || '—'}</strong>
              <span>Pincode</span><strong>{panOutput.address?.pincode || '—'}</strong>
              <span>Country</span><strong>{panOutput.address?.country || '—'}</strong>
              <span>Verification ID</span><strong>{panOutput.verification_id || panVerification.verificationId || '—'}</strong>
              <span>Reference ID</span><strong>{panOutput.reference_id || panVerification.referenceId || '—'}</strong>
              <span>Checked at</span><strong>{panVerification.checkedAt || '—'}</strong>
            </div>
            <details className="pan-result-raw">
              <summary>Raw Cashfree response</summary>
              <pre>{JSON.stringify(panOutput, null, 2)}</pre>
            </details>
          </>
        )}
      </div>
      <div className="pan-opv-card">
        <div className="pan-opv-header">
          <ShieldCheck size={22} />
          <div>
            <strong>Cashfree OVD Verification</strong>
            <span>Driving licence, voter ID, and vehicle RC</span>
          </div>
        </div>
        <div className="form-grid compact-form">
          <Field label="Driving licence number"><input readOnly={Boolean(app.ovd?.dlNumber)} value={secureIdForm.dlNumber} onChange={(event) => setSecureIdForm({ ...secureIdForm, dlNumber: event.target.value.toUpperCase() })} /></Field>
          <Field label="DL date of birth"><input readOnly={Boolean(app.ovd?.dlDob)} type="date" value={secureIdForm.dob} onChange={(event) => setSecureIdForm({ ...secureIdForm, dob: event.target.value })} /></Field>
          <Field label="Voter EPIC number"><input readOnly={Boolean(app.ovd?.epicNumber)} value={secureIdForm.epicNumber} onChange={(event) => setSecureIdForm({ ...secureIdForm, epicNumber: event.target.value.toUpperCase() })} /></Field>
          <Field label="Voter name"><input readOnly={Boolean(app.ovd?.voterName)} value={secureIdForm.voterName} onChange={(event) => setSecureIdForm({ ...secureIdForm, voterName: event.target.value })} /></Field>
          <Field label="Vehicle registration number"><input readOnly={Boolean(app.ovd?.vehicleNumber)} value={secureIdForm.vehicleNumber} onChange={(event) => setSecureIdForm({ ...secureIdForm, vehicleNumber: event.target.value.toUpperCase() })} /></Field>
        </div>
        <div className="button-row">
          <button className="primary-action compact" disabled={secureIdLoading === 'driving-license'} onClick={() => runSecureId('driving-license')}><FileCheck2 size={15} /> {secureIdLoading === 'driving-license' ? 'Checking...' : 'Verify DL'}</button>
          <button className="primary-action compact" disabled={secureIdLoading === 'voter-id'} onClick={() => runSecureId('voter-id')}><FileCheck2 size={15} /> {secureIdLoading === 'voter-id' ? 'Checking...' : 'Verify Voter'}</button>
          <button className="primary-action compact" disabled={secureIdLoading === 'vehicle-rc'} onClick={() => runSecureId('vehicle-rc')}><Car size={15} /> {secureIdLoading === 'vehicle-rc' ? 'Checking...' : 'Verify RC'}</button>
        </div>
        <div className="pan-result-grid">
          <span>DL</span><strong>{dlVerification?.verified ? 'Verified' : dlVerification?.result?.status || 'Pending'}</strong>
          <span>Voter ID</span><strong>{voterVerification?.verified ? 'Verified' : voterVerification?.result?.status || 'Pending'}</strong>
          <span>Vehicle RC</span><strong>{rcVerification?.verified ? 'Verified' : rcVerification?.result?.status || 'Pending'}</strong>
        </div>
        {dlVerification?.result && (
          <DlResultCard verification={dlVerification} />
        )}
        {voterVerification?.result && (
          <OvdResultCard title="Voter ID Response" verification={voterVerification} fields={VOTER_RESULT_FIELDS} />
        )}
        {rcVerification?.result && (
          <RcResultCard verification={rcVerification} />
        )}
      </div>
      <div className="pan-opv-card">
        <div className="pan-opv-header">
          <ShieldCheck size={22} />
          <div>
            <strong>Cashfree Bank Account Verification</strong>
            <span>Account number, IFSC, and name match</span>
          </div>
        </div>
        <div className="form-grid compact-form">
          <Field label="Bank account number"><input inputMode="numeric" value={secureIdForm.bankAccount} onChange={(event) => setSecureIdForm({ ...secureIdForm, bankAccount: event.target.value.replace(/\s/g, '') })} /></Field>
          <Field label="IFSC"><input maxLength={11} value={secureIdForm.ifsc} onChange={(event) => setSecureIdForm({ ...secureIdForm, ifsc: event.target.value.toUpperCase().replace(/\s/g, '') })} /></Field>
          <Field label="Account holder name"><input value={secureIdForm.bankAccountHolder} onChange={(event) => setSecureIdForm({ ...secureIdForm, bankAccountHolder: event.target.value })} /></Field>
        </div>
        <div className="button-row">
          <button className="primary-action compact" disabled={secureIdLoading === 'bank-account'} onClick={() => runSecureId('bank-account')}><FileCheck2 size={15} /> {secureIdLoading === 'bank-account' ? 'Checking...' : 'Verify Bank Account'}</button>
        </div>
        <div className="pan-result-grid">
          <span>Bank account</span><strong>{bankAccountVerification?.verified ? 'Verified' : bankAccountVerification?.result?.account_status || 'Pending'}</strong>
        </div>
        {bankAccountVerification?.result && (
          <BankAccountResultCard verification={bankAccountVerification} />
        )}
      </div>
      {secureIdError && <div className="warning-box"><AlertTriangle size={17} /> {secureIdError}</div>}
      <button
        className="primary-action"
        disabled={!allVerified}
        onClick={() => mutateApplication(app.id, { stage: 'Login / Application', status: 'Docs Pending' }, 'KYC passed and application opened')}
      >
        Proceed to Application Docs
      </button>
    </Panel>
  );
}

function TvrPage({ apps, selected, setSelectedId, mutateApplication }) {
  const tvrApps = apps.filter((app) =>
    ['KYC Check', 'Login / Application', 'Credit Underwriting', 'Sanction & KFS'].includes(app.stage) ||
    ['KYC Pending', 'Docs Pending', 'Docs Hold', 'Credit Queue', 'Sanction Ready'].includes(app.status) ||
    app.kyc.pan === 'Verified' ||
    app.kyc.liveness === 'Verified'
  );
  const active = selected && tvrApps.some((app) => app.id === selected.id) ? selected : tvrApps[0] || null;

  return (
    <div className="content-grid">
      <Panel title="TVR Queue" subtitle="Leads that have reached KYC verification and need tele-verification recording.">
        <div className="stack-list">
          {tvrApps.map((app) => (
            <button key={app.id} className={active?.id === app.id ? 'selected' : ''} onClick={() => setSelectedId(app.id)}>
              <span><strong>{app.customer}</strong><small>{app.id} · {app.mobile} · {app.stage}</small></span>
              <Status value={app.tvr?.status || 'Pending'} />
            </button>
          ))}
          {!tvrApps.length && (
            <div className="empty-state">
              <strong>No leads ready for TVR</strong>
              <span>Newly submitted leads will appear here after they move to KYC verification.</span>
            </div>
          )}
        </div>
      </Panel>
      <TvrPanel app={active} mutateApplication={mutateApplication} />
    </div>
  );
}

function TvrPanel({ app, mutateApplication }) {
  const [audioPreview, setAudioPreview] = useState('');

  useEffect(() => {
    setAudioPreview('');
  }, [app?.id]);

  useEffect(() => () => {
    if (audioPreview) {
      try { URL.revokeObjectURL(audioPreview); } catch (_) { /* ignore */ }
    }
  }, [audioPreview]);

  if (!app) return null;

  const tvr = app.tvr || { status: 'Pending', answers: {}, remarks: '' };
  const answers = tvr.answers || {};
  const answeredCount = countTvrAnswered(answers);
  const applicableCount = countTvrApplicable(answers);
  const pillars = evaluateTvrPillars(answers);
  const allPillarsYes = pillars.highUpgradeIntent && pillars.emiComfort && pillars.routeFit;
  const allFieldsAnswered = answeredCount === applicableCount;
  const canComplete = Boolean(tvr.audioName) && allFieldsAnswered;

  function updateTvr(nextTvr, action) {
    mutateApplication(app.id, (current) => ({
      ...current,
      tvr: { ...(current.tvr || {}), ...nextTvr },
    }), action);
  }

  function handleAudioUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioPreview(url);
    updateTvr({
      status: 'Audio Uploaded',
      audioName: file.name,
      audioUrl: url,
      uploadedAt: new Date().toLocaleString('en-IN'),
    }, 'TVR audio uploaded');
  }

  function updateAnswer(fieldKey, value) {
    const nextAnswers = { ...answers, [fieldKey]: value };
    TVR_CHECKLIST_FIELDS.forEach((field) => {
      if (!isTvrFieldApplicable(field, nextAnswers) && nextAnswers[field.key] !== undefined) {
        delete nextAnswers[field.key];
      }
    });
    updateTvr({
      status: tvr.status === 'Pending' || tvr.status === undefined ? 'In Progress' : tvr.status,
      answers: nextAnswers,
    }, 'TVR checklist updated');
  }

  function completeTvr(recommendation) {
    updateTvr({
      status: 'Completed',
      recommendation,
      pillars,
      completedAt: new Date().toLocaleString('en-IN'),
    }, `TVR completed · ${recommendation}`);
  }

  return (
    <Panel title="Tele Verification Report" subtitle={`${app.customer} · ${app.id} · ${app.mobile}`}>
      <div className="tvr-summary">
        <Metric icon={Fingerprint} label="KYC Aadhaar" value={app.kyc.aadhaar} trend={`PAN ${app.kyc.pan}`} />
        <Metric icon={IndianRupee} label="Loan" value={formatMoney(app.amount)} trend={`${app.tenure} months`} />
        <Metric icon={Mic} label="TVR" value={tvr.status || 'Pending'} trend={`${answeredCount}/${applicableCount} answered`} />
      </div>

      <label className="audio-upload-card">
        <input type="file" accept="audio/*" onChange={handleAudioUpload} />
        <Upload size={22} />
        <span>
          <strong>{tvr.audioName || 'Upload TVR audio'}</strong>
          <small>{tvr.uploadedAt || 'MP3, WAV, M4A, or any call recording audio file'}</small>
        </span>
      </label>
      {(audioPreview || tvr.audioUrl) && <audio className="tvr-audio-player" src={audioPreview || tvr.audioUrl} controls />}

      {(() => {
        const populatedContacts = (app.referenceContacts || []).filter((contact) => contact && (contact.name || contact.contactNo || contact.address));
        if (!populatedContacts.length) return null;
        return (
        <div className="tvr-section">
          <h4 className="tvr-section-title">Family / Friend / Relative Contacts</h4>
          <div className="tvr-reference-list">
            {populatedContacts.map((contact, index) => (
              <div className="tvr-reference-row" key={`tvr-reference-${index}`}>
                <span className={`tvr-reference-type tvr-reference-type-${String(contact.type || '').toLowerCase()}`}>{contact.type || 'Reference'}</span>
                <strong className="tvr-reference-name">{contact.name || '—'}</strong>
                {contact.contactNo
                  ? <a className="tvr-reference-phone" href={`tel:${contact.contactNo}`}>{contact.contactNo}</a>
                  : <span className="tvr-reference-phone tvr-reference-phone-empty">No number</span>}
                {contact.address && <span className="tvr-reference-address">{contact.address}</span>}
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {TVR_CHECKLIST_SECTIONS.map((section) => (
        <div className="tvr-section" key={section.id}>
          <h4 className="tvr-section-title">{section.title}</h4>
          <div className="tvr-questionnaire">
            {section.fields.filter((field) => isTvrFieldApplicable(field, answers)).map((field) => (
              <TvrFieldRow
                key={field.key}
                field={field}
                value={answers[field.key] ?? ''}
                onChange={(value) => updateAnswer(field.key, value)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="tvr-section">
        <h4 className="tvr-section-title">Agent’s Overall Assessment</h4>
        <div className="tvr-pillars">
          <PillarRow
            label="High Upgrade Intent"
            detail="Range < 60 km OR charge > 6 hrs"
            ok={pillars.highUpgradeIntent}
          />
          <PillarRow
            label="EMI Comfort"
            detail={`Current spend (Rs. ${pillars.totalSpend || 0}) ≥ EMI + Rs. 100 buffer`}
            ok={pillars.emiComfort}
          />
          <PillarRow
            label="Route Fit"
            detail="Swap station accessible daily"
            ok={pillars.routeFit}
          />
        </div>
        <div className={`tvr-rule-banner ${allPillarsYes ? 'ok' : 'warn'}`}>
          {allPillarsYes
            ? 'All three pillars are Yes — eligible for Recommended status.'
            : 'DhanUrja rule: Approve only if all three pillars are Yes.'}
        </div>
      </div>

      <Field label="Agent remarks">
        <textarea
          rows={4}
          value={tvr.remarks || ''}
          onChange={(event) => updateTvr({ remarks: event.target.value, status: tvr.status === 'Pending' ? 'In Progress' : tvr.status }, 'TVR remarks updated')}
          placeholder="Caller observations, customer responses, or exceptions."
        />
      </Field>

      <div className="button-row">
        <button
          className="secondary-action"
          onClick={() => completeTvr('Hold – Need Field Visit')}
          disabled={!canComplete}
        >
          Hold – Field Visit
        </button>
        <button
          className="secondary-action"
          onClick={() => completeTvr('Not Recommended')}
          disabled={!canComplete}
        >
          Not Recommended
        </button>
        <button
          className="primary-action compact"
          disabled={!canComplete || !allPillarsYes}
          onClick={() => completeTvr('Recommended')}
        >
          Recommend
        </button>
      </div>
      {!canComplete && (
        <div className="warning-box">
          <AlertTriangle size={17} /> Upload TVR audio and complete every applicable checklist field before submitting.
        </div>
      )}
      {canComplete && !allPillarsYes && (
        <div className="warning-box">
          <AlertTriangle size={17} /> One or more pillars failed — Recommend is disabled. Use Hold or Not Recommended.
        </div>
      )}
      {tvr.recommendation && (
        <div className="tvr-rule-banner ok">
          Final TVR decision: <strong>{tvr.recommendation}</strong>{tvr.completedAt ? ` · ${tvr.completedAt}` : ''}
        </div>
      )}
    </Panel>
  );
}

function TvrFieldRow({ field, value, onChange }) {
  if (field.type === 'yesno') {
    const options = ['Yes', 'No', ...(field.extra ? [field.extra] : [])];
    return (
      <div className="tvr-question-row">
        <span>{field.label}</span>
        <div className="segmented-control">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={value === option ? 'active' : ''}
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (field.type === 'choice') {
    return (
      <div className="tvr-question-row">
        <span>{field.label}</span>
        <div className="segmented-control">
          {field.options.map((option) => (
            <button
              type="button"
              key={option}
              className={value === option ? 'active' : ''}
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="tvr-question-row">
      <span>{field.label}</span>
      <div className="tvr-input-wrap">
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          inputMode={field.type === 'number' ? 'numeric' : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.suffix || ''}
        />
        {field.suffix && <span className="tvr-input-suffix">{field.suffix}</span>}
      </div>
    </div>
  );
}

function PillarRow({ label, detail, ok }) {
  return (
    <div className={`tvr-pillar-row ${ok ? 'ok' : 'warn'}`}>
      {ok ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span><strong>{label}</strong><small>{detail}</small></span>
      <span className={`tvr-pillar-flag ${ok ? 'ok' : 'warn'}`}>{ok ? 'Yes' : 'No'}</span>
    </div>
  );
}

function FieldPage(props) {
  const { apps, selected, setSelectedId, mutateApplication } = props;
  const pendingLocationRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState('');

  const selectedEvidence = selected?.geo?.evidencePhotos || [];

  async function fetchLocation() {
    try {
      const position = await requestBrowserLocation();
      const capturedAt = new Date();
      const location = {
        lat: Number(position.coords.latitude).toFixed(6),
        lng: Number(position.coords.longitude).toFixed(6),
        accuracy: Math.round(position.coords.accuracy || 0),
        capturedAt: capturedAt.toISOString(),
        capturedAtLabel: capturedAt.toLocaleString('en-IN'),
      };
      pendingLocationRef.current = location;
      setPendingLocation(location);
      return location;
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Unable to capture location. Photo will be saved without geotag.');
      return null;
    }
  }

  function openGallery() {
    if (!selected || captureBusy) return;
    setCaptureError('');
    galleryInputRef.current?.click();
  }

  async function handlePhotoFiles(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    event.target.value = '';
    if (!selected || !files.length) return;

    setCaptureError('');
    setCaptureBusy(true);
    let location = pendingLocationRef.current || pendingLocation;
    if (!location) {
      location = await fetchLocation();
    }
    try {
      const compressedPhotos = await Promise.all(files.map(async (file, index) => {
        const compressed = await compressImageToLimit(file, 150 * 1024);
        if (compressed.size > 150 * 1024) {
          throw new Error(`"${file.name}" could not be compressed below 150 KB.`);
        }
        return {
          id: `geo-${Date.now()}-${index}`,
          name: compressed.name || file.name || `Visit photo ${index + 1}`,
          dataUrl: compressed.dataUrl,
          originalSize: compressed.originalSize,
          compressedSize: compressed.size,
          width: compressed.width,
          height: compressed.height,
          lat: location?.lat || '',
          lng: location?.lng || '',
          accuracy: location?.accuracy || 0,
          capturedAt: location?.capturedAt || new Date().toISOString(),
          capturedAtLabel: location?.capturedAtLabel || new Date().toLocaleString('en-IN'),
        };
      }));

      mutateApplication(selected.id, (app) => ({
        ...app,
        geo: {
          ...app.geo,
          status: 'Photo Captured',
          lat: location?.lat || app.geo?.lat || '',
          lng: location?.lng || app.geo?.lng || '',
          accuracy: location?.accuracy || app.geo?.accuracy || 0,
          lastCapturedAt: location?.capturedAtLabel || new Date().toLocaleString('en-IN'),
          photo: true,
          evidencePhotos: [...(app.geo?.evidencePhotos || []), ...compressedPhotos],
        },
      }), 'Geo photo captured', `${compressedPhotos.length} photo(s)${location ? ` · ${location.lat}, ${location.lng}` : ' (no geotag)'}`);
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Unable to compress photo.');
    } finally {
      setCaptureBusy(false);
    }
  }

  return (
    <div className="content-grid">
      <Panel title="Field Investigation" subtitle="Photo evidence, geotag, and address visit confirmation.">
        <div className="stack-list">
          {apps.map((app) => (
            <button key={app.id} onClick={() => setSelectedId(app.id)}>
              <span><strong>{app.customer}</strong><small>{app.geo.status} · {app.batteryModel}</small></span>
              <Status value={app.geo.status} />
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Geo Evidence" subtitle={selected ? `${selected.customer} · ${selected.id}` : ''}>
        {selected && (
          <>
            <div className="geo-evidence">
              <MapPin size={28} />
              <strong>{selected.geo.status}</strong>
              <span>
                {selected.geo.lat && selected.geo.lng ? `${selected.geo.lat}, ${selected.geo.lng}` : 'Coordinates pending'}
                {selected.geo.accuracy ? ` · accuracy ${selected.geo.accuracy}m` : ''}
                {' · '}
                {selectedEvidence.length ? `${selectedEvidence.length} photo(s)` : 'visit photo pending'}
                {selected.geo.lastCapturedAt ? ` · ${selected.geo.lastCapturedAt}` : ''}
              </span>
            </div>
            <input ref={galleryInputRef} className="hidden-file-input" type="file" accept="image/*" multiple onChange={handlePhotoFiles} />
            <div className="button-row">
              <button type="button" className="secondary-action" disabled={captureBusy} onClick={openGallery}>{captureBusy ? 'Working...' : 'Choose photos'}</button>
            </div>
            {captureError && <p className="error-text">{captureError}</p>}
            <div className="geo-photo-grid">
              {selectedEvidence.map((photo) => (
                <div className="geo-photo-card" key={photo.id}>
                  <img src={photo.dataUrl} alt={photo.name} />
                  <div>
                    <strong>{photo.name}</strong>
                    <span>{photo.capturedAtLabel}</span>
                    <span>{photo.lat}, {photo.lng}{photo.accuracy ? ` · ${photo.accuracy}m` : ''}</span>
                    <span>{formatBytes(photo.originalSize)} to {formatBytes(photo.compressedSize)} · {photo.width}x{photo.height}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

const CREDIT_CHECKLIST_ITEMS = [
  'Aadhaar Card',
  'PAN Card',
  'ITR (last 2 years)',
  'Bank Statement (6 months)',
  'Electricity Bill',
  'Salary Slips (3 months)',
  'Form 16',
  'GST Returns',
  'Rent Agreement / Property Proof',
  'Passport-size Photograph',
  'Reference Verification',
  'CIBIL / Bureau Report',
  'Employment Proof',
  'Vehicle Quotation / Invoice',
];

function CreditPage({ apps, selected, setSelectedId, mutateApplication, rules }) {
  const creditApps = apps.filter((app) => ['Credit Underwriting', 'Sanction & KFS'].includes(app.stage) || app.credit.decision === 'Refer');
  const [remarks, setRemarks] = useState('');
  useEffect(() => { setRemarks(selected?.credit?.reason || ''); }, [selected?.id]);
  const foir = selected ? (Number(selected.existingEmi || 0) + Number(selected.emi || 0)) / Math.max(Number(selected.monthlyIncome || 1), 1) : 0;
  const checklist = selected?.credit?.checklist || {};
  const toggleChecklist = (item) => {
    if (!selected) return;
    const next = { ...checklist, [item]: !checklist[item] };
    mutateApplication(selected.id, (app) => ({ ...app, credit: { ...app.credit, checklist: next } }), `${item} ${next[item] ? 'marked verified' : 'unmarked'}`);
  };
  const verifiedCount = CREDIT_CHECKLIST_ITEMS.filter((item) => checklist[item]).length;
  return (
    <div className="content-grid">
      <Panel title="Credit Underwriting Queue" subtitle="Manual credit review — officer decides on every file.">
        <div className="stack-list">
          {creditApps.map((app) => (
            <button key={app.id} className={selected?.id === app.id ? 'selected' : ''} onClick={() => setSelectedId(app.id)}>
              <span><strong>{app.customer}</strong><small>Score {app.credit.bureauScore || 'not pulled'} · EMI {formatMoney(app.emi)}</small></span>
              <Status value={app.credit.decision} />
            </button>
          ))}
        </div>
      </Panel>
      {selected && (
        <Panel title="Manual Credit Review" subtitle={`${selected.id} · ${selected.customer}`}>
          <div className="score-grid">
            <Metric icon={Calculator} label="FOIR" value={`${(foir * 100).toFixed(1)}%`} trend="Reference only" />
            <Metric icon={IndianRupee} label="EMI" value={formatMoney(selected.emi)} trend={`Income ${formatMoney(selected.monthlyIncome)}`} />
          </div>
          <div className="mini-table">
            <span>Loan amount</span><strong>{formatMoney(selected.amount)}</strong>
            <span>Tenure</span><strong>{selected.tenure} months</strong>
            <span>Existing EMI</span><strong>{formatMoney(selected.existingEmi || 0)}</strong>
            <span>PAN</span><strong>{selected.pan} · {selected.kyc.pan}</strong>
            <span>Liveness</span><strong>{selected.kyc.liveness}</strong>
          </div>
          <section style={{ marginTop: 16 }}>
            <h4>Document & Verification Checklist <small style={{ fontWeight: 400, color: 'var(--muted)' }}>({verifiedCount}/{CREDIT_CHECKLIST_ITEMS.length} verified)</small></h4>
            <div className="credit-checklist">
              {CREDIT_CHECKLIST_ITEMS.map((item) => (
                <label key={item} className={`credit-check-item ${checklist[item] ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(checklist[item])}
                    onChange={() => toggleChecklist(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>
          <label className="field-label" style={{ marginTop: 12 }}>
            <span>Credit officer remarks</span>
            <textarea
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Capture the rationale for approve, refer, or reject."
            />
          </label>
          <div className="button-row">
            <button className="secondary-action" onClick={() => mutateApplication(selected.id, { credit: { ...selected.credit, decision: 'Reject', reason: remarks || 'Rejected by credit officer' }, status: 'Rejected', stage: 'Closed / NPA' }, 'Credit rejected')}>Reject</button>
            <button className="secondary-action" onClick={() => mutateApplication(selected.id, { credit: { ...selected.credit, decision: 'Refer', referred: true, reason: remarks || 'Referred to higher authority' }, status: 'Referred', stage: 'Credit Underwriting' }, 'Referred to higher authority')}>Refer</button>
            <button className="primary-action compact" onClick={() => mutateApplication(selected.id, { credit: { ...selected.credit, decision: 'Approved', foir, reason: remarks || 'Approved by credit officer' }, status: 'Sanction Ready', stage: 'Sanction & KFS' }, 'Credit approved')}>Approve</button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function SanctionPage({ apps, selected, setSelectedId, mutateApplication }) {
  const sanctionApps = apps.filter((app) => ['Sanction & KFS', 'NACH + Disbursement'].includes(app.stage));
  return (
    <div className="content-grid">
      <Panel title="Sanction & KFS" subtitle="RBI KFS, sanction letter, borrower OTP acceptance, and e-sign trail.">
        <div className="stack-list">
          {sanctionApps.map((app) => (
            <button key={app.id} onClick={() => setSelectedId(app.id)}>
              <span><strong>{app.customer}</strong><small>{formatMoney(app.amount)} · {app.tenure} months · EMI {formatMoney(app.emi)}</small></span>
              <Status value={app.sanction.kfsAccepted ? 'Accepted' : app.sanction.generated ? 'Generated' : 'Pending'} />
            </button>
          ))}
        </div>
      </Panel>
      {selected && (
        <Panel title="Borrower Acceptance" subtitle={`${selected.customer} · KFS validity ${selected.sanction.validity}`}>
          <div className="kfs-card">
            <FileSignature size={28} />
            <h3>Key Fact Statement</h3>
            <p>Loan amount {formatMoney(selected.amount)}, interest {(selected.rate * 100).toFixed(0)}% p.a. flat, tenure {selected.tenure} months, EMI {formatMoney(selected.emi)}, total payable {formatMoney(selected.totalPayable)}.</p>
          </div>
          <div className="button-row">
            <button className="primary-action compact" onClick={() => mutateApplication(selected.id, (app) => ({ ...app, sanction: { ...app.sanction, generated: true } }), 'Sanction letter and KFS generated')}>Generate Letter</button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function DisbursementPage({ apps, selected, setSelectedId, mutateApplication }) {
  const opsApps = apps.filter((app) => ['NACH + Disbursement', 'Loan Servicing'].includes(app.stage));
  const ready = selected?.sanction.kfsAccepted && selected?.nach.pennyDrop === 'Verified' && selected?.nach.mandate === 'Registered';
  return (
    <div className="content-grid">
      <Panel title="NACH + Disbursement" subtitle="Register mandate, verify bank account, and release funds within 48 hours.">
        <div className="stack-list">
          {opsApps.map((app) => (
            <button key={app.id} onClick={() => setSelectedId(app.id)}>
              <span><strong>{app.customer}</strong><small>{app.nach.bank} · {app.nach.accountMasked}</small></span>
              <Status value={app.disbursement.status} />
            </button>
          ))}
        </div>
      </Panel>
      {selected && (
        <Panel title="Operations Checklist" subtitle={`${selected.id} · payout to ${selected.disbursement.beneficiary}`}>
          <div className="ops-grid">
            <CheckCard label="KFS accepted" done={selected.sanction.kfsAccepted} />
            <CheckCard label="Penny drop verified" done={selected.nach.pennyDrop === 'Verified'} />
            <CheckCard label="NACH registered" done={selected.nach.mandate === 'Registered'} />
            <CheckCard label="Disbursal released" done={selected.disbursement.status === 'Released'} />
          </div>
          <div className="mini-table">
            <span>Bank</span><strong>{selected.nach.bank}</strong>
            <span>Account</span><strong>{selected.nach.accountMasked}</strong>
            <span>IFSC</span><strong>{selected.nach.ifsc}</strong>
            <span>Beneficiary</span><strong>{selected.disbursement.beneficiary}</strong>
          </div>
          <div className="button-row">
            <button className="secondary-action" onClick={() => mutateApplication(selected.id, (app) => ({ ...app, nach: { ...app.nach, pennyDrop: 'Verified' } }), 'Penny drop verified')}>Verify Account</button>
            <button className="secondary-action" onClick={() => mutateApplication(selected.id, (app) => ({ ...app, nach: { ...app.nach, mandate: 'Registered' }, documents: { ...app.documents, 'NACH mandate': true } }), 'NACH mandate registered')}>Register NACH</button>
            <button className="primary-action compact" disabled={!ready || selected.disbursement.status === 'Released'} onClick={() => mutateApplication(selected.id, (app) => ({ ...app, stage: 'Loan Servicing', status: 'Active Loan', disbursement: { ...app.disbursement, status: 'Released', utr: `UTR${Date.now().toString().slice(-8)}`, releasedAt: today(), slaDue: today(2) }, servicing: { ...app.servicing, loanAccountNo: `LAN-${Date.now().toString().slice(-5)}`, schedule: makeScheduleFromFirstEmi(app.amount, app.tenure, app.firstEmiDate || addMonthsToDate(today(), 1), app.rate), outstanding: app.totalPayable } }), 'Funds released and LMS account opened')}>Release Funds</button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function CollectionsPage({ apps, selected, setSelectedId, mutateApplication }) {
  const servicingApps = apps.filter((app) => ['Loan Servicing', 'Closed / NPA'].includes(app.stage) || app.disbursement.status === 'Released');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return servicingApps;
    return servicingApps.filter((app) => [app.customer, app.servicing?.loanAccountNo, app.id, app.mobile, app.pan]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [servicingApps, query]);
  const active = selected && filtered.some((app) => app.id === selected.id) ? selected : filtered[0] || servicingApps[0] || null;
  useEffect(() => {
    if (active?.id && active.id !== selected?.id) setSelectedId(active.id);
  }, [active?.id, selected?.id, setSelectedId]);
  const selectedLog = Array.isArray(active?.collections?.log) ? active.collections.log : [];
  return (
    <div className="lead-list-page">
      <section className="lead-list-sidebar">
        <div className="lead-page-header">
          <div>
            <h1>Collections</h1>
            <p>Loan servicing, EMI, DPD, NPA, recovery, and NOC closure.</p>
          </div>
        </div>
        <div className="lead-list-toolbar">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, LAN, PAN, mobile"
            style={{ flex: 1, minWidth: 0, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: '13px' }}
          />
          <span>{filtered.length} loans</span>
        </div>
        <div className="lead-list-items">
          {filtered.length ? filtered.map((app) => (
            <button key={app.id} type="button" className={active?.id === app.id ? 'selected' : ''} onClick={() => setSelectedId(app.id)}>
              <span>
                <strong>{app.customer}</strong>
                <small>{app.servicing?.loanAccountNo || app.id} · DPD {app.servicing?.dpd ?? 0} · {formatMoney(app.servicing?.outstanding ?? 0)}</small>
              </span>
              <Status value={app.servicing?.bucket || 'Current'} />
            </button>
          )) : <EmptyState title="No loans in servicing" detail="Disbursed loans will appear here once they reach the servicing stage." />}
        </div>
      </section>
      {active ? (
        <section className="lead-detail-panel">
        <Panel title={`LMS Account · ${active.servicing?.loanAccountNo || active.id}`} subtitle={`${active.customer} · outstanding ${formatMoney(active.servicing?.outstanding ?? 0)}`}>
          <div className="collections-metric-row">
            <div><span>EMI</span><strong>{formatMoney(active.emi)}</strong><small>Monthly</small></div>
            <div><span>DPD</span><strong>{active.servicing?.dpd ?? 0}</strong><small>{active.servicing?.bucket || 'Current'}</small></div>
            <div><span>Outstanding</span><strong>{formatMoney(active.servicing?.outstanding ?? 0)}</strong><small>LMS</small></div>
            <div><span>Bounces</span><strong>{active.servicing?.bounces ?? 0}</strong><small>NACH</small></div>
          </div>
          <div className="content-grid">
            <section>
              <h4>EMI Schedule</h4>
              {active.servicing?.schedule?.length ? (
                <div className="schedule-list">
                  {active.servicing.schedule.slice(0, 6).map((emi) => (
                    <div key={emi.id}>
                      <span>{emi.id} · {emi.dueDate}</span>
                      <strong>{formatMoney(emi.amount)}</strong>
                      <Status value={emi.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No EMI schedule" detail="No EMI schedule has been generated for this loan yet." />
              )}
            </section>
            <section>
              <h4>Collection Actions ({selectedLog.length})</h4>
              {selectedLog.length ? (
                <div className="schedule-list">
                  {selectedLog.map((entry) => (
                    <div key={entry.id}>
                      <span>
                        <strong>{entry.actionType || 'Action'}</strong>
                        <small>{entry.createdAt || '—'} · DPD {entry.dpd}{entry.bucket ? ` · ${entry.bucket}` : ''}{entry.ptpDate ? ` · PTP ${entry.ptpDate}` : ''}{entry.npaMarked ? ' · NPA' : ''}</small>
                        {entry.notes && <small>{entry.notes}</small>}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No collection actions" detail="No collection actions logged for this loan yet." />
              )}
            </section>
          </div>
          <div className="button-row">
            <button className="secondary-action" onClick={() => mutateApplication(active.id, markNextEmiBounce, 'NACH bounce logged and DPD updated')}>Log NACH Bounce</button>
            <button className="secondary-action" onClick={() => mutateApplication(active.id, (app) => ({ ...app, servicing: { ...app.servicing, outstanding: Math.max(0, app.servicing.outstanding - app.emi), dpd: 0, bucket: 'Current' }, status: 'Active Loan' }), 'EMI payment recorded')}>Record Payment</button>
            <button className="secondary-action" onClick={() => mutateApplication(active.id, (app) => ({ ...app, collections: { ...app.collections, action: 'PTP logged', ptpDate: today(3), npaMarked: app.servicing.dpd >= 90 }, status: app.servicing.dpd >= 90 ? 'NPA' : app.status }), 'Collections action logged')}>Log PTP</button>
            <button className="primary-action compact" disabled={active.servicing.outstanding > active.emi} onClick={() => mutateApplication(active.id, (app) => ({ ...app, stage: 'Closed / NPA', status: 'Closed - NOC Issued', servicing: { ...app.servicing, outstanding: 0, dpd: 0, bucket: 'Closed' } }), 'Loan closed and NOC issued')}>Issue NOC</button>
          </div>
        </Panel>
        </section>
      ) : (
        <EmptyState title="No loan selected" detail="Pick a loan from the list to view its servicing details." />
      )}
    </div>
  );
}

function DelinquencyReportPage({ allApps, dsas, setSelectedId }) {
  const rows = useMemo(() => delinquencyRows(allApps), [allApps]);
  const totalOutstanding = rows.reduce((sum, row) => sum + rowNumber(row.app.servicing?.outstanding), 0);
  const highRiskRows = rows.filter((row) => row.app.servicing.dpd >= 90 || row.bounces >= 4);
  const dsaNameById = new Map(dsas.map((dsa) => [dsa.id, dsaDisplayName(dsa) || dsa.owner || dsa.id]));

  return (
    <div className="dashboard-layout">
      <section className="hero-panel">
        <div>
          <h1>Delinquency Report</h1>
          <p>Customers with three or more EMI bounces, current DPD, outstanding exposure, DSA ownership, and collection action status.</p>
        </div>
        <div className="rule-strip">
          <strong>{rows.length}</strong><span>3+ bounce customers</span>
          <strong>{formatMoney(totalOutstanding)}</strong><span>Outstanding</span>
          <strong>{highRiskRows.length}</strong><span>High risk</span>
        </div>
      </section>
      <section className="kpi-row">
        <Metric icon={AlertTriangle} label="Delinquent customers" value={rows.length} trend="3+ EMI bounces" />
        <Metric icon={ReceiptIndianRupee} label="At-risk outstanding" value={formatMoney(totalOutstanding)} trend="Live book" />
        <Metric icon={Gauge} label="Avg DPD" value={rows.length ? Math.round(average(rows.map((row) => row.app.servicing.dpd))) : 0} trend="Collections" />
        <Metric icon={Users} label="DSA impacted" value={new Set(rows.map((row) => row.app.dsaId).filter(Boolean)).size} trend="Network" />
      </section>
      <Panel title="Customers With 3+ EMI Bounces" subtitle="Click a customer to open the active loan record.">
        {rows.length ? (
          <div className="report-table dense-table delinquency-table">
            {rows.map(({ app, bounces }) => (
              <button key={app.id} type="button" onClick={() => setSelectedId(app.id)}>
                <span>
                  <strong>{app.customer}</strong>
                  <small>{app.customerCode} · {app.mobile} · {app.servicing.loanAccountNo || app.id}</small>
                </span>
                <strong>{bounces} bounces</strong>
                <Status value={dpdBand(app.servicing.dpd)} />
                <small>{formatMoney(app.servicing.outstanding)} outstanding · EMI {formatMoney(app.emi)} · DSA {dsaNameById.get(app.dsaId) || app.dsaId || 'Unassigned'} · Action {app.collections.action || 'Pending'}</small>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No delinquent customers" detail="No customer currently has three or more EMI bounces." />
        )}
      </Panel>
    </div>
  );
}

function reportPresetRange(id) {
  const t = today();
  if (id === 'today') return { from: t, to: t };
  if (id === '7d') return { from: today(-6), to: t };
  if (id === '30d') return { from: today(-29), to: t };
  if (id === 'mtd') return { from: `${t.slice(0, 7)}-01`, to: t };
  if (id === 'qtd') {
    const d = new Date(t);
    const qStart = Math.floor(d.getMonth() / 3) * 3;
    const from = new Date(d.getFullYear(), qStart, 1).toISOString().slice(0, 10);
    return { from, to: t };
  }
  if (id === 'fy') {
    const d = new Date(t);
    const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return { from: `${year}-04-01`, to: t };
  }
  return { from: '', to: '' };
}

function ReportsPage({ allApps, dsas, rules }) {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activePreset, setActivePreset] = useState('all');
  const [filters, setFilters] = useState({ dsa: 'All', stage: 'All', risk: 'All', source: 'All' });
  const [activeReport, setActiveReport] = useState('filtered');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ column: 'customer', dir: 'asc' });

  const dateFilteredApps = useMemo(
    () => allApps.filter((app) => isWithinDateRange(app, dateRange.from, dateRange.to)),
    [allApps, dateRange.from, dateRange.to],
  );
  const filteredApps = useMemo(() => dateFilteredApps.filter((app) => {
    if (filters.dsa !== 'All' && app.dsaId !== filters.dsa) return false;
    if (filters.stage !== 'All' && app.stage !== filters.stage) return false;
    if (filters.risk !== 'All' && (app.risk || 'To Review') !== filters.risk) return false;
    if (filters.source !== 'All' && app.source !== filters.source) return false;
    return true;
  }), [dateFilteredApps, filters]);

  const analytics = useMemo(
    () => buildPortfolioAnalytics(filteredApps, dsas, rules),
    [filteredApps, dsas, rules],
  );

  const sources = useMemo(
    () => Array.from(new Set(allApps.map((a) => a.source).filter(Boolean))).sort(),
    [allApps],
  );
  const presetButtons = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: 'mtd', label: 'MTD' },
    { id: 'qtd', label: 'QTD' },
    { id: 'fy', label: 'FY' },
    { id: 'all', label: 'All' },
  ];
  function applyPreset(id) {
    setDateRange(reportPresetRange(id));
    setActivePreset(id);
  }
  function onDateChange(key, value) {
    setDateRange((current) => ({ ...current, [key]: value }));
    setActivePreset('custom');
  }
  function resetFilters() {
    setFilters({ dsa: 'All', stage: 'All', risk: 'All', source: 'All' });
    setSearch('');
  }
  const activeFilterCount = ['dsa', 'stage', 'risk', 'source'].filter((k) => filters[k] !== 'All').length;

  const reportCards = [
    {
      id: 'filtered',
      label: 'Filtered apps',
      value: analytics.total,
      rows: filteredApps,
      detail: 'Every application inside the selected report date range.',
    },
    {
      id: 'conversion',
      label: 'Conversion',
      value: analytics.conversion,
      rows: analytics.released,
      detail: 'Applications where disbursement has been released.',
    },
    {
      id: 'npa',
      label: 'NPA rate',
      value: analytics.npaRate,
      rows: analytics.npa,
      detail: `Accounts at or above ${rules.npaDpd} DPD.`,
    },
    {
      id: 'par',
      label: 'PAR value',
      value: analytics.portfolioAtRisk,
      rows: analytics.overdue,
      detail: 'Accounts with any days past due.',
    },
    {
      id: 'requested',
      label: 'Requested value',
      value: formatMoney(analytics.totalRequested),
      rows: filteredApps,
      detail: 'All requested applications used for total demand.',
    },
    {
      id: 'outstanding',
      label: 'Book outstanding',
      value: formatMoney(analytics.outstanding),
      rows: analytics.active,
      detail: 'Active accounts contributing to current book outstanding.',
    },
    {
      id: 'dsa',
      label: 'DSA report',
      value: dsas.length,
      rows: filteredApps.filter((app) => app.dsaId),
      detail: 'Applications sourced through a DSA.',
    },
    (() => {
      const exceptionApps = filteredApps.filter((app) => (
        documentCompletion(app) < 1
        || ['Failed', 'Pending'].some((status) => Object.values(app.kyc).includes(status))
        || app.stage === 'Credit Underwriting'
        || app.credit.decision === 'Refer'
        || (app.sanction.generated && !app.sanction.kfsAccepted)
        || (app.stage === 'NACH + Disbursement' && app.nach.mandate !== 'Registered')
        || app.servicing.dpd > 0
      ));
      return {
        id: 'exceptions',
        label: 'Exceptions',
        value: exceptionApps.length,
        rows: exceptionApps,
        detail: 'Records with KYC, document, credit, KFS, NACH, or DPD blockers.',
      };
    })(),
  ];
  const selectedReport = reportCards.find((card) => card.id === activeReport) || reportCards[0];
  const exportLabel = dateRange.from || dateRange.to ? `${dateRange.from || 'start'}_to_${dateRange.to || 'today'}` : 'all_dates';

  const searchedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectedReport.rows;
    return selectedReport.rows.filter((app) => (
      [app.customer, app.customerCode, app.id, app.mobile].join(' ').toLowerCase().includes(q)
    ));
  }, [selectedReport.rows, search]);

  const sortedRows = useMemo(() => {
    const rows = [...searchedRows];
    const dir = sort.dir === 'asc' ? 1 : -1;
    const pick = (app) => {
      if (sort.column === 'amount') return app.amount;
      if (sort.column === 'dpd') return app.servicing?.dpd || 0;
      if (sort.column === 'stage') return app.stage || '';
      return app.customer || '';
    };
    rows.sort((a, b) => {
      const av = pick(a);
      const bv = pick(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  }, [searchedRows, sort]);

  function toggleSort(col) {
    setSort((s) => (s.column === col ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { column: col, dir: 'asc' }));
  }
  const sortGlyph = (col) => (sort.column !== col ? '⇅' : sort.dir === 'asc' ? '▲' : '▼');

  function handleCsvDownload() {
    downloadCsv(`dhanurja-deep-report-${exportLabel}.csv`, reportCsvRows(filteredApps, rules));
  }

  const dpdColors = ['#4fb159', '#f1b162', '#e8964a', '#dd6f47', '#ef6a6a'];
  const dpdSlices = analytics.dpdRows.map((r, i) => ({ label: r.label, value: r.count, color: dpdColors[i] || '#999' }));
  const sourceColors = ['#297a37', '#4fb159', '#6dcf6a', '#a4cd9c', '#4eb699', '#f1b162'];
  const sourceSlices = analytics.sourceRows.map((r, i) => ({ label: r.label, value: r.count, color: sourceColors[i % sourceColors.length] }));
  const stageMax = Math.max(1, ...analytics.stages.map((s) => s.count));
  const ticketMax = Math.max(1, ...analytics.ticketRows.map((r) => r.count));

  return (
    <div className="dashboard-layout">
      <section className="hero-panel">
        <div>
          <h1>Deep Portfolio Reports</h1>
          <p>Executive MIS, funnel leakage, DSA productivity, KYC quality, credit policy stress, collections aging, and operational blockers in one reporting desk.</p>
        </div>
        <div className="report-controls">
          <Field label="From date">
            <input type="date" value={dateRange.from} onChange={(event) => onDateChange('from', event.target.value)} />
          </Field>
          <Field label="To date">
            <input type="date" value={dateRange.to} onChange={(event) => onDateChange('to', event.target.value)} />
          </Field>
          <button className="secondary-action compact-action" type="button" onClick={() => applyPreset('all')}>Clear</button>
          <button className="primary-action compact" type="button" onClick={handleCsvDownload}><Download size={16} /> CSV</button>
        </div>
      </section>
      <section className="report-preset-bar">
        <div className="report-preset-group">
          <span className="report-preset-label">Quick range</span>
          {presetButtons.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={activePreset === preset.id ? 'active' : ''}
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
          {activePreset === 'custom' && <span className="report-preset-tag">Custom</span>}
        </div>
        <div className="report-filter-group">
          <Field label="DSA">
            <select value={filters.dsa} onChange={(e) => setFilters((f) => ({ ...f, dsa: e.target.value }))}>
              <option value="All">All DSAs</option>
              {dsas.map((d) => <option key={d.id} value={d.id}>{dsaDisplayName(d) || d.id}</option>)}
            </select>
          </Field>
          <Field label="Stage">
            <select value={filters.stage} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}>
              <option value="All">All stages</option>
              {lifecycle.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Risk">
            <select value={filters.risk} onChange={(e) => setFilters((f) => ({ ...f, risk: e.target.value }))}>
              <option value="All">All risk</option>
              {['Low', 'Medium', 'High', 'To Review'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select value={filters.source} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}>
              <option value="All">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          {(activeFilterCount > 0 || search) && (
            <button className="secondary-action compact-action" type="button" onClick={resetFilters}>
              Reset filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
          )}
        </div>
      </section>
      <section className="report-summary-strip">
        {reportCards.slice(0, 4).map((card) => (
          <button key={card.id} type="button" className={activeReport === card.id ? 'active' : ''} onClick={() => setActiveReport(card.id)}>
            <strong>{card.value}</strong><span>{card.label}</span>
          </button>
        ))}
      </section>
      <section className="kpi-row">
        <Metric icon={Download} label="Disbursed count" value={analytics.released.length} trend={formatMoney(analytics.totalBooked)} onClick={() => setActiveReport('conversion')} active={activeReport === 'conversion'} />
        <Metric icon={IndianRupee} label="Requested value" value={formatMoney(analytics.totalRequested)} trend={`${formatMoney(analytics.avgTicket)} avg`} onClick={() => setActiveReport('requested')} active={activeReport === 'requested'} />
        <Metric icon={ReceiptIndianRupee} label="Book outstanding" value={formatMoney(analytics.outstanding)} trend={`${analytics.portfolioAtRisk} PAR`} onClick={() => setActiveReport('outstanding')} active={activeReport === 'outstanding'} />
        <Metric icon={AlertTriangle} label="NPA aging" value={analytics.npa.length} trend={formatMoney(analytics.npaExposure)} onClick={() => setActiveReport('npa')} active={activeReport === 'npa'} />
        <Metric icon={Users} label="DSA report" value={dsas.length} trend="Network" onClick={() => setActiveReport('dsa')} active={activeReport === 'dsa'} />
        <Metric icon={MessageSquareText} label="Exceptions" value={selectedReport.id === 'exceptions' ? selectedReport.rows.length : reportCards.find((card) => card.id === 'exceptions')?.value} trend="Open controls" onClick={() => setActiveReport('exceptions')} active={activeReport === 'exceptions'} />
      </section>
      <section className="report-detail-panel" id="report-detail">
        <div className="panel-title">
          <div>
            <h3>{selectedReport.label} Data</h3>
            <p>{selectedReport.detail}</p>
          </div>
          <div className="report-detail-tools">
            <label className="report-search">
              <Search size={14} />
              <input
                type="search"
                placeholder="Search customer, code, mobile or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <Status value={`${sortedRows.length} / ${selectedReport.rows.length} rows`} />
          </div>
        </div>
        {sortedRows.length ? (
          <div className="report-data-table">
            <div className="report-data-head sortable">
              <button type="button" onClick={() => toggleSort('customer')}>Customer <em>{sortGlyph('customer')}</em></button>
              <button type="button" onClick={() => toggleSort('stage')}>Stage <em>{sortGlyph('stage')}</em></button>
              <button type="button" onClick={() => toggleSort('amount')}>Amount <em>{sortGlyph('amount')}</em></button>
              <button type="button" onClick={() => toggleSort('dpd')}>Risk / DPD <em>{sortGlyph('dpd')}</em></button>
            </div>
            {sortedRows.map((app) => (
              <div className="report-data-row" key={`${selectedReport.id}-${app.id}`}>
                <span><strong>{app.customer}</strong><small>{app.customerCode} · {app.id}</small></span>
                <span><Status value={app.status} /><small>{app.stage}</small></span>
                <span><strong>{formatMoney(app.amount)}</strong><small>Outstanding {formatMoney(app.servicing.outstanding)}</small></span>
                <span><strong>{app.risk || 'To Review'}</strong><small>{dpdBand(app.servicing.dpd)} · DPD {app.servicing.dpd}</small></span>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No rows for this report" detail={search ? `No matches for "${search}". Try clearing the search.` : 'No matching application data is available for the selected filters.'} />}
      </section>
      <section className="analysis-grid">
        <Panel title="Lifecycle Funnel" subtitle="Stage stock with rupee exposure.">
          <div className="dash-funnel">
            {analytics.stages.map((stage) => (
              <HBarRow
                key={stage.label}
                label={stage.label}
                value={stage.count}
                max={stageMax}
                detail={`${stage.share} · ${formatMoney(stage.exposure)}`}
                color="var(--green-2)"
              />
            ))}
          </div>
        </Panel>
        <Panel title="DPD Buckets" subtitle="Where the book sits today.">
          <DonutChart
            slices={dpdSlices}
            centerValue={analytics.overdue.length}
            centerLabel="overdue"
          />
        </Panel>
      </section>
      <section className="analysis-grid">
        <Panel title="Source Mix" subtitle="Channel contribution to pipeline.">
          <DonutChart
            slices={sourceSlices}
            centerValue={analytics.total}
            centerLabel="apps"
          />
        </Panel>
        <Panel title="Ticket Size Mix" subtitle="Loan amount concentration.">
          <div className="dash-funnel">
            {analytics.ticketRows.map((row) => (
              <HBarRow key={row.label} label={row.label} value={row.count} max={ticketMax} detail={row.share} color="var(--cyan)" />
            ))}
          </div>
        </Panel>
      </section>
      <section className="two-column">
        <Panel title="Executive MIS Snapshot" subtitle="Board-ready economics and health ratios.">
          <div className="report-table dense-table">
            <div><span>Gross requested demand</span><strong>{formatMoney(analytics.totalRequested)}</strong><small>{analytics.total} applications</small></div>
            <div><span>Booked disbursement value</span><strong>{formatMoney(analytics.totalBooked)}</strong><small>{analytics.conversion} count conversion</small></div>
            <div><span>Active book outstanding</span><strong>{formatMoney(analytics.outstanding)}</strong><small>{analytics.active.length} live accounts</small></div>
            <div><span>Portfolio at risk</span><strong>{formatMoney(analytics.overdueExposure)}</strong><small>{analytics.portfolioAtRisk} of outstanding</small></div>
            <div><span>Average credit score</span><strong>{analytics.avgScore ? Math.round(analytics.avgScore) : '-'}</strong><small>Policy minimum {rules.minBureauScore}</small></div>
            <div><span>Average FOIR</span><strong>{(analytics.avgFoir * 100).toFixed(1)}%</strong><small>Policy cap {(rules.foirThreshold * 100).toFixed(0)}%</small></div>
          </div>
        </Panel>
        <Panel title="Exception Register" subtitle="Control breaches and pending operating actions.">
          <div className="report-table dense-table">
            {analytics.exceptionRows.map((row) => (
              <div key={row.label}><span>{row.label}</span><strong>{row.count}</strong><Status value={row.severity} /><small>{row.detail}</small></div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="two-column">
        <Panel title="Lead Funnel Report" subtitle="Stage stock, share, and value at each lifecycle point.">
          {analytics.stages.length ? (
            <div className="report-table">
              {analytics.stages.map((stage) => (
                <div key={stage.label}><span>{stage.label}</span><strong>{stage.count} apps</strong><small>{stage.share} · {formatMoney(stage.exposure)}</small></div>
              ))}
            </div>
          ) : (
            <EmptyState title="No lifecycle data" detail="Stage stock will populate once leads enter the pipeline." />
          )}
        </Panel>
        <Panel title="Risk Stratification Report" subtitle="Risk labels crossed with exposure and NPA cases.">
          {analytics.riskRows.length ? (
            <div className="report-table">
              {analytics.riskRows.map((row) => (
                <div key={row.label}><span>{row.label}</span><strong>{row.count} apps</strong><small>{formatMoney(row.exposure)} · {row.npa} NPA</small></div>
              ))}
            </div>
          ) : (
            <EmptyState title="No risk data" detail="Risk labels will populate once credit reviews are completed." />
          )}
        </Panel>
      </section>
      <section className="two-column">
        <Panel title="DSA Performance Scorecard" subtitle="Sourcing depth, conversion, ticket size, and delinquency.">
          {analytics.dsaRows.length ? (
            <div className="report-table dense-table">
              {analytics.dsaRows.map((row) => (
                <div key={row.id}>
                  <span>{row.label}</span>
                  <strong>{row.count} apps · {row.conversion}</strong>
                  <small>{formatMoney(row.booked)} booked · {formatMoney(row.avgTicket)} avg · {row.npa} NPA</small>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No DSA activity yet" detail="Sourcing data will appear once DSAs start logging applications." />
          )}
        </Panel>
        <Panel title="Collections Aging Report" subtitle="Outstanding split by DPD bucket.">
          {analytics.dpdRows.length ? (
            <div className="report-table">
              {analytics.dpdRows.map((row) => (
                <div key={row.label}><span>{row.label}</span><strong>{row.count} apps</strong><small>{formatMoney(row.outstanding)} · {row.share}</small></div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active book" detail="Aging buckets will populate once loans are disbursed." />
          )}
        </Panel>
      </section>
      <section className="two-column">
        <Panel title="Channel And Tenure Mix" subtitle="Where demand comes from and repayment shape.">
          {(analytics.sourceRows.length || analytics.tenureRows.length) ? (
            <div className="split-report">
              <div className="report-table">
                {analytics.sourceRows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.count}</strong><small>{row.share}</small></div>)}
              </div>
              <div className="report-table">
                {analytics.tenureRows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.count}</strong><small>{row.share}</small></div>)}
              </div>
            </div>
          ) : (
            <EmptyState title="No channel data" detail="Source and tenure mix will populate once leads are captured." />
          )}
        </Panel>
        <Panel title="Ticket Size Concentration" subtitle="Application volume by requested loan amount band.">
          {analytics.ticketRows.length ? (
            <div className="report-table">
              {analytics.ticketRows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.count}</strong><small>{row.share}</small></div>)}
            </div>
          ) : (
            <EmptyState title="No ticket data" detail="Amount bands will populate once applications are filed." />
          )}
        </Panel>
      </section>
    </div>
  );
}

function TargetsPage({ allApps, dsas, agents, targets, setTargets }) {
  const monthKey = today().slice(0, 7);
  const monthApps = allApps.filter((app) => String(app.createdAt || '').slice(0, 7) === monthKey);
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const dsaMap = new Map(dsas.map((dsa) => [dsa.id, dsa]));

  function targetFor(type, id) {
    return { ...DEFAULT_TARGET, ...(targets[`${type}:${id}`] || {}) };
  }

  function updateTarget(type, id, key, value) {
    const cacheKey = `${type}:${id}`;
    setTargets((current) => ({
      ...current,
      [cacheKey]: {
        ...targetFor(type, id),
        [key]: Math.max(0, Number(value || 0)),
      },
    }));
  }

  function buildRow(type, entity) {
    const rows = monthApps.filter((app) => type === 'dsa' ? app.dsaId === entity.id : app.agentId === entity.id);
    const disbursed = rows.filter((app) => app.disbursement?.status === 'Released');
    const bookedAmount = disbursed.reduce((sum, app) => sum + Number(app.amount || 0), 0);
    return {
      type,
      entity,
      rows,
      disbursed,
      bookedAmount,
      target: targetFor(type, entity.id),
    };
  }

  const dsaRows = dsas.map((dsa) => buildRow('dsa', dsa));
  const agentRows = agents.map((agent) => buildRow('agent', agent));
  const totalLeadTarget = [...dsaRows, ...agentRows].reduce((sum, row) => sum + row.target.leadTarget, 0);
  const totalAmountTarget = [...dsaRows, ...agentRows].reduce((sum, row) => sum + row.target.amountTarget, 0);
  const totalBooked = [...dsaRows, ...agentRows].reduce((sum, row) => sum + row.bookedAmount, 0);

  return (
    <div className="dashboard-layout">
      <section className="hero-panel">
        <div>
          <h1>Targets</h1>
          <p>Monthly DSA and agent targets with live lead, disbursement, and booking progress for {monthLabel}.</p>
        </div>
        <div className="rule-strip">
          <strong>{monthApps.length}</strong><span>Month leads</span>
          <strong>{pct(monthApps.length, totalLeadTarget)}</strong><span>Lead target</span>
          <strong>{pct(totalBooked, totalAmountTarget)}</strong><span>Amount target</span>
        </div>
      </section>

      <section className="target-page-grid">
        <TargetGroup title="DSA Targets" rows={dsaRows} onChange={updateTarget} />
        <TargetGroup title="Agent Targets" rows={agentRows} dsaMap={dsaMap} onChange={updateTarget} />
      </section>
    </div>
  );
}

function TargetGroup({ title, rows, dsaMap, onChange }) {
  return (
    <Panel title={title} subtitle="Set targets and compare current-month achievement.">
      <div className="target-list">
        {rows.length ? rows.map((row) => (
          <TargetCard key={`${row.type}-${row.entity.id}`} row={row} dsaMap={dsaMap} onChange={onChange} />
        )) : <EmptyState title="No records found" detail="Add DSA and agent records from Master Data or DSA Network." />}
      </div>
    </Panel>
  );
}

function TargetCard({ row, dsaMap, onChange }) {
  const label = row.type === 'dsa' ? dsaDisplayName(row.entity) : (row.entity.name || row.entity.id);
  const owner = row.type === 'dsa'
    ? [row.entity.owner, row.entity.city].filter(Boolean).join(' · ')
    : [dsaMap?.get(row.entity.dsaId) ? dsaDisplayName(dsaMap.get(row.entity.dsaId)) : '', row.entity.mobile].filter(Boolean).join(' · ');
  const leadProgress = Math.min(100, Math.round((row.rows.length / Math.max(1, row.target.leadTarget)) * 100));
  const disbursementProgress = Math.min(100, Math.round((row.disbursed.length / Math.max(1, row.target.disbursementTarget)) * 100));
  const amountProgress = Math.min(100, Math.round((row.bookedAmount / Math.max(1, row.target.amountTarget)) * 100));

  return (
    <article className="target-card">
      <div className="target-card-head">
        <div>
          <strong>{label}</strong>
          <span>{owner || 'No hierarchy mapped'}</span>
        </div>
        <Status value={row.entity.status || 'Active'} />
      </div>
      <div className="target-input-grid">
        <Field label="Lead target">
          <input type="number" min="0" value={row.target.leadTarget} onChange={(event) => onChange(row.type, row.entity.id, 'leadTarget', event.target.value)} />
        </Field>
        <Field label="Disbursal target">
          <input type="number" min="0" value={row.target.disbursementTarget} onChange={(event) => onChange(row.type, row.entity.id, 'disbursementTarget', event.target.value)} />
        </Field>
        <Field label="Amount target">
          <input type="number" min="0" step="1000" value={row.target.amountTarget} onChange={(event) => onChange(row.type, row.entity.id, 'amountTarget', event.target.value)} />
        </Field>
      </div>
      <div className="target-progress-grid">
        <TargetProgress label="Leads" value={row.rows.length} target={row.target.leadTarget} progress={leadProgress} />
        <TargetProgress label="Disbursed" value={row.disbursed.length} target={row.target.disbursementTarget} progress={disbursementProgress} />
        <TargetProgress label="Booked" value={formatMoney(row.bookedAmount)} target={formatMoney(row.target.amountTarget)} progress={amountProgress} />
      </div>
    </article>
  );
}

function TargetProgress({ label, value, target, progress }) {
  return (
    <div className="target-progress">
      <div>
        <span>{label}</span>
        <strong>{value} / {target}</strong>
      </div>
      <i><b style={{ width: `${progress}%` }} /></i>
      <small>{progress}% achieved</small>
    </div>
  );
}

const dsaInitialForm = {
  firmName: '',
  nickname: '',
  owner: '',
  city: '',
  state: '',
  commissionRate: 1,
  gstin: '',
  gstLegalName: '',
  chequeNo: '',
  bankName: '',
  remarks: '',
  dsaPhoto: null,
  panImage: null,
  aadhaarImage: null,
  chequeImage: null,
  additionalDocs: [],
};

function DsaPage({ dsas, setDsas, deleteDsa, allApps }) {
  const [form, setForm] = useState(dsaInitialForm);
  const [uploading, setUploading] = useState({
    dsaPhoto: false,
    panImage: false,
    aadhaarImage: false,
    chequeImage: false,
    additionalDocs: false,
  });
  const [uploadError, setUploadError] = useState('');

  async function uploadSingleCompressedImage(event, key, label) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setUploadError('');
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      setUploadError(`${label} must be an image file.`);
      return;
    }
    setUploading((current) => ({ ...current, [key]: true }));
    try {
      const compressed = await compressImageToLimit(file, 150 * 1024);
      if (compressed.size > 150 * 1024) {
        throw new Error(`"${file.name}" could not be compressed below 150 KB.`);
      }
      setForm((current) => ({ ...current, [key]: compressed }));
    } catch (error) {
      setUploadError(error.message || `Unable to upload ${label.toLowerCase()}.`);
    } finally {
      setUploading((current) => ({ ...current, [key]: false }));
    }
  }

  async function uploadAdditionalDocuments(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    setUploadError('');
    if (!selectedFiles.length) return;
    if (selectedFiles.some((file) => !String(file.type || '').startsWith('image/'))) {
      setUploadError('Additional documents must be image files.');
      return;
    }

    const availableSlots = 10 - form.additionalDocs.length;
    if (availableSlots <= 0) {
      setUploadError('Maximum 10 additional documents are allowed.');
      return;
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);
    if (filesToProcess.length < selectedFiles.length) {
      setUploadError('Only first 10 additional documents are allowed.');
    }

    setUploading((current) => ({ ...current, additionalDocs: true }));
    try {
      const compressedDocs = await Promise.all(
        filesToProcess.map(async (file) => {
          const compressed = await compressImageToLimit(file, 150 * 1024);
          if (compressed.size > 150 * 1024) {
            throw new Error(`"${file.name}" could not be compressed below 150 KB.`);
          }
          return compressed;
        }),
      );

      setForm((current) => ({
        ...current,
        additionalDocs: [...current.additionalDocs, ...compressedDocs].slice(0, 10),
      }));
    } catch (error) {
      setUploadError(error.message || 'Unable to upload additional documents.');
    } finally {
      setUploading((current) => ({ ...current, additionalDocs: false }));
    }
  }

  function removeUploadedFile(key, indexToRemove = -1) {
    setUploadError('');
    setForm((current) => {
      if (key === 'additionalDocs') {
        return {
          ...current,
          additionalDocs: current.additionalDocs.filter((_, index) => index !== indexToRemove),
        };
      }
      return { ...current, [key]: null };
    });
  }

  return (
    <div className="page-grid">
      <Panel title="DSA Account Management" subtitle="Onboarding, approval, hierarchy, territory, commission, suspension, and performance.">
        <form className="form-grid compact-form" onSubmit={(event) => {
          event.preventDefault();
          const city = form.city || 'New Zone';
          setDsas((current) => [{ id: newEntityUuid(), ...form, city, state: form.state || 'New State', status: 'Under Review', leads: 0 }, ...current]);
          setForm(dsaInitialForm);
          setUploadError('');
        }}>
          <Field label="Firm name"><input required value={form.firmName} onChange={(event) => setForm({ ...form, firmName: event.target.value })} /></Field>
          <Field label="Nickname"><input value={form.nickname} placeholder="Short display name" onChange={(event) => setForm({ ...form, nickname: event.target.value })} /></Field>
          <Field label="Owner"><input required value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} /></Field>
          <Field label="City"><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
          <Field label="State"><input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></Field>
          <Field label="Commission %"><input value={form.commissionRate} inputMode="decimal" onChange={(event) => setForm({ ...form, commissionRate: event.target.value })} /></Field>
          <Field label="GSTIN"><input value={form.gstin} onChange={(event) => setForm({ ...form, gstin: event.target.value.toUpperCase() })} /></Field>
          <Field label="GST legal name"><input value={form.gstLegalName} onChange={(event) => setForm({ ...form, gstLegalName: event.target.value })} /></Field>
          <Field label="Cheque no">
            <input
              value={form.chequeNo}
              inputMode="numeric"
              onChange={(event) => setForm({ ...form, chequeNo: event.target.value.replace(/\D/g, '').slice(0, 12) })}
            />
          </Field>
          <Field label="Bank name"><input value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} /></Field>
          <Field label="DSA photo upload">
            <div className="bill-upload-box">
              <input type="file" accept="image/*" onChange={(event) => uploadSingleCompressedImage(event, 'dsaPhoto', 'DSA photo')} disabled={uploading.dsaPhoto} />
              <small className="file-upload-hint">Image auto-compressed to max 150 KB.</small>
              {uploading.dsaPhoto && <small className="file-upload-hint">Compressing image...</small>}
              {form.dsaPhoto && (
                <div className="bill-preview-list">
                  <div className="bill-preview-item">
                    <img src={form.dsaPhoto.dataUrl} alt="DSA" />
                    <span>{form.dsaPhoto.name} ({Math.max(1, Math.round(form.dsaPhoto.size / 1024))} KB)</span>
                    <button type="button" onClick={() => removeUploadedFile('dsaPhoto')}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          </Field>
          <Field label="PAN image upload">
            <div className="bill-upload-box">
              <input type="file" accept="image/*" onChange={(event) => uploadSingleCompressedImage(event, 'panImage', 'PAN image')} disabled={uploading.panImage} />
              <small className="file-upload-hint">Image auto-compressed to max 150 KB.</small>
              {uploading.panImage && <small className="file-upload-hint">Compressing image...</small>}
              {form.panImage && (
                <div className="bill-preview-list">
                  <div className="bill-preview-item">
                    <img src={form.panImage.dataUrl} alt="PAN" />
                    <span>{form.panImage.name} ({Math.max(1, Math.round(form.panImage.size / 1024))} KB)</span>
                    <button type="button" onClick={() => removeUploadedFile('panImage')}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          </Field>
          <Field label="Aadhaar image upload">
            <div className="bill-upload-box">
              <input type="file" accept="image/*" onChange={(event) => uploadSingleCompressedImage(event, 'aadhaarImage', 'Aadhaar image')} disabled={uploading.aadhaarImage} />
              <small className="file-upload-hint">Image auto-compressed to max 150 KB.</small>
              {uploading.aadhaarImage && <small className="file-upload-hint">Compressing image...</small>}
              {form.aadhaarImage && (
                <div className="bill-preview-list">
                  <div className="bill-preview-item">
                    <img src={form.aadhaarImage.dataUrl} alt="Aadhaar" />
                    <span>{form.aadhaarImage.name} ({Math.max(1, Math.round(form.aadhaarImage.size / 1024))} KB)</span>
                    <button type="button" onClick={() => removeUploadedFile('aadhaarImage')}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          </Field>
          <Field label="Cheque image upload">
            <div className="bill-upload-box">
              <input type="file" accept="image/*" onChange={(event) => uploadSingleCompressedImage(event, 'chequeImage', 'Cheque image')} disabled={uploading.chequeImage} />
              <small className="file-upload-hint">Image auto-compressed to max 150 KB.</small>
              {uploading.chequeImage && <small className="file-upload-hint">Compressing image...</small>}
              {form.chequeImage && (
                <div className="bill-preview-list">
                  <div className="bill-preview-item">
                    <img src={form.chequeImage.dataUrl} alt="Cheque" />
                    <span>{form.chequeImage.name} ({Math.max(1, Math.round(form.chequeImage.size / 1024))} KB)</span>
                    <button type="button" onClick={() => removeUploadedFile('chequeImage')}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          </Field>
          <Field label="Additional documents upload (max 10)">
            <div className="bill-upload-box">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={uploadAdditionalDocuments}
                disabled={uploading.additionalDocs || form.additionalDocs.length >= 10}
              />
              <small className="file-upload-hint">Images are auto-compressed to max 150 KB each.</small>
              {uploading.additionalDocs && <small className="file-upload-hint">Compressing documents...</small>}
              {!!form.additionalDocs.length && (
                <div className="bill-preview-list">
                  {form.additionalDocs.map((file, index) => (
                    <div className="bill-preview-item" key={`${file.name}-${index}`}>
                      <img src={file.dataUrl} alt={`Additional document ${index + 1}`} />
                      <span>{file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)</span>
                      <button type="button" onClick={() => removeUploadedFile('additionalDocs', index)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field className="field-span-3" label="Remarks">
            <textarea
              rows={3}
              value={form.remarks}
              placeholder="Write onboarding remarks, verification notes, or special instructions."
              onChange={(event) => setForm({ ...form, remarks: event.target.value })}
            />
          </Field>
          {uploadError && <p className="error-text field-span-3">{uploadError}</p>}
          <button className="primary-action" type="submit"><Plus size={17} /> Register DSA</button>
        </form>
      </Panel>
      <Panel title="Network Performance" subtitle="DSA conversion, disbursements, and NPA rate.">
        <div className="dsa-grid">
          {dsas.map((dsa) => {
            const sourced = allApps.filter((app) => app.dsaId === dsa.id);
            return (
              <div className="dsa-card" key={dsa.id}>
                <strong>{dsaDisplayName(dsa)}</strong>
                {dsa.nickname && dsa.firmName && dsa.nickname.trim() && dsa.nickname.trim() !== dsa.firmName && (
                  <small>{dsa.firmName}</small>
                )}
                <span>{dsa.owner} · {dsa.city}, {dsa.state}</span>
                <Status value={dsa.status} />
                <p>{sourced.length} applications · {sourced.filter((app) => app.disbursement.status === 'Released').length} disbursed</p>
                <button
                  type="button"
                  className="secondary-action compact"
                  onClick={() => {
                    if (sourced.length) {
                      const ok = window.confirm(`${dsaDisplayName(dsa)} has ${sourced.length} linked applications. Delete anyway?`);
                      if (!ok) return;
                    } else if (!window.confirm(`Delete DSA "${dsaDisplayName(dsa)}"? This cannot be undone.`)) {
                      return;
                    }
                    deleteDsa?.(dsa);
                  }}
                >
                  <X size={14} /> Delete DSA
                </button>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function LegalPageByRoute({ route }) {
  if (route === 'terms-and-conditions') return <TermsConditionsPage />;
  if (route === 'cancellation-policy') return <CancellationPolicyPage />;
  return <ContactUsPage />;
}

function ContactUsPage() {
  const contactRows = [
    ['Merchant Legal entity name', merchantContact.legalName],
    ['Registered Address', merchantContact.registeredAddress],
    ['Operational Address', merchantContact.operationalAddress],
    ['Telephone No', merchantContact.telephone],
    ['E-Mail ID', merchantContact.email],
  ];

  return (
    <div className="legal-layout">
      <section className="hero-panel legal-hero">
        <div>
          <h1>Contact Us</h1>
          <p>Last updated on {merchantContact.lastUpdated}</p>
        </div>
        <div className="legal-contact-actions">
          <a className="secondary-action" href={`tel:${merchantContact.telephone}`}><Phone size={16} /> Call</a>
          <a className="secondary-action" href={`mailto:${merchantContact.email}`}><MessageSquareText size={16} /> Email</a>
        </div>
      </section>

      <Panel title="Contact Information" subtitle="You may contact us using the information below.">
        <div className="legal-info-grid">
          {contactRows.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function TermsConditionsPage() {
  return (
    <div className="legal-layout">
      <section className="hero-panel legal-hero">
        <div>
          <h1>Terms & Conditions</h1>
          <p>Last updated on {termsLastUpdated}</p>
        </div>
      </section>
      <Panel title="Terms & Conditions" subtitle={`Last updated on ${termsLastUpdated}`}>
        <div className="legal-copy">
          {termsIntro.map((item) => <p key={item}>{item}</p>)}
          <ol>
            {termsItems.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </div>
      </Panel>
    </div>
  );
}

function CancellationPolicyPage() {
  return (
    <div className="legal-layout">
      <section className="hero-panel legal-hero">
        <div>
          <h1>Cancellation Policy</h1>
          <p>Last updated on {cancellationLastUpdated}</p>
        </div>
      </section>
      <Panel title="Cancellation Policy" subtitle="Cancellation and refund terms.">
        <div className="refund-note">
          <ReceiptIndianRupee size={18} />
          <strong>No cancellation or refund policy is offered.</strong>
        </div>
      </Panel>
    </div>
  );
}

function nextEntityId(prefix, current) {
  const used = new Set(current.map((item) => item.id));
  let next = current.length + 1;
  let id = `${prefix}-${String(next).padStart(3, '0')}`;
  while (used.has(id)) {
    next += 1;
    id = `${prefix}-${String(next).padStart(3, '0')}`;
  }
  return id;
}

function UserManagementPage({ session, dropdownOptions, roleOptions, setEmailPolicies, rules, roleAccessMatrix, setRoleAccessMatrix, dsas, agents, setDsas, setAgents, updateDropdownList }) {
  const isSuperAdmin = session.role === 'SUPER_ADMIN';
  const policies = dropdownOptions.userAccessPolicies || dropdownOptions.emailPolicies || [];

  if (!isSuperAdmin) {
    return (
      <Panel title="User Management" subtitle="Only SUPER_ADMIN can manage users and access.">
        <div className="warning-box"><AlertTriangle size={17} /> Switch to SUPER_ADMIN to manage user roles and lending access.</div>
      </Panel>
    );
  }

  return (
    <div className="dashboard-layout">
      <section className="hero-panel">
        <div>
          <h1>User Management</h1>
          <p>Assign app roles, module access, and lending limits by user email.</p>
        </div>
        <div className="rule-strip">
          <strong>{dropdownOptions.userEmails.length}</strong><span>Users</span>
          <strong>{policies.length}</strong><span>Policies</span>
          <strong>{roleOptions.length}</strong><span>Roles</span>
        </div>
      </section>

      <section className="master-grid">
        <TeamAccessConsole
          dsas={dsas || []}
          agents={agents || []}
          setDsas={setDsas}
          setAgents={setAgents}
          userEmails={dropdownOptions.userEmails || []}
          updateUserEmails={(next) => updateDropdownList && updateDropdownList('userEmails', next)}
          values={policies}
          onChange={setEmailPolicies}
          availableEmails={dropdownOptions.userEmails || []}
          loanAmounts={dropdownOptions.loanAmounts || []}
          tenures={rules.tenures || []}
          companyMakes={dropdownOptions.companyMakes || []}
          batteryModels={dropdownOptions.batteryModels || []}
          roleOptions={roleOptions}
        />
        <RoleAccessMatrixPanel roleOptions={roleOptions} accessMatrix={roleAccessMatrix} onChange={setRoleAccessMatrix} />
      </section>
    </div>
  );
}

function RoleAccessMatrixPanel({ roleOptions, accessMatrix, onChange }) {
  const modules = menu.map(([label]) => label);

  function updateRoleModule(role, module, checked) {
    const currentModules = accessMatrix[role] || [];
    const nextModules = checked
      ? Array.from(new Set([...currentModules, module]))
      : currentModules.filter((item) => item !== module);
    onChange({ ...accessMatrix, [role]: nextModules });
  }

  return (
    <Panel title="Role Access" subtitle="Customize navigation and page access for each role.">
      <div className="role-access-table">
        <div className="role-access-head">
          <span>Role</span>
          <span>Accessible modules</span>
        </div>
        {roleOptions.map((role) => (
          <div className="role-access-row" key={role}>
            <strong>{role}</strong>
            <MultiOptionList
              values={modules}
              selectedValues={accessMatrix[role] || []}
              onChange={(module, checked) => updateRoleModule(role, module, checked)}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TeamAccessConsole({
  dsas,
  agents,
  setDsas,
  setAgents,
  userEmails,
  updateUserEmails,
  values,
  onChange,
  availableEmails,
  loanAmounts,
  tenures,
  companyMakes,
  batteryModels,
  roleOptions,
}) {
  const [tab, setTab] = useState('configure');
  const [search, setSearch] = useState('');

  // --- Create login state ---
  const [createForm, setCreateForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'dsa',
    dsaId: '',
    agentId: '',
  });
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);

  const filteredCreateAgents = createForm.dsaId
    ? agents.filter((agent) => agent.dsaId === createForm.dsaId)
    : agents;

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 12; i += 1) out += chars.charAt(Math.floor(Math.random() * chars.length));
    setCreateForm((current) => ({ ...current, password: out }));
  }

  async function submitCreate(event) {
    event.preventDefault();
    setCreateMessage(null);
    if (!isSupabaseConfigured || !supabase) {
      setCreateMessage({ kind: 'error', text: 'Supabase is not configured.' });
      return;
    }
    if (createForm.role === 'agent' && !createForm.dsaId) {
      setCreateMessage({ kind: 'error', text: 'Pick a DSA for an Agent user.' });
      return;
    }
    if (createForm.password.length < 8) {
      setCreateMessage({ kind: 'error', text: 'Temp password must be at least 8 characters.' });
      return;
    }
    const normalizedEmail = createForm.email.trim().toLowerCase();
    const trimmedName = createForm.fullName.trim();
    let nextDsaId = createForm.role === 'dsa' ? newEntityUuid() : '';
    let nextAgentId = '';
    if (createForm.role === 'agent') {
      nextDsaId = createForm.dsaId;
      nextAgentId = newEntityUuid();
    }
    setCreateBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-team-user', {
        body: {
          email: normalizedEmail,
          fullName: trimmedName,
          password: createForm.password,
          role: createForm.role,
          dsaId: createForm.role === 'dsa' ? nextDsaId : null,
          agentId: createForm.role === 'agent' ? nextAgentId : null,
        },
      });
      if (error) throw new Error(error.message || 'Request failed');
      if (!data?.ok) throw new Error(data?.message || 'Request failed');
      if (createForm.role === 'dsa' && setDsas) {
        setDsas([
          ...dsas,
          {
            id: nextDsaId,
            firmName: trimmedName || normalizedEmail,
            owner: trimmedName,
            email: normalizedEmail,
            city: '',
            state: 'New State',
            commissionRate: 1,
            status: 'Under Review',
            leads: 0,
          },
        ]);
      } else if (createForm.role === 'agent' && setAgents && nextAgentId) {
        setAgents([
          ...agents,
          {
            id: nextAgentId,
            name: trimmedName || normalizedEmail,
            email: normalizedEmail,
            dsaId: nextDsaId,
            status: 'Active',
          },
        ]);
      }
      if (updateUserEmails) {
        updateUserEmails(Array.from(new Set([...(userEmails || []), normalizedEmail])));
      }
      setCreateMessage({
        kind: 'success',
        text: `Created ${data.email}. Share login: ${data.email} / ${createForm.password}`,
      });
      setCreateForm({ email: '', fullName: '', password: '', role: createForm.role, dsaId: '', agentId: '' });
    } catch (err) {
      setCreateMessage({ kind: 'error', text: err?.message || 'Failed to create user' });
    } finally {
      setCreateBusy(false);
    }
  }

  // --- Configure access state ---
  const interestOptions = useMemo(() => {
    const list = [];
    for (let percent = Math.round(MIN_LOAN_INTEREST_RATE * 100); percent <= Math.round(MAX_LOAN_INTEREST_RATE * 100); percent += 1) {
      list.push(percent);
    }
    return list;
  }, []);

  const [draft, setDraft] = useState({
    email: '',
    role: roleOptions.includes('DSA') ? 'DSA' : roleOptions[0] || '',
    loanAmounts: [],
    tenures: [],
    minInterestRate: '',
    maxInterestRate: '',
    companyMakes: [],
    batteryModels: [],
    dsaId: '',
    agentId: '',
  });

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      role: roleOptions.includes(current.role) ? current.role : (roleOptions.includes('DSA') ? 'DSA' : roleOptions[0] || ''),
    }));
  }, [roleOptions]);

  function resetDraft() {
    setDraft({
      email: '',
      role: roleOptions.includes('DSA') ? 'DSA' : roleOptions[0] || '',
      loanAmounts: [],
      tenures: [],
      minInterestRate: '',
      maxInterestRate: '',
      companyMakes: [],
      batteryModels: [],
      dsaId: '',
      agentId: '',
    });
  }

  function addPolicy(event) {
    event.preventDefault();
    const email = normalizePolicyEmail(draft.email);
    if (!email) return;
    const nextPolicy = sanitizeUserAccessPolicy({
      email,
      role: draft.role,
      loanAmounts: draft.loanAmounts,
      tenures: draft.tenures,
      minInterestRate: Number.isFinite(Number(draft.minInterestRate)) ? Number(draft.minInterestRate) / 100 : null,
      maxInterestRate: Number.isFinite(Number(draft.maxInterestRate)) ? Number(draft.maxInterestRate) / 100 : null,
      companyMakes: draft.companyMakes,
      batteryModels: draft.batteryModels,
      dsaId: draft.dsaId,
      agentId: draft.agentId,
    });
    if (!nextPolicy) return;
    const existingIndex = values.findIndex((value) => normalizePolicyEmail(value.email) === email);
    if (existingIndex >= 0) {
      const nextValues = [...values];
      nextValues[existingIndex] = nextPolicy;
      onChange(nextValues);
    } else {
      onChange([...values, nextPolicy]);
    }
    resetDraft();
  }

  function loadPolicy(policy) {
    setTab('configure');
    setDraft({
      email: policy.email,
      role: policy.role || (roleOptions.includes('DSA') ? 'DSA' : roleOptions[0] || ''),
      loanAmounts: (policy.loanAmounts || []).map(String),
      tenures: (policy.tenures || []).map(String),
      minInterestRate: Number.isFinite(policy.minInterestRate) ? String(Math.round(policy.minInterestRate * 100)) : '',
      maxInterestRate: Number.isFinite(policy.maxInterestRate) ? String(Math.round(policy.maxInterestRate * 100)) : '',
      companyMakes: policy.companyMakes || [],
      batteryModels: policy.batteryModels || [],
      dsaId: policy.dsaId || '',
      agentId: policy.agentId || '',
    });
  }

  function removePolicy(email) {
    onChange(values.filter((value) => value.email !== email));
  }

  function updateMultiValue(field, value, checked) {
    setDraft((current) => ({
      ...current,
      [field]: checked
        ? Array.from(new Set([...current[field], value]))
        : current[field].filter((item) => item !== value),
    }));
  }

  const filteredPolicies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return values;
    return values.filter((policy) => (policy.email || '').toLowerCase().includes(q));
  }, [values, search]);

  return (
    <Panel
      title="Team Access Console"
      subtitle="Create team logins and configure each user's role, lending limits, inventory and DSA/agent scope from one place."
    >
      <div className="team-console-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'configure'}
          className={`team-console-tab ${tab === 'configure' ? 'is-active' : ''}`}
          onClick={() => setTab('configure')}
        >
          <ShieldCheck size={16} />
          <span>Role &amp; Lending Access</span>
          <em>{values.length}</em>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'create'}
          className={`team-console-tab ${tab === 'create' ? 'is-active' : ''}`}
          onClick={() => setTab('create')}
        >
          <Users size={16} />
          <span>Create Team Login</span>
        </button>
      </div>

      {tab === 'create' && (
        <div className="team-console-pane">
          <form className="form-grid compact-form team-console-form" onSubmit={submitCreate}>
            <div className="team-console-section">
              <div className="team-console-section-head">
                <h4>Identity</h4>
                <p>Login email, display name and temporary credentials.</p>
              </div>
              <div className="team-console-section-body">
                <Field label="Email">
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
                    placeholder="user@example.com"
                  />
                </Field>
                <Field label="Full name">
                  <input
                    type="text"
                    value={createForm.fullName}
                    onChange={(event) => setCreateForm({ ...createForm, fullName: event.target.value })}
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Temporary password">
                  <div className="team-console-password">
                    <input
                      type="text"
                      required
                      minLength={8}
                      value={createForm.password}
                      onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
                      placeholder="Min 8 characters"
                    />
                    <button type="button" className="ghost-action" onClick={generatePassword}>Generate</button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="team-console-section">
              <div className="team-console-section-head">
                <h4>Scope</h4>
                <p>Pick the role and link the user to a DSA.</p>
              </div>
              <div className="team-console-section-body">
                <Field label="Role">
                  <select
                    value={createForm.role}
                    onChange={(event) => setCreateForm({ ...createForm, role: event.target.value, dsaId: '', agentId: '' })}
                  >
                    <option value="dsa">DSA</option>
                    <option value="agent">Agent</option>
                  </select>
                </Field>
                {createForm.role === 'agent' && (
                  <Field label="Assign DSA">
                    <select
                      required
                      value={createForm.dsaId}
                      onChange={(event) => setCreateForm({ ...createForm, dsaId: event.target.value, agentId: '' })}
                    >
                      <option value="">Select DSA</option>
                      {dsas.map((dsa) => <option key={dsa.id} value={dsa.id}>{dsaDisplayName(dsa) || dsa.id}</option>)}
                    </select>
                  </Field>
                )}
              </div>
            </div>

            <div className="form-actions team-console-actions">
              <button className="primary-action compact" type="submit" disabled={createBusy}>
                <Plus size={16} /> {createBusy ? 'Creating...' : 'Create login'}
              </button>
            </div>
          </form>
          {createMessage && (
            <div className={createMessage.kind === 'success' ? 'success-box' : 'warning-box'} role="status" style={{ marginTop: 12 }}>
              {createMessage.kind === 'success' ? null : <AlertTriangle size={17} />} {createMessage.text}
            </div>
          )}
        </div>
      )}

      {tab === 'configure' && (
        <div className="team-console-pane">
          <form className="form-grid compact-form team-console-form" onSubmit={addPolicy}>
            <div className="team-console-section">
              <div className="team-console-section-head">
                <h4>User &amp; Role</h4>
                <p>Pick which user to configure and what role they hold.</p>
              </div>
              <div className="team-console-section-body">
                <Field label="Email">
                  <select
                    required
                    value={draft.email}
                    onChange={(event) => {
                      const email = event.target.value;
                      const normalized = email.trim().toLowerCase();
                      const existingPolicy = values.find((policy) => normalizePolicyEmail(policy.email) === normalized);
                      if (existingPolicy) {
                        loadPolicy(existingPolicy);
                        return;
                      }
                      const matchedAgent = agents.find((agent) => (agent.email || '').toLowerCase() === normalized);
                      const matchedDsa = dsas.find((dsa) => (dsa.email || '').toLowerCase() === normalized);
                      if (matchedAgent) {
                        const agentRole = roleOptions.includes('AGENT') ? 'AGENT' : draft.role;
                        setDraft({
                          ...draft,
                          email,
                          role: agentRole,
                          dsaId: matchedAgent.dsaId || '',
                          agentId: matchedAgent.id,
                        });
                      } else if (matchedDsa) {
                        const dsaRole = roleOptions.includes('DSA') ? 'DSA' : draft.role;
                        setDraft({
                          ...draft,
                          email,
                          role: dsaRole,
                          dsaId: matchedDsa.id,
                          agentId: '',
                        });
                      } else {
                        setDraft({ ...draft, email });
                      }
                    }}
                  >
                    <option value="">Select email</option>
                    {availableEmails.map((email) => <option key={email} value={email}>{email}</option>)}
                  </select>
                </Field>
                <Field label="Role">
                  <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}>
                    {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </Field>
                <Field label="Assigned DSA">
                  <select
                    value={draft.dsaId}
                    onChange={(event) => {
                      const dsaId = event.target.value;
                      const agentBelongsToDsa = !draft.agentId || agents.some((agent) => agent.id === draft.agentId && agent.dsaId === dsaId);
                      setDraft({ ...draft, dsaId, agentId: agentBelongsToDsa ? draft.agentId : '' });
                    }}
                  >
                    <option value="">All DSAs</option>
                    {dsas.map((dsa) => <option key={dsa.id} value={dsa.id}>{dsa.firmName}</option>)}
                  </select>
                </Field>
                <Field label="Assigned agent">
                  <select
                    value={draft.agentId}
                    onChange={(event) => {
                      const agentId = event.target.value;
                      const agent = agents.find((item) => item.id === agentId);
                      setDraft({ ...draft, agentId, dsaId: agent?.dsaId || draft.dsaId });
                    }}
                  >
                    <option value="">All agents under DSA</option>
                    {agents
                      .filter((agent) => !draft.dsaId || agent.dsaId === draft.dsaId)
                      .map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="team-console-section">
              <div className="team-console-section-head">
                <h4>Lending Limits</h4>
                <p>Restrict the loan amounts, tenures and interest band this user can offer.</p>
              </div>
              <div className="team-console-section-body">
                <Field label="Loan amounts">
                  <MultiOptionList
                    values={loanAmounts.map((amount) => String(amount))}
                    selectedValues={draft.loanAmounts}
                    formatLabel={(amount) => formatMoney(Number(amount))}
                    onChange={(value, checked) => updateMultiValue('loanAmounts', value, checked)}
                  />
                </Field>
                <Field label="Tenures">
                  <MultiOptionList
                    values={tenures.map((tenure) => String(tenure))}
                    selectedValues={draft.tenures}
                    formatLabel={(tenure) => `${tenure} months`}
                    onChange={(value, checked) => updateMultiValue('tenures', value, checked)}
                  />
                </Field>
                <Field label="Min interest %">
                  <select value={draft.minInterestRate} onChange={(event) => setDraft({ ...draft, minInterestRate: event.target.value })}>
                    <option value="">No minimum</option>
                    {interestOptions.map((percent) => <option key={percent} value={String(percent)}>{percent}%</option>)}
                  </select>
                </Field>
                <Field label="Max interest %">
                  <select value={draft.maxInterestRate} onChange={(event) => setDraft({ ...draft, maxInterestRate: event.target.value })}>
                    <option value="">No maximum</option>
                    {interestOptions.map((percent) => <option key={percent} value={String(percent)}>{percent}%</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="team-console-section">
              <div className="team-console-section-head">
                <h4>Inventory</h4>
                <p>Limit which battery brands and models this user can sell against.</p>
              </div>
              <div className="team-console-section-body">
                <Field label="Battery brands">
                  <MultiOptionList
                    values={companyMakes}
                    selectedValues={draft.companyMakes}
                    onChange={(value, checked) => updateMultiValue('companyMakes', value, checked)}
                  />
                </Field>
                <Field label="Battery models">
                  <MultiOptionList
                    values={batteryModels}
                    selectedValues={draft.batteryModels}
                    onChange={(value, checked) => updateMultiValue('batteryModels', value, checked)}
                  />
                </Field>
              </div>
            </div>

            <div className="form-actions team-console-actions">
              <button type="button" className="ghost-action" onClick={resetDraft}>Reset</button>
              <button className="primary-action compact" type="submit">
                <Plus size={16} /> Save user policy
              </button>
            </div>
          </form>

          <div className="team-console-list-head">
            <div className="team-console-list-title">
              <ShieldCheck size={16} />
              <strong>Saved policies</strong>
              <span>{filteredPolicies.length}/{values.length}</span>
            </div>
            <label className="team-console-search">
              <Search size={14} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by email"
              />
            </label>
          </div>

          <div className="team-console-policy-list">
            {filteredPolicies.length === 0 && (
              <div className="team-console-empty">No policies match this filter.</div>
            )}
            {filteredPolicies.map((policy) => {
              const dsaName = policy.dsaId ? (dsas.find((dsa) => dsa.id === policy.dsaId)?.firmName || policy.dsaId) : null;
              const agentName = policy.agentId ? (agents.find((agent) => agent.id === policy.agentId)?.name || policy.agentId) : null;
              const interestLabel = (Number.isFinite(policy.minInterestRate) || Number.isFinite(policy.maxInterestRate))
                ? `${Number.isFinite(policy.minInterestRate) ? Math.round(policy.minInterestRate * 100) : '-'}–${Number.isFinite(policy.maxInterestRate) ? Math.round(policy.maxInterestRate * 100) : '-'}%`
                : null;
              return (
                <div className="team-console-policy" key={policy.email}>
                  <div className="team-console-policy-head">
                    <div className="team-console-policy-id">
                      <strong>{policy.email}</strong>
                      <span className="team-console-role-pill">{policy.role || '—'}</span>
                    </div>
                    <div className="team-console-policy-actions">
                      <button type="button" className="ghost-action" onClick={() => loadPolicy(policy)}>Edit</button>
                      <button type="button" className="ghost-action danger" onClick={() => removePolicy(policy.email)}>
                        <X size={14} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="team-console-chips">
                    <span className="team-console-chip">
                      <em>Amounts</em>
                      {policy.loanAmounts?.length ? policy.loanAmounts.map((a) => formatMoney(Number(a))).join(', ') : 'All'}
                    </span>
                    <span className="team-console-chip">
                      <em>Tenure</em>
                      {policy.tenures?.length ? `${policy.tenures.join(', ')} mo` : 'All'}
                    </span>
                    <span className="team-console-chip">
                      <em>Interest</em>
                      {interestLabel || 'Full range'}
                    </span>
                    <span className="team-console-chip">
                      <em>Brands</em>
                      {policy.companyMakes?.length ? policy.companyMakes.join(', ') : 'All'}
                    </span>
                    <span className="team-console-chip">
                      <em>Models</em>
                      {policy.batteryModels?.length ? policy.batteryModels.join(', ') : 'All'}
                    </span>
                    <span className="team-console-chip">
                      <em>DSA</em>
                      {dsaName || 'All'}
                    </span>
                    <span className="team-console-chip">
                      <em>Agent</em>
                      {agentName || 'All'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

function MasterDataPage({ session, dropdownOptions, updateDropdownList, rules, setRules, roleOptions, setRoleOptions, dsas, setDsas, agents, setAgents, setEmailPolicies }) {
  const isSuperAdmin = session.role === 'SUPER_ADMIN';

  function setDropdownList(key, values) {
    updateDropdownList(key, values);
  }

  if (!isSuperAdmin) {
    return (
      <Panel title="Master Data" subtitle="Only SUPER_ADMIN can change dropdown masters.">
        <div className="warning-box"><AlertTriangle size={17} /> Switch to SUPER_ADMIN to manage dropdown options.</div>
      </Panel>
    );
  }

  return (
    <div className="dashboard-layout">
      <section className="hero-panel">
        <div>
          <h1>Dropdown Option Control</h1>
          <p>Maintain the master values used across lead capture, product terms, access roles, DSA routing, and battery selectors.</p>
        </div>
        <div className="rule-strip">
          <strong>{dropdownOptions.loanAmounts.length}</strong><span>Amounts</span>
          <strong>{rules.tenures.length}</strong><span>Tenures</span>
          <strong>{dsas.length + agents.length}</strong><span>Network</span>
        </div>
      </section>

      <section className="master-grid">
        <OptionEditor
          title="Loan Amount Options"
          subtitle="Values shown in the lead amount dropdown."
          values={dropdownOptions.loanAmounts}
          type="number"
          placeholder="Add amount"
          formatValue={formatMoney}
          onChange={(values) => setDropdownList('loanAmounts', values)}
        />
        <OptionEditor
          title="Tenure Options"
          subtitle="Values used by lead capture and BRE checks."
          values={rules.tenures}
          type="number"
          placeholder="Add months"
          formatValue={(value) => `${value} months`}
          onChange={(values) => setRules({ ...rules, tenures: values })}
        />
        <OptionEditor
          title="Lead Sources"
          subtitle="Source choices for new enquiries."
          values={dropdownOptions.sources}
          placeholder="Add source"
          onChange={(values) => setDropdownList('sources', values)}
        />
        <OptionEditor
          title="Company Makes"
          subtitle="Company make choices for new applications."
          values={dropdownOptions.companyMakes}
          placeholder="Add company make"
          onChange={(values) => setDropdownList('companyMakes', values)}
        />
        <OptionEditor
          title="Battery Models"
          subtitle="Battery product choices for new applications."
          values={dropdownOptions.batteryModels}
          placeholder="Add battery model"
          onChange={(values) => setDropdownList('batteryModels', values)}
        />
        <OptionEditor
          title="Vehicle Categories"
          subtitle="Vehicle category choices shown on lead capture."
          values={dropdownOptions.vehicleCategories || []}
          placeholder="Add vehicle category"
          onChange={(values) => setDropdownList('vehicleCategories', values)}
        />
        <AgentOptionEditor
          title="Agent Options"
          subtitle="Create agents under a DSA. Lead capture shows only agents linked to the selected DSA."
          values={agents}
          dsas={dsas}
          placeholder="Add agent"
          onChange={setAgents}
        />
        <OptionEditor
          title="Role Options"
          subtitle="Roles exposed in the session role switcher."
          values={roleOptions}
          placeholder="Add role"
          protectedValues={['SUPER_ADMIN']}
          onChange={setRoleOptions}
        />
      </section>
    </div>
  );
}

function MultiOptionList({ values, selectedValues, onChange, formatLabel = (value) => value }) {
  const selected = new Set(selectedValues);

  return (
    <div className="multi-option-list">
      {values.map((value) => (
        <label className="multi-option-row" key={value}>
          <input
            type="checkbox"
            checked={selected.has(value)}
            onChange={(event) => onChange(value, event.target.checked)}
          />
          <span>{formatLabel(value)}</span>
        </label>
      ))}
    </div>
  );
}

function AgentOptionEditor({ title, subtitle, values, onChange, dsas, placeholder = 'Add agent' }) {
  const [draft, setDraft] = useState('');
  const [draftDsaId, setDraftDsaId] = useState(dsas[0]?.id || '');

  useEffect(() => {
    setDraftDsaId((current) => dsas.some((dsa) => dsa.id === current) ? current : dsas[0]?.id || '');
  }, [dsas]);

  function addOption(event) {
    event.preventDefault();
    const nextValue = draft.trim();
    if (!nextValue || !draftDsaId) return;
    const exists = values.some((value) => String(value.name).toLowerCase() === nextValue.toLowerCase() && value.dsaId === draftDsaId);
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...values, { id: newEntityUuid(), name: nextValue, dsaId: draftDsaId, mobile: '' }]);
    setDraft('');
  }

  function removeOption(option) {
    onChange(values.filter((value) => value.id !== option.id));
  }

  function updateAgentDsa(option, dsaId) {
    onChange(values.map((value) => value.id === option.id ? { ...value, dsaId } : value));
  }

  return (
    <Panel title={title} subtitle={subtitle}>
      <form className="option-add-row agent-add-row" onSubmit={addOption}>
        <input value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} />
        <select value={draftDsaId} onChange={(event) => setDraftDsaId(event.target.value)} disabled={!dsas.length}>
          {!dsas.length && <option value="">Create DSA first</option>}
          {dsas.map((dsa) => <option key={dsa.id} value={dsa.id}>{dsa.firmName}</option>)}
        </select>
        <button className="primary-action compact" type="submit" disabled={!dsas.length}><Plus size={16} /> Add</button>
      </form>
      <div className="option-list agent-option-list">
        {values.map((option) => (
          <div className="option-pill agent-option-pill" key={option.id}>
            <span>{option.name}</span>
            <select value={option.dsaId || ''} onChange={(event) => updateAgentDsa(option, event.target.value)}>
              {!option.dsaId && <option value="">Select DSA</option>}
              {dsas.map((dsa) => <option key={dsa.id} value={dsa.id}>{dsa.firmName}</option>)}
            </select>
            <button type="button" onClick={() => removeOption(option)} aria-label={`Remove ${option.name}`}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function EntityOptionEditor({ title, subtitle, values, onChange, labelKey, makeItem, placeholder = 'Add option' }) {
  const [draft, setDraft] = useState('');

  function addOption(event) {
    event.preventDefault();
    const nextValue = draft.trim();
    if (!nextValue) return;
    const exists = values.some((value) => String(value[labelKey]).toLowerCase() === nextValue.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...values, makeItem(nextValue, values)]);
    setDraft('');
  }

  function removeOption(option) {
    onChange(values.filter((value) => value.id !== option.id));
  }

  return (
    <Panel title={title} subtitle={subtitle}>
      <form className="option-add-row" onSubmit={addOption}>
        <input value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} />
        <button className="primary-action compact" type="submit"><Plus size={16} /> Add</button>
      </form>
      <div className="option-list">
        {values.map((option) => (
          <div className="option-pill" key={option.id}>
            <span>{option[labelKey]}</span>
            <button type="button" onClick={() => removeOption(option)} aria-label={`Remove ${option[labelKey]}`}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function OptionEditor({ title, subtitle, values, onChange, type = 'text', placeholder = 'Add option', formatValue = (value) => value, protectedValues = [] }) {
  const [draft, setDraft] = useState('');
  const normalizedProtected = protectedValues.map((value) => String(value).toLowerCase());

  function normalize(value) {
    if (type === 'number') {
      const number = parseFormattedNumber(value);
      return Number.isFinite(number) && number > 0 ? number : '';
    }
    return String(value || '').trim();
  }

  function addOption(event) {
    event.preventDefault();
    const nextValue = normalize(draft);
    if (!nextValue) return;
    const exists = values.some((value) => String(value).toLowerCase() === String(nextValue).toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    const nextValues = type === 'number' ? [...values, nextValue].map(Number).sort((a, b) => a - b) : [...values, nextValue];
    onChange(nextValues);
    setDraft('');
  }

  function removeOption(option) {
    const protectedOption = normalizedProtected.includes(String(option).toLowerCase());
    if (protectedOption) return;
    onChange(values.filter((value) => value !== option));
  }

  return (
    <Panel title={title} subtitle={subtitle}>
      <form className="option-add-row" onSubmit={addOption}>
        <input value={draft} type="text" inputMode={type === 'number' ? 'numeric' : undefined} placeholder={placeholder} onChange={(event) => setDraft(type === 'number' ? formatNumberInput(event.target.value) : event.target.value)} />
        <button className="primary-action compact" type="submit"><Plus size={16} /> Add</button>
      </form>
      <div className="option-list">
        {values.map((option) => {
          const protectedOption = normalizedProtected.includes(String(option).toLowerCase());
          return (
            <div className="option-pill" key={option}>
              <span>{formatValue(option)}</span>
              <button type="button" disabled={protectedOption} onClick={() => removeOption(option)} aria-label={`Remove ${option}`}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function boardDate(value) {
  const [year, month, day] = rowDate(value, today()).split('-');
  return [day, month, year].filter(Boolean).join('.');
}

function boardStatus(app) {
  if (documentCompletion(app) < 0.45 || ['KYC Pending', 'Docs Hold'].includes(app.status)) return 'Document Pending';
  if (app.stage === 'Lead / Enquiry') return 'Claim Intimation Pending';
  if (app.stage === 'Field Investigation') return 'Survey Pending';
  if (app.credit?.decision === 'Pending' || app.status === 'Credit Queue') return 'Approval Pending';
  if (app.stage === 'Loan Servicing') return 'Denting';
  return app.status || app.stage || 'Document Pending';
}

function ApplicationsTable({ apps, selectedId, onSelect, dsas }) {
  const dsaName = (app) => dsas.find((dsa) => dsa.id === app.dsaId)?.firmName || app.dsaId || '—';

  return (
    <div className="loan-table bodyshop-table">
      <div className="table-head">
        <span>R/O No</span>
        <span>Date</span>
        <span>DSA</span>
        <span>Reg No</span>
        <span>Customer</span>
        <span>Model</span>
        <span>Insurance</span>
        <span>Advisor</span>
        <span>Photos</span>
        <span>Status</span>
      </div>
      {apps.length ? apps.map((app) => (
        <button className={`table-row ${selectedId === app.id ? 'selected' : ''}`} key={app.id} onClick={() => onSelect(app.id)}>
          <span><strong>{String(app.id || app.leadId || '').replace(/^APP-/, 'R')}</strong></span>
          <span>{boardDate(app.createdAt)}</span>
          <span>{dsaName(app)}</span>
          <span>{app.vehicleDetails?.registrationNo || app.customerCode || '—'}</span>
          <span><strong>{app.customer}</strong></span>
          <span>{app.vehicleDetails?.modelName || app.companyMake || '—'}</span>
          <span>—</span>
          <span>{app.agentId || app.dsaId || '—'}</span>
          <span><span className="photo-chip"><Images size={15} />View</span></span>
          <span><Status value={boardStatus(app)} /></span>
        </button>
      )) : <EmptyState title="No applications" detail="No live loan application records are available." />}
    </div>
  );
}

function LoanDetail({ app }) {
  if (!app) return null;
  return (
    <Panel title={app.customer} subtitle={`${app.customerCode} · ${app.id} · ${app.mobile}`}>
      <div className="amount-box">
        <span>Loan terms</span>
        <strong>{formatMoney(app.amount)}</strong>
        <small>{app.tenure} months · EMI {formatMoney(app.emi)} · {(app.rate * 100).toFixed(0)}% flat p.a.</small>
      </div>
      <div className="timeline">
        {lifecycle.map((stage) => (
          <div key={stage} className={`timeline-step ${lifecycle.indexOf(stage) <= lifecycle.indexOf(app.stage) ? 'done' : ''}`}>
            <span>{lifecycle.indexOf(stage) < lifecycle.indexOf(app.stage) ? <Check size={13} /> : lifecycle.indexOf(stage) + 1}</span>
            <p>{stage}</p>
          </div>
        ))}
      </div>
      <div className="mini-table">
        <span>Customer code</span><strong>{app.customerCode}</strong>
        <span>Status</span><strong>{app.status}</strong>
        <span>Loan date</span><strong>{app.createdAt}</strong>
        <span>First EMI date</span><strong>{app.firstEmiDate || '-'}</strong>
        <span>Risk</span><strong>{app.risk}</strong>
        <span>DPD</span><strong>{app.servicing.dpd}</strong>
        <span>Remark</span><strong>{app.loanRemark || '-'}</strong>
      </div>
    </Panel>
  );
}

function AuditTrail({ app }) {
  return (
    <div className="audit-list">
      <h4>Audit trail</h4>
      {app.audit.slice(0, 5).map((item, index) => (
        <div key={`${item.at}-${index}`}>
          <Clock3 size={14} />
          <span><strong>{item.action}</strong><small>{item.actor} · {item.at} {item.detail ? `· ${item.detail}` : ''}</small></span>
        </div>
      ))}
    </div>
  );
}

function Metric({ icon: Icon, label, value, trend, onClick, active = false }) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component className={`metric ${active ? 'active' : ''}`.trim()} type={onClick ? 'button' : undefined} onClick={onClick}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{trend}</em>
    </Component>
  );
}

function Insight({ label, value, detail }) {
  return (
    <div className="insight-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = '', required = false }) {
  return <label className={`field ${className}`.trim()}><span>{label}{required && <span className="field-required-mark" aria-hidden="true"> *</span>}</span>{children}</label>;
}

function joinSplitAddress(split) {
  if (!split || typeof split !== 'object') return '';
  const parts = [];
  const addressLine = Array.isArray(split.address_line) ? split.address_line.filter(Boolean).join(' ') : split.address_line;
  const city = Array.isArray(split.city) ? split.city.filter(Boolean).join(' ') : split.city;
  const district = Array.isArray(split.district) ? split.district.filter(Boolean).join(' ') : split.district;
  const state = Array.isArray(split.state)
    ? split.state.flat().filter(Boolean).join(' ')
    : split.state;
  const country = Array.isArray(split.country) ? (split.country[2] || split.country[0]) : split.country;
  [addressLine, city, district, state, split.pincode, country].forEach((part) => {
    const value = typeof part === 'string' ? part.trim() : part;
    if (value) parts.push(String(value));
  });
  return parts.join(', ');
}

function dlAddressFor(addressList, type) {
  if (!Array.isArray(addressList)) return '';
  const entry = addressList.find((item) => item?.type === type);
  if (!entry) return '';
  return entry.complete_address || joinSplitAddress(entry.split_address) || '';
}

function flattenDlResult(result) {
  if (!result || typeof result !== 'object') return [];
  const details = result.details_of_driving_licence || {};
  const validity = result.dl_validity || {};
  const nonTransport = validity.non_transport || {};
  const transport = validity.transport || {};
  const badges = Array.isArray(result.badge_details) ? result.badge_details : [];
  const classes = badges.flatMap((badge) => Array.isArray(badge?.class_of_vehicle) ? badge.class_of_vehicle : []);
  const badgeNumbers = badges.map((badge) => badge?.badge_no).filter(Boolean);
  const badgeDates = badges.map((badge) => badge?.badge_issue_date).filter(Boolean);
  const permanentAddress = dlAddressFor(details.address_list, 'permanent');
  const temporaryAddress = dlAddressFor(details.address_list, 'temporary');
  const rows = [
    ['Status', result.status],
    ['DL number', result.dl_number],
    ['Name', details.name],
    ['Father / Husband', details.father_or_husband_name],
    ['Date of birth', result.dob],
    ['Licence status', details.status],
    ['Date of issue', details.date_of_issue],
    ['Non-transport from', nonTransport.from],
    ['Non-transport to', nonTransport.to],
    ['Transport from', transport.from],
    ['Transport to', transport.to],
    ['Hazardous valid till', validity.hazardous_valid_till],
    ['Hill valid till', validity.hill_valid_till],
    ['Vehicle classes', classes.length ? Array.from(new Set(classes)).join(', ') : ''],
    ['Badge numbers', badgeNumbers.join(', ')],
    ['Badge issue dates', badgeDates.join(', ')],
    ['Address', details.address],
    ['Permanent address', permanentAddress],
    ['Temporary address', temporaryAddress],
    ['Last transaction date', details.date_of_last_transaction],
    ['Last transacted at', details.last_transacted_at],
  ];
  return rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
}

function dlPhotoUrl(result) {
  return result?.details_of_driving_licence?.photo || result?.photo || '';
}

function DlResultCard({ verification }) {
  const result = verification?.result || {};
  const rows = flattenDlResult(result);
  const photo = dlPhotoUrl(result);
  return (
    <div className="ovd-result-card">
      <div className="ovd-result-header">
        <strong>Driving Licence Response</strong>
        <span className={`ovd-result-badge ${verification?.verified ? 'ok' : 'pending'}`}>
          {verification?.verified ? 'Verified' : result.status || 'Pending'}
        </span>
      </div>
      {photo && (
        <a className="ovd-photo-link" href={photo} target="_blank" rel="noreferrer">
          <img src={photo} alt="DL photo" className="ovd-photo" />
        </a>
      )}
      <div className="pan-result-grid">
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Fragment>
        ))}
        <span>Verification ID</span><strong>{result.verification_id || verification.verificationId || '—'}</strong>
        <span>Reference ID</span><strong>{result.reference_id || verification.referenceId || '—'}</strong>
        <span>Checked at</span><strong>{verification.checkedAt || '—'}</strong>
      </div>
      <details className="pan-result-raw">
        <summary>Raw Cashfree response</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

const VOTER_RESULT_FIELDS = [
  ['Status', 'status'],
  ['EPIC number', 'epic_number'],
  ['Name', 'name'],
  ['Name provided', 'name_provided'],
  ['Relation name', 'relation_name'],
  ['Relation type', 'relation_type'],
  ['Age', 'age'],
  ['Date of birth', 'dob'],
  ['Gender', 'gender'],
  ['House no', 'house_no'],
  ['Address', 'address'],
  ['Area', 'area'],
  ['District', 'district'],
  ['State', 'state'],
  ['Pincode', 'pincode'],
  ['Assembly constituency', 'ac_name'],
  ['Parliamentary constituency', 'pc_name'],
  ['Part name', 'part_name'],
  ['Polling station', 'ps_name'],
  ['Last update', 'last_update'],
];

function flattenRcResult(result) {
  if (!result || typeof result !== 'object') return [];
  const rows = [
    ['Status', result.status],
    ['RC status', result.rc_status],
    ['Status as on', result.status_as_on],
    ['Registration number', result.reg_no || result.vehicle_number],
    ['Owner', result.owner],
    ['Owner father / husband', result.owner_father_name],
    ['Owner count', result.owner_count],
    ['Mobile number', result.mobile_number],
    ['Vehicle class', result.class],
    ['Vehicle category', result.vehicle_category],
    ['Manufacturer', result.vehicle_manufacturer_name],
    ['Model', result.model],
    ['Body type', result.body_type],
    ['Type / fuel', result.type],
    ['Color', result.vehicle_colour],
    ['Engine number', result.engine],
    ['Chassis number', result.chassis],
    ['Cubic capacity', result.vehicle_cubic_capacity],
    ['Cylinders', result.vehicle_cylinders_no],
    ['Seating capacity', result.vehicle_seat_capacity],
    ['Sleeper capacity', result.vehicle_sleeper_capacity],
    ['Standing capacity', result.vehicle_standing_capacity],
    ['Unladen weight', result.unladen_weight],
    ['Gross weight', result.gross_vehicle_weight],
    ['Wheelbase', result.wheelbase],
    ['Standard cap', result.rc_standard_cap],
    ['Norms', result.norms_type],
    ['Manufactured', result.vehicle_manufacturing_month_year],
    ['Registration date', result.reg_date],
    ['RC expiry', result.rc_expiry_date],
    ['Registration authority', result.reg_authority],
    ['Financer', result.rc_financer],
    ['Insurance company', result.vehicle_insurance_company_name],
    ['Insurance policy no', result.vehicle_insurance_policy_number],
    ['Insurance upto', result.vehicle_insurance_upto],
    ['Tax upto', result.vehicle_tax_upto],
    ['PUCC number', result.pucc_number],
    ['PUCC upto', result.pucc_upto],
    ['Permit number', result.permit_number],
    ['Permit type', result.permit_type],
    ['Permit issue date', result.permit_issue_date],
    ['Permit valid from', result.permit_valid_from],
    ['Permit valid upto', result.permit_valid_upto],
    ['National permit number', result.national_permit_number],
    ['National permit upto', result.national_permit_upto],
    ['National permit issued by', result.national_permit_issued_by],
    ['Non-use status', result.non_use_status],
    ['Non-use from', result.non_use_from],
    ['Non-use to', result.non_use_to],
    ['Present address', result.present_address || joinSplitAddress(result.split_present_address)],
    ['Permanent address', result.permanent_address || joinSplitAddress(result.split_permanent_address)],
    ['Is commercial', typeof result.is_commercial === 'boolean' ? (result.is_commercial ? 'Yes' : 'No') : result.is_commercial],
    ['Blacklist status', result.blacklist_status],
    ['Blacklist details', Array.isArray(result.blacklist_details) && result.blacklist_details.length ? `${result.blacklist_details.length} entries` : ''],
    ['Challan details', Array.isArray(result.challan_details) && result.challan_details.length ? `${result.challan_details.length} entries` : ''],
    ['NOC details', result.noc_details],
  ];
  return rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
}

function RcResultCard({ verification }) {
  const result = verification?.result || {};
  const rows = flattenRcResult(result);
  return (
    <div className="ovd-result-card">
      <div className="ovd-result-header">
        <strong>Vehicle RC Response</strong>
        <span className={`ovd-result-badge ${verification?.verified ? 'ok' : 'pending'}`}>
          {verification?.verified ? 'Verified' : result.status || 'Pending'}
        </span>
      </div>
      <div className="pan-result-grid">
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Fragment>
        ))}
        <span>Verification ID</span><strong>{result.verification_id || verification.verificationId || '—'}</strong>
        <span>Reference ID</span><strong>{result.reference_id || verification.referenceId || '—'}</strong>
        <span>Checked at</span><strong>{verification.checkedAt || '—'}</strong>
      </div>
      <details className="pan-result-raw">
        <summary>Raw Cashfree response</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

function flattenBankResult(result) {
  if (!result || typeof result !== 'object') return [];
  const rows = [
    ['Account status', result.account_status],
    ['Status code', result.account_status_code],
    ['Name at bank', result.name_at_bank],
    ['Name match result', result.name_match_result],
    ['Name match score', result.name_match_score],
    ['Bank name', result.bank_name || result.bank],
    ['Branch', result.branch],
    ['City', result.city],
    ['MICR', result.micr],
    ['UTR', result.utr],
    ['IFSC', result.ifsc],
    ['Account number', result.account_number || result.bank_account],
  ];
  return rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
}

function BankAccountResultCard({ verification }) {
  const result = verification?.result || {};
  const rows = flattenBankResult(result);
  return (
    <div className="ovd-result-card">
      <div className="ovd-result-header">
        <strong>Bank Account Response</strong>
        <span className={`ovd-result-badge ${verification?.verified ? 'ok' : 'pending'}`}>
          {verification?.verified ? 'Verified' : result.account_status || result.account_status_code || 'Pending'}
        </span>
      </div>
      <div className="pan-result-grid">
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Fragment>
        ))}
        <span>Verification ID</span><strong>{result.verification_id || verification.verificationId || '—'}</strong>
        <span>Reference ID</span><strong>{result.reference_id || verification.referenceId || '—'}</strong>
        <span>Checked at</span><strong>{verification.checkedAt || '—'}</strong>
      </div>
      <details className="pan-result-raw">
        <summary>Raw Cashfree response</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

function formatOvdValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.map(formatOvdValue).join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function OvdResultCard({ title, verification, fields }) {
  const result = verification?.result || {};
  const rows = fields.filter(([, key]) => {
    const value = result[key];
    return value !== undefined && value !== null && value !== '';
  });
  return (
    <div className="ovd-result-card">
      <div className="ovd-result-header">
        <strong>{title}</strong>
        <span className={`ovd-result-badge ${verification?.verified ? 'ok' : 'pending'}`}>
          {verification?.verified ? 'Verified' : result.status || 'Pending'}
        </span>
      </div>
      <div className="pan-result-grid">
        {rows.map(([label, key]) => (
          <Fragment key={key}>
            <span>{label}</span>
            <strong>{formatOvdValue(result[key])}</strong>
          </Fragment>
        ))}
        <span>Verification ID</span><strong>{verification.verificationId || result.verification_id || '—'}</strong>
        <span>Reference ID</span><strong>{verification.referenceId || result.reference_id || '—'}</strong>
        <span>Checked at</span><strong>{verification.checkedAt || '—'}</strong>
      </div>
      <details className="pan-result-raw" open>
        <summary>Raw Cashfree response</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

function Status({ value = 'Pending' }) {
  const normalized = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <span className={`status status-${normalized}`}>{value}</span>;
}

function EmptyState({ title, detail }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}

function CheckCard({ label, done }) {
  return <div className={`check-card ${done ? 'done' : ''}`}>{done ? <Check size={16} /> : <Clock3 size={16} />}<span>{label}</span></div>;
}

createRoot(document.getElementById('root')).render(<App />);

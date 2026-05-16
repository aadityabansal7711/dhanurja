import { isSupabaseConfigured, supabase } from './supabase';

export const PAN_STATUS_LABELS = {
  E: 'Existing and valid',
  F: 'Marked as fake',
  X: 'Marked as deactivated',
  D: 'Deleted',
  N: 'Not found / invalid PAN',
  EA: 'Existing and valid - amalgamation',
  EC: 'Existing and valid - acquisition',
  ED: 'Existing and valid - death',
  EI: 'Existing and valid - dissolution',
  EL: 'Existing and valid - liquidated',
  EM: 'Existing and valid - merger',
  EP: 'Existing and valid - partition',
  ES: 'Existing and valid - split',
  EU: 'Existing and valid - under liquidation',
};

export function isPanStatusAcceptable(status) {
  return ['E', 'EA', 'EC', 'EI', 'EL', 'EM', 'EP', 'ES', 'EU'].includes(String(status || '').toUpperCase());
}

export function describePanStatus(status) {
  return PAN_STATUS_LABELS[String(status || '').toUpperCase()] || 'Unknown PAN status';
}

export function normalizeMatch(value) {
  if (value === 'Y') return 'Matched';
  if (value === 'N') return 'Not matched';
  return 'Not returned';
}

async function readFunctionErrorBody(error) {
  const response = error?.context?.response ?? error?.context;
  if (!response || typeof response.text !== 'function') return null;
  try {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_parseError) {
      return { message: text };
    }
  } catch (_readError) {
    return null;
  }
}

async function invokeKycFunction(functionName, payload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Cashfree verification.');
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  });

  if (error) {
    const body = await readFunctionErrorBody(error);
    const message = body?.message || error.message || 'Cashfree verification request failed.';
    const wrapped = new Error(message);
    wrapped.cause = error;
    wrapped.body = body;
    throw wrapped;
  }

  if (!data?.ok) {
    throw new Error(data?.message || 'Cashfree verification was rejected by the provider.');
  }

  return data;
}

export async function verifyPanWithCashfree(payload) {
  return invokeKycFunction('verify-pan', payload);
}

export async function createAadhaarDigilockerLink(payload) {
  return invokeKycFunction('aadhaar-digilocker', { ...payload, action: 'create' });
}

export async function checkAadhaarDigilockerStatus(payload) {
  return invokeKycFunction('aadhaar-digilocker', { ...payload, action: 'status' });
}

export async function verifyDrivingLicenseWithCashfree(payload) {
  return invokeKycFunction('cashfree-secure-id', { ...payload, action: 'driving-license' });
}

export async function verifyVoterIdWithCashfree(payload) {
  return invokeKycFunction('cashfree-secure-id', { ...payload, action: 'voter-id' });
}

export async function verifyVehicleRcWithCashfree(payload) {
  return invokeKycFunction('cashfree-secure-id', { ...payload, action: 'vehicle-rc' });
}

export async function verifyFaceLivenessWithCashfree(payload) {
  return invokeKycFunction('cashfree-secure-id', { ...payload, action: 'face-liveness' });
}

export async function verifyBankAccountWithCashfree(payload) {
  return invokeKycFunction('cashfree-secure-id', { ...payload, action: 'bank-account' });
}

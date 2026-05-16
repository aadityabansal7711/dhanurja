import { cashfreeAuthHeaders } from '../_shared/cashfree-signature.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SecureIdAction = 'driving-license' | 'voter-id' | 'vehicle-rc' | 'face-liveness' | 'bank-account';

type FilePayload = {
  dataUrl?: string;
  name?: string;
  type?: string;
};

type SecureIdPayload = {
  action?: SecureIdAction;
  verificationId?: string;
  dlNumber?: string;
  dob?: string;
  epicNumber?: string;
  name?: string;
  vehicleNumber?: string;
  selfieImage?: FilePayload;
  bankAccount?: string;
  ifsc?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function cashfreeBaseUrl() {
  return Deno.env.get('CASHFREE_VERIFICATION_BASE_URL') || 'https://sandbox.cashfree.com/verification';
}

async function cashfreeHeaders() {
  return await cashfreeAuthHeaders({ 'Content-Type': 'application/json' });
}

async function cashfreeMultipartHeaders() {
  return await cashfreeAuthHeaders();
}

function verificationId(prefix: string, value?: string) {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return String(value || `${prefix}-${stamp}-${suffix}`).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 50);
}

function requireDate(value?: string) {
  const dob = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) throw new Error('DOB must be in YYYY-MM-DD format');
  return dob;
}

function requireText(value: unknown, label: string) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function dataUrlToFile(file: FilePayload | undefined, fallbackName: string) {
  if (!file?.dataUrl) throw new Error(`${fallbackName} image is required`);
  const match = /^data:([^;]+);base64,(.+)$/.exec(file.dataUrl);
  if (!match) throw new Error(`${fallbackName} must be a data URL`);
  const mimeType = file.type || match[1];
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)) {
    throw new Error(`${fallbackName} must be a JPEG, JPG, or PNG image`);
  }
  const binary = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  if (binary.byteLength > 5 * 1024 * 1024) throw new Error(`${fallbackName} must be 5 MB or smaller`);
  return new File([binary], file.name || `${fallbackName}.jpg`, { type: mimeType });
}

async function parseJson(upstream: Response, fallbackMessage: string) {
  const rawText = await upstream.text();
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch (_error) {
    throw new Error(`${fallbackMessage} with HTTP ${upstream.status}`);
  }
}

async function postJson(path: string, payload: Record<string, unknown>) {
  let upstream = await fetch(`${cashfreeBaseUrl()}/${path}`, {
    method: 'POST',
    headers: await cashfreeHeaders(),
    body: JSON.stringify(payload),
  });
  let providerBody = await parseJson(upstream, `Cashfree returned a non-JSON ${path} response`);
  const msg = String(providerBody?.message || providerBody?.error || '').toLowerCase();
  if (!upstream.ok && msg.includes('verification_id') && msg.includes('exist')) {
    const prefix = path.split('/')[0] || 'sid';
    payload = { ...payload, verification_id: verificationId(prefix) };
    upstream = await fetch(`${cashfreeBaseUrl()}/${path}`, {
      method: 'POST',
      headers: await cashfreeHeaders(),
      body: JSON.stringify(payload),
    });
    providerBody = await parseJson(upstream, `Cashfree returned a non-JSON ${path} response`);
  }
  if (!upstream.ok) {
    return json({
      ok: false,
      message: String(providerBody.message || `Cashfree ${path} verification failed with HTTP ${upstream.status}`),
      verificationId: providerBody.verification_id || payload.verification_id,
      referenceId: providerBody.reference_id || providerBody.ref_id || null,
      result: providerBody,
    }, 502);
  }
  return json({
    ok: true,
    message: String(providerBody.message || `Cashfree ${path} verification completed`),
    verificationId: providerBody.verification_id || payload.verification_id,
    referenceId: providerBody.reference_id || providerBody.ref_id || null,
    status: providerBody.status || null,
    result: providerBody,
  });
}

async function postMultipart(path: string, formData: FormData, verification_id: string) {
  const upstream = await fetch(`${cashfreeBaseUrl()}/${path}`, {
    method: 'POST',
    headers: await cashfreeMultipartHeaders(),
    body: formData,
  });
  const providerBody = await parseJson(upstream, `Cashfree returned a non-JSON ${path} response`);
  if (!upstream.ok) {
    return json({
      ok: false,
      message: String(providerBody.message || `Cashfree ${path} verification failed with HTTP ${upstream.status}`),
      verificationId: providerBody.verification_id || verification_id,
      referenceId: providerBody.reference_id || providerBody.ref_id || null,
      result: providerBody,
    }, 502);
  }
  return json({
    ok: true,
    message: String(providerBody.message || `Cashfree ${path} verification completed`),
    verificationId: providerBody.verification_id || verification_id,
    referenceId: providerBody.reference_id || providerBody.ref_id || null,
    status: providerBody.status || null,
    result: providerBody,
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'POST method required' }, 405);

  try {
    const body = await request.json() as SecureIdPayload;
    const action = body.action;
    if (!action) throw new Error('Secure ID action is required');

    if (action === 'driving-license') {
      return await postJson('driving-license', {
        verification_id: verificationId('dl', body.verificationId),
        dl_number: requireText(body.dlNumber, 'Driving licence number'),
        dob: requireDate(body.dob),
      });
    }

    if (action === 'voter-id') {
      return await postJson('voter-id', {
        verification_id: verificationId('voter', body.verificationId),
        epic_number: requireText(body.epicNumber, 'Voter EPIC number').toUpperCase(),
        name: requireText(body.name, 'Voter name').slice(0, 50),
      });
    }

    if (action === 'vehicle-rc') {
      return await postJson('vehicle-rc', {
        verification_id: verificationId('rc', body.verificationId),
        vehicle_number: requireText(body.vehicleNumber, 'Vehicle registration number').toUpperCase().replace(/\s/g, ''),
      });
    }

    if (action === 'bank-account') {
      const payload: Record<string, unknown> = {
        verification_id: verificationId('bank', body.verificationId),
        bank_account: requireText(body.bankAccount, 'Bank account number').replace(/\s/g, ''),
        ifsc: requireText(body.ifsc, 'IFSC').toUpperCase().replace(/\s/g, ''),
      };
      const name = String(body.name || '').trim();
      if (name) payload.name = name.slice(0, 80);
      return await postJson('bank-account/sync', payload);
    }

    if (action === 'face-liveness') {
      const verification_id = verificationId('live', body.verificationId);
      const formData = new FormData();
      formData.set('verification_id', verification_id);
      formData.set('image', dataUrlToFile(body.selfieImage, 'selfie'));
      return await postMultipart('face-liveness', formData, verification_id);
    }

    throw new Error(`Unsupported Secure ID action: ${action}`);
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : 'Cashfree Secure ID verification failed' }, 400);
  }
});

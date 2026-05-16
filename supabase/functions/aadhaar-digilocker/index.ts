import { cashfreeAuthHeaders } from '../_shared/cashfree-signature.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AadhaarPayload = {
  action?: 'create' | 'status';
  verificationId?: string;
  referenceId?: string | number;
  redirectUrl?: string;
  userFlow?: 'signin' | 'signup';
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

function verificationId() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `aadhaar-${stamp}-${suffix}`.slice(0, 50);
}

function cleanVerificationId(value?: string) {
  return String(value || verificationId()).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 50);
}

function defaultRedirectUrl(request: Request) {
  return request.headers.get('origin') || Deno.env.get('CASHFREE_DIGILOCKER_REDIRECT_URL') || 'http://localhost:5173';
}

async function cashfreeHeaders() {
  return await cashfreeAuthHeaders({ 'Content-Type': 'application/json' });
}

async function parseJson(upstream: Response, fallbackMessage: string) {
  const rawText = await upstream.text();
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch (_error) {
    throw new Error(`${fallbackMessage} with HTTP ${upstream.status}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'POST method required' }, 405);

  try {
    const body = await request.json() as AadhaarPayload;
    const action = body.action || 'create';

    if (action === 'create') {
      const payload = {
        verification_id: cleanVerificationId(body.verificationId),
        document_requested: ['AADHAAR'],
        redirect_url: body.redirectUrl || defaultRedirectUrl(request),
        user_flow: body.userFlow || 'signup',
      };
      const upstream = await fetch(`${cashfreeBaseUrl()}/digilocker`, {
        method: 'POST',
        headers: await cashfreeHeaders(),
        body: JSON.stringify(payload),
      });
      const providerBody = await parseJson(upstream, 'Cashfree returned a non-JSON DigiLocker response');

      if (!upstream.ok) {
        return json({
          ok: false,
          message: String(providerBody.message || `Cashfree DigiLocker link creation failed with HTTP ${upstream.status}`),
          verificationId: payload.verification_id,
          result: providerBody,
        }, 502);
      }

      return json({
        ok: true,
        message: 'Cashfree DigiLocker link created',
        verificationId: providerBody.verification_id || payload.verification_id,
        referenceId: providerBody.reference_id || null,
        url: providerBody.url || null,
        status: providerBody.status || 'PENDING',
        result: providerBody,
      });
    }

    const params = new URLSearchParams();
    if (body.referenceId) params.set('reference_id', String(body.referenceId));
    if (body.verificationId) params.set('verification_id', cleanVerificationId(body.verificationId));
    if (!params.toString()) throw new Error('verificationId or referenceId is required to check Aadhaar status');

    const upstream = await fetch(`${cashfreeBaseUrl()}/digilocker?${params.toString()}`, {
      method: 'GET',
      headers: await cashfreeHeaders(),
    });
    const providerBody = await parseJson(upstream, 'Cashfree returned a non-JSON DigiLocker status response');

    if (!upstream.ok) {
      return json({
        ok: false,
        message: String(providerBody.message || `Cashfree DigiLocker status failed with HTTP ${upstream.status}`),
        verificationId: providerBody.verification_id || body.verificationId || null,
        referenceId: providerBody.reference_id || body.referenceId || null,
        result: providerBody,
      }, 502);
    }

    return json({
      ok: true,
      message: 'Cashfree DigiLocker status fetched',
      verificationId: providerBody.verification_id || body.verificationId || null,
      referenceId: providerBody.reference_id || body.referenceId || null,
      status: providerBody.status || null,
      userDetails: providerBody.user_details || null,
      documentConsent: providerBody.document_consent || null,
      result: providerBody,
    });
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : 'Aadhaar verification failed' }, 400);
  }
});

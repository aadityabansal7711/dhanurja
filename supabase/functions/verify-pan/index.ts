import { cashfreeAuthHeaders } from '../_shared/cashfree-signature.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PanPayload = {
  pan?: string;
  name?: string;
  verificationId?: string;
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

function verificationId(prefix: string) {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `${prefix}-${stamp}-${suffix}`.slice(0, 50);
}

function normalizePayload(body: unknown) {
  const source = body as PanPayload;
  const pan = String(source.pan || '').toUpperCase().trim();
  const name = String(source.name || '').trim();

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) throw new Error('PAN format is invalid');

  const payload: Record<string, string> = {
    verification_id: String(source.verificationId || verificationId('pan')).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 50),
    pan,
  };
  if (name) payload.name = name;
  return payload;
}

async function callPanAdvance(payload: Record<string, string>) {
  const upstream = await fetch(`${cashfreeBaseUrl()}/pan/advance`, {
    method: 'POST',
    headers: await cashfreeAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const rawText = await upstream.text();
  let providerBody: Record<string, unknown> | null = null;
  try {
    providerBody = JSON.parse(rawText);
  } catch (_error) {
    providerBody = null;
  }
  return { upstream, rawText, providerBody };
}

function isVerificationIdConflict(providerBody: Record<string, unknown> | null) {
  const message = String(providerBody?.message || providerBody?.error || '').toLowerCase();
  return message.includes('verification_id') && message.includes('exist');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'POST method required' }, 405);

  try {
    let payload = normalizePayload(await request.json());

    let { upstream, rawText, providerBody } = await callPanAdvance(payload);

    if (!upstream.ok && isVerificationIdConflict(providerBody)) {
      payload = { ...payload, verification_id: verificationId('pan') };
      ({ upstream, rawText, providerBody } = await callPanAdvance(payload));
    }

    if (!providerBody) {
      return json({
        ok: false,
        message: `Cashfree returned a non-JSON PAN response with HTTP ${upstream.status}`,
        verificationId: payload.verification_id,
        upstreamStatus: upstream.status,
        rawBody: rawText.slice(0, 500),
      });
    }

    if (!upstream.ok) {
      return json({
        ok: false,
        message: String(providerBody.message || providerBody.error || `Cashfree PAN 360 failed (HTTP ${upstream.status})`),
        verificationId: providerBody.verification_id || payload.verification_id,
        referenceId: providerBody.reference_id || null,
        upstreamStatus: upstream.status,
        result: providerBody,
      });
    }

    return json({
      ok: true,
      message: String(providerBody.message || 'PAN verified through Cashfree PAN 360'),
      verificationId: providerBody.verification_id || payload.verification_id,
      referenceId: providerBody.reference_id || null,
      outputData: [providerBody],
    });
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : 'PAN verification failed' });
  }
});

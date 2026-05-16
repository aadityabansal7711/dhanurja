import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

type Payload = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
  dsaId?: string | null;
  agentId?: string | null;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'POST method required' }, 405);

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = requiredEnv('SUPABASE_ANON_KEY');

    const authHeader = request.headers.get('Authorization') || '';
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!callerToken) return json({ ok: false, message: 'Missing authorization' }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
    });
    const { data: callerUser, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerUser?.user) return json({ ok: false, message: 'Invalid session' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerProfile, error: profileErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.user.id)
      .maybeSingle();
    if (profileErr) return json({ ok: false, message: profileErr.message }, 500);
    if (!callerProfile || callerProfile.role !== 'master') {
      return json({ ok: false, message: 'Only master can create team logins' }, 403);
    }

    const body = (await request.json()) as Payload;
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();
    const rawRole = String(body.role || 'dsa').toLowerCase();
    const role = rawRole === 'agent' ? 'agent' : rawRole === 'master' ? 'master' : 'dsa';
    const dsaId = body.dsaId ? String(body.dsaId) : null;
    const agentId = body.agentId ? String(body.agentId) : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, message: 'Invalid email' }, 400);
    if (password.length < 8) return json({ ok: false, message: 'Password must be at least 8 characters' }, 400);
    if (role === 'dsa' && !dsaId) return json({ ok: false, message: 'DSA must be assigned for a DSA user' }, 400);
    if (role === 'agent' && !agentId) return json({ ok: false, message: 'Agent must be assigned for an Agent user' }, 400);

    let userId: string | null = null;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, requested_role: role },
    });

    if (createErr) {
      const msg = String(createErr.message || '');
      const alreadyExists = /already (registered|exists)|duplicate/i.test(msg);
      if (!alreadyExists) return json({ ok: false, message: msg }, 400);
      const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list.data?.users?.find((u) => (u.email || '').toLowerCase() === email);
      if (!existing) return json({ ok: false, message: 'User exists but could not be located' }, 500);
      userId = existing.id;
      const upd = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, requested_role: role },
      });
      if (upd.error) return json({ ok: false, message: upd.error.message }, 400);
    } else {
      userId = created.user?.id ?? null;
    }

    if (!userId) return json({ ok: false, message: 'Failed to resolve created user id' }, 500);

    const { error: upsertErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role,
          dsa_id: role === 'dsa' ? dsaId : null,
          assigned_agent_id: role === 'agent' ? agentId : null,
        },
        { onConflict: 'id' },
      );
    if (upsertErr) return json({ ok: false, message: upsertErr.message }, 500);

    return json({ ok: true, userId, email, role });
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : 'Failed to create user' }, 500);
  }
});

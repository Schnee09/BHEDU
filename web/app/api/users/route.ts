import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Reuse INTERNAL_API_KEY HMAC protection like admin create-user route.
function computeHmac(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

// GET: list users (limited fields) – requires valid signature
// POST: create user profile record – requires signature and body validation
export async function GET(req: Request) {
  const internalKey = process.env.INTERNAL_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
  }

  const sig = req.headers.get('x-internal-signature');
  if (!sig) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 });

  // Empty body for GET – sign empty string
  const expected = computeHmac(internalKey, '');
  try {
    const providedBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid signature format' }), { status: 400 });
  }

  const sb = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await sb.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ data }), { status: 200 });
}

export async function POST(req: Request) {
  const internalKey = process.env.INTERNAL_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
  }

  const raw = await req.text();
  const sig = req.headers.get('x-internal-signature');
  if (!sig) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 });
  const expected = computeHmac(internalKey, raw);
  try {
    const providedBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid signature format' }), { status: 400 });
  }

  let body: { full_name?: unknown; role?: unknown } = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const { full_name, role } = body;
  if (!full_name || typeof full_name !== 'string') return new Response(JSON.stringify({ error: 'full_name required' }), { status: 400 });
  if (role && typeof role !== 'string') return new Response(JSON.stringify({ error: 'role must be string' }), { status: 400 });

  const sb = createClient(supabaseUrl, serviceRoleKey);
  // Note: profiles.id must be explicitly provided (usually matches auth.users.id)
  // For now, generate a random UUID - in production, this should match an auth user
  const profileId = crypto.randomUUID();
  const { data, error } = await sb.from('profiles').insert({ id: profileId, full_name, role: role || 'student' }).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ data }), { status: 201 });
}

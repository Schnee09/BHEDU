import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function computeHmac(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

// GET: list courses (requires HMAC signature)
// POST: create a course (requires HMAC signature)
export async function GET(req: Request) {
  const internalKey = process.env.INTERNAL_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
  }

  const sig = req.headers.get('x-internal-signature');
  if (!sig) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 });

  // Empty payload for GET
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
  const { data, error } = await sb
    .from('courses')
    .select('id, title, description, thumbnail, author_id, is_published, created_at, updated_at')
    .order('created_at', { ascending: false });

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

  let body: {
    title?: unknown;
    description?: unknown;
    thumbnail?: unknown;
    author_id?: unknown;
    is_published?: unknown;
  } = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const { title, description, thumbnail, author_id, is_published } = body;
  if (!title || typeof title !== 'string') return new Response(JSON.stringify({ error: 'title required' }), { status: 400 });
  if (description && typeof description !== 'string') return new Response(JSON.stringify({ error: 'description must be string' }), { status: 400 });
  if (thumbnail && typeof thumbnail !== 'string') return new Response(JSON.stringify({ error: 'thumbnail must be string' }), { status: 400 });
  if (author_id && typeof author_id !== 'string') return new Response(JSON.stringify({ error: 'author_id must be string' }), { status: 400 });
  if (typeof is_published !== 'undefined' && typeof is_published !== 'boolean') return new Response(JSON.stringify({ error: 'is_published must be boolean' }), { status: 400 });

  const sb = createClient(supabaseUrl, serviceRoleKey);
  const insert = {
    title,
    description: (description as string) ?? null,
    thumbnail: (thumbnail as string) ?? null,
    author_id: (author_id as string) ?? null,
    is_published: (is_published as boolean) ?? false
  };

  const { data, error } = await sb.from('courses').insert(insert).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ data }), { status: 201 });
}

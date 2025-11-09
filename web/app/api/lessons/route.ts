import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function computeHmac(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

// GET /api/lessons?course_id=uuid (list lessons for a course)
// POST /api/lessons (create lesson)
export async function GET(req: Request) {
  const internalKey = process.env.INTERNAL_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
  }

  const url = new URL(req.url);
  const course_id = url.searchParams.get('course_id');
  if (!course_id) return new Response(JSON.stringify({ error: 'course_id required' }), { status: 400 });

  const sig = req.headers.get('x-internal-signature');
  if (!sig) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 });

  // Use the query string as part of signed payload for GET for minimal replay protection
  const expected = computeHmac(internalKey, `course_id=${course_id}`);
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
    .from('lessons')
    .select('id, course_id, title, content, video_url, order_index, is_published, created_at, updated_at')
    .eq('course_id', course_id)
    .order('order_index', { ascending: true });

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
    course_id?: unknown;
    title?: unknown;
    content?: unknown;
    video_url?: unknown;
    order_index?: unknown;
    is_published?: unknown;
  } = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const { course_id, title, content, video_url, order_index, is_published } = body;
  if (!course_id || typeof course_id !== 'string') return new Response(JSON.stringify({ error: 'course_id required' }), { status: 400 });
  if (!title || typeof title !== 'string') return new Response(JSON.stringify({ error: 'title required' }), { status: 400 });
  if (content && typeof content !== 'string') return new Response(JSON.stringify({ error: 'content must be string' }), { status: 400 });
  if (video_url && typeof video_url !== 'string') return new Response(JSON.stringify({ error: 'video_url must be string' }), { status: 400 });
  if (typeof order_index !== 'undefined' && typeof order_index !== 'number') return new Response(JSON.stringify({ error: 'order_index must be number' }), { status: 400 });
  if (typeof is_published !== 'undefined' && typeof is_published !== 'boolean') return new Response(JSON.stringify({ error: 'is_published must be boolean' }), { status: 400 });

  const sb = createClient(supabaseUrl, serviceRoleKey);
  const insert = {
    course_id: course_id as string,
    title: title as string,
    content: (content as string) ?? null,
    video_url: (video_url as string) ?? null,
    order_index: (order_index as number) ?? 0,
    is_published: (is_published as boolean) ?? false
  } as any;

  const { data, error } = await sb.from('lessons').insert(insert).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ data }), { status: 201 });
}

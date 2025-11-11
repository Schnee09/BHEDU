import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { validateTitle, validateContent, validateUUID, ValidationError } from '@/lib/validation';

function computeHmac(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

// GET /api/lessons?course_id=uuid (list lessons for a course)
// POST /api/lessons (create lesson)
export async function GET(req: Request) {
  try {
    // Rate limiting
    if (checkRateLimit(req)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }), 
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const internalKey = process.env.INTERNAL_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!internalKey || !supabaseUrl || !serviceRoleKey) {
      logger.error('Server configuration missing for lessons GET');
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
    }

    const url = new URL(req.url);
    const course_id = url.searchParams.get('course_id');
    if (!course_id) return new Response(JSON.stringify({ error: 'course_id required' }), { status: 400 });

    // Validate UUID format
    try {
      validateUUID(course_id);
    } catch (err) {
      if (err instanceof ValidationError) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
      }
      throw err;
    }

    const sig = req.headers.get('x-internal-signature');
    if (!sig) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 });

    // Accept both legacy (query-string) and new (empty) signatures
    const expectedEmpty = computeHmac(internalKey, '');
    const expectedQuery = computeHmac(internalKey, `course_id=${course_id}`);
    try {
      const providedBuf = Buffer.from(sig, 'hex');
      const emptyBuf = Buffer.from(expectedEmpty, 'hex');
      const queryBuf = Buffer.from(expectedQuery, 'hex');
      const matchesEmpty = providedBuf.length === emptyBuf.length && crypto.timingSafeEqual(providedBuf, emptyBuf);
      const matchesQuery = providedBuf.length === queryBuf.length && crypto.timingSafeEqual(providedBuf, queryBuf);
      if (!matchesEmpty && !matchesQuery) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
    } catch (err) {
      logger.warn('Invalid signature format in lessons GET', { error: err });
      return new Response(JSON.stringify({ error: 'Invalid signature format' }), { status: 400 });
    }

    const sb = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await sb
      .from('lessons')
      .select('id, course_id, title, content, video_url, order_index, is_published, created_at, updated_at')
      .eq('course_id', course_id)
      .order('order_index', { ascending: true });

    if (error) {
      logger.error('Failed to fetch lessons', { error, course_id });
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err) {
    logger.error('Unexpected error in GET /api/lessons', { error: err });
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    if (checkRateLimit(req)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }), 
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const internalKey = process.env.INTERNAL_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!internalKey || !supabaseUrl || !serviceRoleKey) {
      logger.error('Server configuration missing for lessons POST');
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
    } catch (err) {
      logger.warn('Invalid signature format in lessons POST', { error: err });
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
    try { 
      body = raw ? JSON.parse(raw) : {}; 
    } catch (err) { 
      logger.warn('Invalid JSON in lessons POST', { error: err });
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); 
    }

    // Validate inputs
    try {
      const course_id = validateUUID(body.course_id);
      const title = validateTitle(body.title);
      const content = body.content ? validateContent(body.content) : null;
      const video_url = typeof body.video_url === 'string' ? body.video_url : null;
      const order_index = typeof body.order_index === 'number' ? body.order_index : 0;
      const is_published = typeof body.is_published === 'boolean' ? body.is_published : false;

      const sb = createClient(supabaseUrl, serviceRoleKey);
      const insert = {
        course_id,
        title,
        content,
        video_url,
        order_index,
        is_published
      };

      const { data, error } = await sb.from('lessons').insert(insert).select().single();
      if (error) {
        logger.error('Failed to create lesson', { error, insert });
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
      return new Response(JSON.stringify({ data }), { status: 201 });
    } catch (err) {
      if (err instanceof ValidationError) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
      }
      throw err;
    }
  } catch (err) {
    logger.error('Unexpected error in POST /api/lessons', { error: err });
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { validateTitle, validateDescription, ValidationError } from '@/lib/validation';

function computeHmac(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

// GET: list courses (requires HMAC signature)
// POST: create a course (requires HMAC signature)
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
      logger.error('Server configuration missing', { internalKey: !!internalKey, supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey });
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
    } catch (err) {
      logger.warn('Invalid signature format', { error: err });
      return new Response(JSON.stringify({ error: 'Invalid signature format' }), { status: 400 });
    }

    const sb = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await sb
      .from('courses')
      .select('id, title, description, thumbnail, author_id, is_published, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch courses', { error });
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err) {
    logger.error('Unexpected error in GET /api/courses', { error: err });
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
      logger.error('Server configuration missing', { internalKey: !!internalKey, supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey });
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
      logger.warn('Invalid signature format', { error: err });
      return new Response(JSON.stringify({ error: 'Invalid signature format' }), { status: 400 });
    }

    let body: {
      title?: unknown;
      description?: unknown;
      thumbnail?: unknown;
      author_id?: unknown;
      is_published?: unknown;
    } = {};
    try { 
      body = raw ? JSON.parse(raw) : {}; 
    } catch (err) { 
      logger.warn('Invalid JSON in request body', { error: err });
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); 
    }

    // Validate inputs
    try {
      const title = validateTitle(body.title);
      const description = body.description ? validateDescription(body.description) : null;
      const thumbnail = typeof body.thumbnail === 'string' ? body.thumbnail : null;
      const author_id = typeof body.author_id === 'string' ? body.author_id : null;
      const is_published = typeof body.is_published === 'boolean' ? body.is_published : false;

      const sb = createClient(supabaseUrl, serviceRoleKey);
      const insert = {
        title,
        description,
        thumbnail,
        author_id,
        is_published
      };

      const { data, error } = await sb.from('courses').insert(insert).select().single();
      if (error) {
        logger.error('Failed to create course', { error, insert });
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
    logger.error('Unexpected error in POST /api/courses', { error: err });
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

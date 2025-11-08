import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Simple in-memory rate limiter (per IP) for the serverless route.
// Note: in serverless environments this is per-instance and best-effort.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window per key/ip
const hits: Map<string, { count: number; reset: number }> = new Map();

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset <= now) {
    hits.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count += 1;
  return false;
}

function computeHmac(key: string, message: string) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const internalKey = process.env.INTERNAL_API_KEY; // secret used for signing

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server environment not configured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing' }), { status: 500 });
    }

    // Rate-limit by provided internal key if present, otherwise by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rlKey = internalKey ? `key:${internalKey}` : `ip:${ip}`;
    if (isRateLimited(rlKey)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    // Read raw body for signature verification
    const raw = await req.text();

    // Verify HMAC signature header: x-internal-signature: hex-hmac-sha256(raw-body)
    const providedSig = req.headers.get('x-internal-signature');
    if (!internalKey || !providedSig) {
      // If INTERNAL_API_KEY is not set in env, we deny to avoid accidental exposure.
      return new Response(JSON.stringify({ error: 'Unauthorized: missing signature or internal key' }), { status: 401 });
    }

    const expected = computeHmac(internalKey, raw);
    // Use timing-safe compare
    const providedBuf = Buffer.from(providedSig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Parse JSON after verification
    let body: any;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const { email, password } = body ?? {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'email and password required' }), { status: 400 });
    }

    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Use the server-side admin API to create a user (requires service role key)
    const { data, error } = await (sb.auth.admin as any).createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message ?? error }), { status: 400 });
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const internalKey = process.env.INTERNAL_API_KEY; // extra protection for admin endpoints

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server environment not configured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing' }), { status: 500 });
    }

    // Simple API-key protection: require x-internal-secret header to match INTERNAL_API_KEY
    if (internalKey) {
      const provided = req.headers.get('x-internal-secret');
      if (!provided || provided !== internalKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
    }

    const sb = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password required' }), { status: 400 });
    }

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

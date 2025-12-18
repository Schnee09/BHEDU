import { NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const perPage = Math.max(1, Number(url.searchParams.get('perPage') || '25'));
  const q = (url.searchParams.get('q') || '').trim();

  const { supabase } = await getDataClient(request);

  try {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let base = supabase.from('profiles').select('id, full_name, role', { count: 'exact' });

    if (q) {
      // If q looks like an exact id, allow matching id or name substring
      // Use supabase or() to combine possibilities
      const escaped = q.replace(/'/g, "''");
      base = base.or(`id.eq.${escaped},full_name.ilike.%${escaped}%`);
    }

    const { data, error, count } = await base.order('full_name', { ascending: true }).range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], total: typeof count === 'number' ? count : (data ? data.length : 0) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown' }, { status: 500 });
  }
}

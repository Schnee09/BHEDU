import { NextResponse } from 'next/server';
import { createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler(
  { permission: 'system.impersonate' },
  async ({ searchParams }) => {
    const pageValue = Number(searchParams.get('page') || '1');
    const perPageValue = Number(searchParams.get('perPage') || '25');
    const page = Number.isFinite(pageValue) ? Math.max(1, Math.floor(pageValue)) : 1;
    const perPage = Number.isFinite(perPageValue)
      ? Math.min(100, Math.max(1, Math.floor(perPageValue)))
      : 25;
    const q = (searchParams.get('q') || '').trim().slice(0, 200);
    const supabase = createServiceClient();

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let base = supabase.from('profiles').select('id, full_name, role', { count: 'exact' });

    if (q) {
      // If q looks like an exact id, allow matching id or name substring
      // Use supabase or() to combine possibilities
      const escaped = q.replace(/'/g, "''");
      base = base.or(`id.eq.${escaped},full_name.ilike.%${escaped}%`);
    }

    const { data, error, count } = await base
      .order('full_name', { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: data ?? [],
      total: typeof count === 'number' ? count : (data?.length ?? 0),
    });
  }
);

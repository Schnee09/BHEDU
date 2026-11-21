/**
 * Subjects API
 *
 * GET /api/subjects  — public (with cache)
 * POST /api/subjects — admin / owner / super_admin
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { CACHE_KEYS, CACHE_TTL, cached, invalidateCache } from '@/lib/cache';
import { getAuthContext } from '@/lib/auth/guard';

// GET /api/subjects — accessible by all authenticated users
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth.profile) {
      return NextResponse.json(
        { success: false, error: auth.reason || 'Unauthorized' },
        {
          status: 401,
        }
      );
    }
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason || 'Forbidden' },
        {
          status: 403,
        }
      );
    }

    const subjects = await cached(
      CACHE_KEYS.SUBJECTS_ALL,
      async () => {
        const supabase = createClientFromRequest(req);
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name, code, description, is_active')
          .order('name');

        if (error) {
          console.warn('Subjects query error', error);
          return [];
        }

        // Deduplicate by code
        const seenCodes = new Set<string>();
        return (data || []).filter((s) => {
          const code = s.code?.toLowerCase();
          if (!code || seenCodes.has(code)) return false;
          seenCodes.add(code);
          return true;
        });
      },
      { ttl: CACHE_TTL.MEDIUM }
    );

    return NextResponse.json({ success: true, subjects });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message, subjects: [] }, { status: 200 });
  }
}

// POST /api/subjects — admin / owner / super_admin
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req, 'subjects.manage');
    if (!auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description, is_active = true } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tên hoặc mã môn học' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code: code.toUpperCase(), description: description || null, is_active })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Mã môn học đã tồn tại' },
          { status: 409 }
        );
      }
      throw error;
    }

    invalidateCache(CACHE_KEYS.SUBJECTS_ALL);
    invalidateCache('subjects:');

    return NextResponse.json({ success: true, subject: data }, { status: 201 });
  } catch (error: unknown) {
    console.error('[POST /api/subjects]', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

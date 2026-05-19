import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Public endpoint — no auth required
// Returns the latest published announcements for the landing page
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 3, 10);

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, type, published_at')
      .eq('is_published', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Announcements] DB error:', error.message);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('[Announcements] Unexpected error:', err);
    return NextResponse.json({ data: [] });
  }
}

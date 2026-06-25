import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { isAtLeast, UserRole } from '@/lib/auth/core';
import { z } from 'zod';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().optional().nullable(),
  type: z.enum(['info', 'event', 'holiday', 'urgent']).default('info'),
  is_published: z.boolean().default(true),
  expires_at: z.string().optional().nullable(),
});

async function checkAnnouncementAccess(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth.authorized || !auth.role) {
    return { authorized: false, reason: auth.reason || 'Unauthorized', auth };
  }
  // Admin and above, OR owner (who has announcements.manage) can manage announcements
  const allowedRoles = ['admin', 'owner', 'super_admin'];
  if (!isAtLeast(auth.role, 'admin') && !allowedRoles.includes(auth.role)) {
    return { authorized: false, reason: 'Insufficient permissions', auth };
  }
  return { authorized: true, auth };
}

export async function GET(request: Request) {
  try {
    const { authorized, reason, auth } = await checkAnnouncementAccess(request);
    if (!authorized) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, reason, auth } = await checkAnnouncementAccess(request);
    if (!authorized) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = announcementSchema.parse(body);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...validatedData,
        created_by: auth.profile?.id,
        published_at: validatedData.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { isAtLeast } from '@/lib/auth/core';
import { z } from 'zod';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  content: z.string().optional().nullable(),
  type: z.enum(['info', 'event', 'holiday', 'urgent']).optional(),
  is_published: z.boolean().optional(),
  expires_at: z.string().optional().nullable(),
});

async function checkAnnouncementAccess(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth.authorized || !auth.role) {
    return { authorized: false, reason: auth.reason || 'Unauthorized', auth };
  }
  // Staff and above can manage announcements
  if (!isAtLeast(auth.role, 'staff')) {
    return { authorized: false, reason: 'Insufficient permissions', auth };
  }
  return { authorized: true, auth };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, reason } = await checkAnnouncementAccess(request);
    if (!authorized) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = announcementSchema.parse(body);

    const supabase = createServiceClient();

    // Check if it exists
    const { data: existing, error: fetchError } = await supabase
      .from('announcements')
      .select('is_published')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Determine if we need to update published_at
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.is_published === true && !existing.is_published) {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, reason } = await checkAnnouncementAccess(request);
    if (!authorized) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase.from('announcements').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createGetHandler({ allowedRoles: ['parent'] }, async ({ params, user }) => {
  const { id: childId } = params as { id: string };
  const supabase = createServiceClient();

  // 1. Verify parent-student relationship is approved
  const { data: link, error: linkError } = await supabase
    .from('parent_student_links')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', childId)
    .eq('status', 'approved')
    .maybeSingle();

  if (linkError || !link) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // 2. Fetch today's attendance status
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', childId)
    .eq('date', today)
    .maybeSingle();

  if (attError) {
    return NextResponse.json({ error: 'Failed to retrieve attendance' }, { status: 500 });
  }

  if (attendance) {
    return apiSuccess({
      marked: true,
      status: attendance.status,
    });
  }

  return apiSuccess({
    marked: false,
    status: 'unknown',
  });
});

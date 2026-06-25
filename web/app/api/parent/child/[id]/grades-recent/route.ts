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

  // 2. Fetch the latest 10 grades for this child
  const { data: grades, error: gradeError } = await supabase
    .from('grades')
    .select(
      `
      id,
      score,
      points_earned,
      component_type,
      created_at,
      class:classes(id, name),
      subject:subjects(id, name, code)
    `
    )
    .eq('student_id', childId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (gradeError) {
    return NextResponse.json({ error: 'Failed to retrieve grades' }, { status: 500 });
  }

  return apiSuccess(grades || []);
});

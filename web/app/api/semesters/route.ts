/**
 * Semesters API
 * GET /api/semesters - Fetch all semesters
 */

import { NextResponse } from 'next/server';
import { createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler({ requireAuth: true }, async () => {
  const supabase = createServiceClient();

  const { data: semesters, error } = await supabase
    .from('semesters')
    .select('id, name, code, start_date, end_date, is_active')
    .order('start_date', { ascending: false });

  if (error) throw error;

  return NextResponse.json({ success: true, semesters: semesters || [] });
});

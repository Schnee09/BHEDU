import { NextResponse } from 'next/server';
import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { ReportsRepository } from '@/lib/repositories/ReportsRepository';
import { transcriptQuerySchema } from '@/lib/schemas';
import { canAccessStudent } from '@/lib/auth/classAccess';

import { validateQuery } from '@/lib/api/validation';

/**
 * GET /api/reports/transcript
 * Generates complete transcript data for a student
 */
export const GET = createGetHandler(
  {
    requireAuth: true,
  },
  async ({ request, user }) => {
    const query = validateQuery(request, transcriptQuerySchema);
    const { studentId, includePending, language } = query;

    const supabase = createServiceClient();
    const allowed = await canAccessStudent(supabase, { id: user.id, role: user.role }, studentId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const repository = new ReportsRepository(supabase);

    const canViewPending = ['super_admin', 'owner', 'admin', 'teacher', 'tutor'].includes(
      user.role
    );

    const transcript = await repository.getTranscript(studentId, {
      includePending: canViewPending && Boolean(includePending),
      includeRanking: true,
      language: language as 'vi' | 'en',
    });

    if (!transcript) {
      return NextResponse.json(
        {
          error: 'Student not found or transcript unavailable',
        },
        { status: 404 }
      );
    }

    return apiSuccess(transcript);
  }
);

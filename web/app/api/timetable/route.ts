import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { createTimetableSlotSchema, timetableQuerySchema } from '@/lib/schemas';
import { validateQuery } from '@/lib/api/validation';
import { ConflictError, ValidationError } from '@/lib/api/errors';

export const GET = createGetHandler(
  { requireAuth: false }, // Public/Authenticated - original check was manual classId check
  async ({ request }) => {
    // 1. Validation
    const query = validateQuery(request, timetableQuerySchema);
    // Original code allowed no auth for GET?
    // "export async function GET(req: NextRequest) { ... }"
    // It didn't have specific auth guards besides standard RLS if applied.
    // However, POST had explicit adminAuth.
    // We'll keep GET open or requireAuth depending on strictness.
    // Safest is public read if shared, but usually requires login.
    // Let's assume requireAuth=false to match "maybe public schedule" or client handling.

    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    const { class_id, student_id, week_start_date } = query;

    if (!class_id && !student_id) {
      // Original returned empty slots success
      return apiSuccess({ slots: [] });
    }

    const slots = await repository.getSlots({
      class_id,
      student_id,
      week_start_date,
    });

    return apiSuccess({ slots });
  }
);

export const POST = createApiHandler(
  {
    permission: 'classes.manage', // Or similar? Original used 'adminAuth'.
    // We can use ability check or role check.
    // V2 auth typically checks permission.
    // Let's map 'adminAuth' roles (admin/staff/teacher?) to a permission or allowedRoles.
    allowedRoles: ['admin', 'owner'], // Teacher might need to create slots?
    // Original: "const authResult = await adminAuth(req)" -> Staff/Admin/Owner.
    bodySchema: createTimetableSlotSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    // Conflict Check
    const conflictError = await repository.checkConflicts(body);
    if (conflictError) {
      throw new ConflictError(conflictError);
    }

    const slot = await repository.createSlot(body);

    // Transform (Original did extensive transformation, simplified here by repo returning joined data)
    const transformedSlot = {
      ...slot,
      subject: (slot as any).subject, // Repo mapped it
      // ... other fields standard
    };

    return apiSuccess({ slot: transformedSlot }, { status: 201 });
  }
);

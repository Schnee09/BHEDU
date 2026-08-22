import { apiSuccess } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Public School Info API
 * GET /api/public/school-info
 *
 * Returns basic school settings for public pages (landing, login)
 */
export async function GET() {
  const supabase = createServiceClient();

  // Fetch non-sensitive keys only
  const publicKeys = [
    'school_name',
    'school_logo',
    'school_address',
    'school_phone',
    'school_email',
    'academic_year_active',
  ];

  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', publicKeys);

  if (error) {
    console.error('Error fetching public school info:', error);
    // Return partial success or defaults if table doesn't exist yet
    return apiSuccess({
      school_name: 'BH-EDU Management System',
      status: 'operational',
    });
  }

  // Transform array into object
  const info = settings.reduce(
    (acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    },
    {} as Record<string, string | null>
  );

  return apiSuccess(info);
}

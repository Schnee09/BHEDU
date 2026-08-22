import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1, 'Key is required'),
        value: z.any().transform((v) => (v === null || v === undefined ? '' : String(v))),
        description: z.string().optional(),
      })
    )
    .min(1, 'Settings must be an array with at least one item'),
});

/**
 * School Settings API
 * GET /api/admin/settings - Get all settings
 * PUT /api/admin/settings - Update settings
 */

export const GET = createGetHandler({ allowedRoles: ['admin', 'super_admin'] }, async () => {
  const supabase = createServiceClient();

  const { data: settings, error } = await supabase.from('settings').select('*').order('key');

  if (error) {
    console.error('Error fetching settings:', error);
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  return apiSuccess(settings);
});

export const PUT = createApiHandler(
  {
    allowedRoles: ['admin', 'super_admin'],
    bodySchema: updateSettingsSchema,
  },
  async ({ body, user }) => {
    const { settings } = body;

    const supabase = createServiceClient();
    const results = [];

    // Update or insert each setting
    for (const setting of settings) {
      const { key, value } = setting;
      const category = (key === 'academic_year' || key === 'semester' || key === 'grading_scale') ? 'academic' : 'school';

      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key,
            value,
            category,
            is_public: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.error(`Error updating setting ${key}:`, error);
        results.push({ key, success: false, error: error.message });
      } else {
        results.push({ key, success: true });
      }
    }

    // Log activity (optional, non-fatal)
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_role: user.role,
          action: 'UPDATE_SETTINGS',
          resource_type: 'SCHOOL_SETTINGS',
          metadata: { updated_settings: settings.map((s) => s.key) },
        });
    } catch (auditError) {
      console.warn('Audit log error (non-fatal):', auditError);
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;

    return apiSuccess(results, {
      message: `Updated ${successCount} settings${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
    });
  }
);

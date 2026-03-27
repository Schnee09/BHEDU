import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * School Settings API
 * GET /api/admin/settings - Get all settings
 * PUT /api/admin/settings - Update settings
 */

export const GET = createGetHandler({ allowedRoles: ['admin', 'super_admin'] }, async () => {
  const supabase = createServiceClient();

  const { data: settings, error } = await supabase.from('school_settings').select('*').order('key');

  if (error) {
    console.error('Error fetching settings:', error);
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  return apiSuccess(settings);
});

export const PUT = createApiHandler(
  { allowedRoles: ['admin', 'super_admin'] },
  async ({ body, user }) => {
    const { settings } = body as { settings: Array<{ key: string; value: string }> };

    if (!Array.isArray(settings) || settings.length === 0) {
      throw new Error('Settings must be an array with at least one item');
    }

    const supabase = createServiceClient();
    const results = [];

    // Update each setting
    for (const setting of settings) {
      const { key, value } = setting;

      const { error } = await supabase
        .from('school_settings')
        .update({
          value,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key);

      if (error) {
        console.error(`Error updating setting ${key}:`, error);
        results.push({ key, success: false, error: error.message });
      } else {
        results.push({ key, success: true });
      }
    }

    // Log activity (optional, but keep for consistency)
    try {
      await supabase
        .from('audit_logs') // Using the centralized audit_logs table
        .insert({
          user_id: user.id,
          action: 'UPDATE_SETTINGS',
          entity_type: 'SCHOOL_SETTINGS',
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

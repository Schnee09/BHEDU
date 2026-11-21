import { apiSuccess, createApiHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const POST = createApiHandler(
  {
    permission: 'system.database',
    // No body schema required
  },
  async () => {
    const supabase = createServiceClient();

    // Call the RPC function created in migration
    const { error } = await supabase.rpc('refresh_performance_views');

    if (error) {
      throw error;
    }

    return apiSuccess({ message: 'Performance views execution started' });
  }
);

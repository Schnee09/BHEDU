import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/repositories/UserRepository';

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
export const GET = createGetHandler({ permission: 'users.view' }, async () => {
  const supabase = createServiceClient();
  const repository = new UserRepository(supabase);
  const stats = await repository.getStatistics();

  return apiSuccess(stats);
});

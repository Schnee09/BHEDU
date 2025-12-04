/**
 * useUser Hook - Current user state management
 * 
 * Provides access to current logged-in user across components
 * Eliminates duplicate user fetching code
 */

import { useState, useEffect, useCallback } from 'react';
import { createClientFromRequest } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  is_active: boolean;
  avatar_url?: string;
  phone?: string;
  department?: string;
  student_id?: string;
  grade_level?: string;
}

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to get current user information
 * 
 * @example
 * const { user, isAdmin, loading } = useUser();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (!user) return <Login />;
 * if (!isAdmin) return <Unauthorized />;
 * 
 * return <AdminDashboard user={user} />;
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // This would need to be adapted for client-side
      // For now, we'll use a client-side approach
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        logger.info('User fetched', { userId: data.user.id });
      } else {
        throw new Error(data.error || 'Failed to fetch user');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMsg);
      logger.error('Error fetching user', { error: errorMsg });
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return {
    user,
    loading,
    error,
    isAdmin,
    isTeacher,
    isStudent,
    refetch: fetchUser,
  };
}

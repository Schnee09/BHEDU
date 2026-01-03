/**
 * useUser Hook - Current user state management
 * 
 * Provides access to current logged-in user across components
 * Eliminates duplicate user fetching code
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

type UserRole = 'admin' | 'teacher' | 'student' | 'staff';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
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
  isStaff: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  /** Returns true if user is admin or staff (has admin-level access) */
  hasAdminAccess: boolean;
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
  const hasFetchedRef = useRef(false);

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
      logger.error('Error fetching user', new Error(errorMsg));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUser();
    }
  }, [fetchUser]);

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const hasAdminAccess = isAdmin || isStaff;

  return {
    user,
    loading,
    error,
    isAdmin,
    isStaff,
    isTeacher,
    isStudent,
    hasAdminAccess,
    refetch: fetchUser,
  };
}

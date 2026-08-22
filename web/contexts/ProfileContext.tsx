'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/auth/core';

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  photo_url?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  personal_email?: string | null;
  created_at?: string;
};

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/profile', {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[ProfileProvider] Unauthorized, clearing session...');
          await supabase.auth.signOut();
          setProfile(null);
          return;
        }

        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Could not parse error JSON' };
        }

        console.error(
          `[ProfileProvider] Error fetching profile (Status ${response.status}):`,
          errorData
        );
        return;
      }

      const data = await response.json();

      if (data) {
        const photoUrl =
          data.photo_url ||
          session.user.user_metadata?.photo_url ||
          session.user.user_metadata?.avatar_url ||
          null;

        const resolvedProfile: Profile = {
          ...data,
          photo_url: photoUrl,
          avatar_url: photoUrl,
        };
        setProfile(resolvedProfile);
      }
    } catch (err) {
      console.error('[ProfileProvider] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

// Hook that uses the context - should only be called within ProfileProvider
export function useProfileContext(): ProfileContextType {
  return useContext(ProfileContext);
}

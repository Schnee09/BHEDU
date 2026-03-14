"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { UserRole } from "@/lib/auth/core";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
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
  refreshProfile: async () => { }
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        console.log('[ProfileProvider] No session found');
        setProfile(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/profile');

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[ProfileProvider] Unauthorized, clearing session...');
          await supabase.auth.signOut();
          setProfile(null);
          return;
        }
        const errorData = await response.json();
        console.error('[ProfileProvider] Error fetching profile:', errorData);
        return;
      }

      const data = await response.json();

      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('[ProfileProvider] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
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

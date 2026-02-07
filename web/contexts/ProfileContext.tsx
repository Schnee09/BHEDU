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

      // Try user_id first (preferred link to auth.users)
      let { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, first_name, last_name, role, email, phone, address, date_of_birth, personal_email")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Fallback to id (some legacy records might use id = user_id)
      if (!data && !error) {
        const result = await supabase
          .from("profiles")
          .select("id, user_id, full_name, first_name, last_name, role, email, phone, address, date_of_birth, personal_email")
          .eq("id", session.user.id)
          .maybeSingle();

        data = result.data;
        error = result.error;
      }

      if (data) {
        setProfile(data as Profile);
      } else if (error) {
        console.error('[ProfileProvider] Error fetching profile:', error);
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

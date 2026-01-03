"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type UserRole = 'admin' | 'teacher' | 'student' | 'staff';

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
};

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({ profile: null, loading: true });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        console.log('[ProfileProvider] No session found');
        setLoading(false);
        return;
      }

      // Try user_id first
      let { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, email, phone, address, date_of_birth, user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // If not found by user_id, try by id
      if (!data && !error) {
        const result = await supabase
          .from("profiles")
          .select("id, full_name, role, email, phone, address, date_of_birth, user_id")
          .eq("id", session.user.id)
          .maybeSingle();

        data = result.data;
        error = result.error;
      }

      if (!error && data) {
        console.log('[ProfileProvider] Profile loaded:', { role: data.role, id: data.id });
        setProfile(data);
      } else {
        console.error('[ProfileProvider] Failed to fetch profile:', error);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

// Hook that uses the context - should only be called within ProfileProvider
export function useProfileContext(): ProfileContextType {
  return useContext(ProfileContext);
}

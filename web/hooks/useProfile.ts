"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  role: "admin" | "teacher" | "student";
  avatar_url?: string | null;
 email?: string | null;
 phone?: string | null;
 address?: string | null;
 date_of_birth?: string | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('[useProfile] Session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      if (!session?.user) {
        console.log('[useProfile] No session found');
        setLoading(false);
        return;
      }

      // Try user_id first
      let { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url, email, phone, address, date_of_birth, user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      console.log('[useProfile] Query by user_id result:', {
        hasData: !!data,
        error: error?.message || null,
        errorCode: error?.code || null,
        errorDetails: error?.details || null,
        data: data
      });

      // If not found by user_id, try by id
      if (!data && !error) {
        const result = await supabase
          .from("profiles")
          .select("id, full_name, role, avatar_url, email, phone, address, date_of_birth, user_id")
          .eq("id", session.user.id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;

        console.log('[useProfile] Query by id result:', {
          hasData: !!data,
          error: error?.message || null,
          data: data
        });
      }

      if (!error && data) {
        console.log('[useProfile] Profile found:', data);
        setProfile(data);
      } else {
        console.error('[useProfile] Failed to fetch profile:', error);
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}

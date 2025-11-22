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
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url, email, phone, address, date_of_birth")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!error && data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}

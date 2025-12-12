"use client";

import { useProfileContext, Profile } from "@/contexts/ProfileContext";

// Re-export Profile type for convenience
export type { Profile };

/**
 * Hook to get the current user's profile
 * Uses ProfileContext from the dashboard layout
 * 
 * @returns { profile, loading } - The user's profile and loading state
 */
export function useProfile() {
  return useProfileContext();
}

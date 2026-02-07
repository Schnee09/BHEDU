/**
 * Teacher Service - Business logic for teacher and tutor management
 *
 * MIGRATED TO INSTANCE-BASED (Phase 2/Architecture v5.0)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CreateUserInput, UpdateUserInput } from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface TeacherProfile {
    id: string;
    profile_id: string;
    teacher_type: "full_time" | "part_time" | "tutor";
    department?: string;
    specialization?: string;
    teaching_subjects?: string[];
    hourly_rate?: number;
    bio?: string;
    created_at: string;
    updated_at: string;
}

export class TeacherService {
    private supabase: SupabaseClient;

    constructor(supabase?: SupabaseClient) {
        this.supabase = supabase || createServiceClient();
    }

    /**
     * Syncs teacher_profile data for a profile
     */
    async syncTeacherProfile(profileId: string, data: Partial<TeacherProfile>) {
        const { error } = await this.supabase
            .from("teacher_profiles")
            .upsert({
                profile_id: profileId,
                teacher_type: data.teacher_type || "full_time",
                department: data.department,
                specialization: data.specialization,
                hourly_rate: data.hourly_rate,
                updated_at: new Date().toISOString(),
            }, { onConflict: "profile_id" });

        if (error) {
            console.error("Failed to sync teacher profile:", error);
            throw new Error("Failed to sync teacher details");
        }
    }

    /**
     * Gets a teacher profile by profile_id
     */
    async getTeacherProfile(profileId: string): Promise<TeacherProfile | null> {
        const { data, error } = await this.supabase
            .from("teacher_profiles")
            .select("*")
            .eq("profile_id", profileId)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Error fetching teacher profile:", error);
            throw error;
        }

        return data;
    }

    /**
     * Lists tutors with their profiles and teacher details
     */
    async getTutors(filters?: { search?: string }) {
        let query = this.supabase
            .from("profiles")
            .select(`
                id,
                full_name,
                email,
                phone,
                photo_url,
                teacher_profiles!teacher_profiles_profile_id_fkey!inner (
                    teacher_type,
                    specialization,
                    teaching_subjects,
                    hourly_rate,
                    bio
                )
            `)
            .eq("role", "teacher")
            .eq("teacher_profiles.teacher_type", "tutor");

        if (filters?.search) {
            query = query.or(
                `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
            );
        }

        const { data, error } = await query.order("full_name");

        if (error) {
            throw error;
        }

        // Transform to flat format for UI
        return (data || []).map((item: any) => ({
            id: item.id,
            full_name: item.full_name,
            email: item.email,
            phone: item.phone,
            photo_url: item.photo_url,
            teacher_type: item.teacher_profiles?.teacher_type,
            specialization: item.teacher_profiles?.specialization,
            teaching_subjects: item.teacher_profiles?.teaching_subjects || [],
            hourly_rate: item.teacher_profiles?.hourly_rate,
            bio: item.teacher_profiles?.bio,
        }));
    }

    /**
     * Creates a new tutor (profile + teacher_profile)
     */
    async createTutor(input: any) {
        // Create base profile
        const { data: profile, error: profileError } = await this.supabase
            .from("profiles")
            .insert({
                full_name: input.full_name,
                email: input.email || null,
                phone: input.phone || null,
                role: "teacher",
                is_active: true,
            })
            .select()
            .single();

        if (profileError) {
            throw profileError;
        }

        // Create teacher profile
        const { error: teacherError } = await this.supabase
            .from("teacher_profiles")
            .insert({
                profile_id: profile.id,
                teacher_type: "tutor",
                specialization: input.specialization || null,
                teaching_subjects: input.teaching_subjects || [],
                hourly_rate: input.hourly_rate || null,
                bio: input.bio || null,
            });

        if (teacherError) {
            // Rollback
            await this.supabase.from("profiles").delete().eq("id", profile.id);
            throw teacherError;
        }

        return {
            ...profile,
            teacher_type: "tutor",
            specialization: input.specialization,
            teaching_subjects: input.teaching_subjects,
        };
    }

    // ============================================================
    // STATIC METHODS FOR BACKWARD COMPATIBILITY
    // ============================================================

    static async syncTeacherProfile(
        profileId: string,
        data: Partial<TeacherProfile>,
    ) {
        return teacherService.syncTeacherProfile(profileId, data);
    }

    static async getTeacherProfile(profileId: string) {
        return teacherService.getTeacherProfile(profileId);
    }
}

// Default singleton instance
export const teacherService = new TeacherService();

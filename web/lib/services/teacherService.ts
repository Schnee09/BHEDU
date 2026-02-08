import { createServiceClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CreateUserInput, UpdateUserInput } from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TeacherRepository } from "../repositories/TeacherRepository";

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
    private repository: TeacherRepository;

    constructor(supabase?: SupabaseClient) {
        this.supabase = supabase || createServiceClient();
        this.repository = new TeacherRepository(this.supabase);
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
        return this.getTeacherProfileByProfileId(profileId);
    }

    /**
     * Helper to get teacher profile
     */
    private async getTeacherProfileByProfileId(
        profileId: string,
    ): Promise<TeacherProfile | null> {
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
     * Lists teachers with their profiles and class counts
     */
    async getTeachersWithStats(filters: {
        search?: string;
        include_staff?: boolean;
        teacher_type?: "full_time" | "part_time" | "tutor" | "all";
        page?: number;
        limit?: number;
    } = {}) {
        return this.repository.findTeachersWithStats(filters);
    }

    /**
     * Lists tutors with their profiles and teacher details
     */
    async getTutors(filters?: { search?: string }) {
        // Tutors are just a type of teacher, the repository can handle this or specialized query
        const result = await this.repository.findTeachersWithStats({
            search: filters?.search,
            teacher_type: "tutor",
            limit: 100,
        });

        return result.data.map((item) => ({
            id: item.id,
            full_name: item.full_name,
            email: item.email,
            phone: item.phone,
            photo_url: (item as any).photo_url,
            teacher_type: item.teacher_type,
            specialization: item.specialization,
            teaching_subjects: (item as any).teaching_subjects || [],
            hourly_rate: item.hourly_rate,
            bio: (item as any).bio,
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

    static async getTeachersWithStats(filters: any) {
        return teacherService.getTeachersWithStats(filters);
    }
}

// Default singleton instance
export const teacherService = new TeacherService();

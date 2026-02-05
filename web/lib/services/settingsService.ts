/**
 * Settings Service - Business logic for system settings and global data
 *
 * Architecture v5.0 (Instance-based)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/api/errors";
import { CACHE_KEYS, CACHE_TTL, cached } from "@/lib/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AcademicYear {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export class SettingsService {
    private supabase: SupabaseClient;

    constructor(supabase?: SupabaseClient) {
        this.supabase = supabase || createServiceClient();
    }

    /**
     * Retrieves all academic years (cached)
     */
    async getAcademicYears() {
        return cached(
            CACHE_KEYS.ACADEMIC_YEARS_ALL,
            async () => {
                const { data, error } = await this.supabase
                    .from("academic_years")
                    .select("*")
                    .order("start_date", { ascending: false });

                if (error) {
                    throw error;
                }

                return data || [];
            },
            { ttl: CACHE_TTL.LONG },
        );
    }

    /**
     * Retrieves the current (active) academic year
     */
    async getCurrentAcademicYear(): Promise<AcademicYear> {
        const { data, error } = await this.supabase
            .from("academic_years")
            .select("*")
            .eq("is_current", true)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new NotFoundError("Không tìm thấy năm học hiện tại");

        return data as AcademicYear;
    }
}

export const settingsService = new SettingsService();

/**
 * Fee Type Repository
 *
 * Handles all database operations for fee types.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, type PaginatedResult } from "./base";
import { CreateFeeTypeInput } from "@/lib/schemas";

export interface FeeType {
    id: string;
    name: string;
    description: string | null;
    default_amount: number;
    is_mandatory: boolean;
    applies_to: string;
    academic_year_id: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export class FeeTypeRepository extends BaseRepository<
    FeeType,
    CreateFeeTypeInput,
    Partial<CreateFeeTypeInput>
> {
    protected readonly tableName = "fee_types";
    protected readonly primaryKey = "id";

    constructor(supabase: SupabaseClient) {
        super(supabase);
    }

    /**
     * Find all with optional filters
     */
    async findAllFiltered(
        filters: { is_active?: boolean; academic_year_id?: string },
    ): Promise<FeeType[]> {
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .order("name", { ascending: true });

        if (filters.is_active !== undefined) {
            query = query.eq("is_active", filters.is_active);
        }

        if (filters.academic_year_id) {
            query = query.eq("academic_year_id", filters.academic_year_id);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch fee types: ${error.message}`);
        }

        return (data || []) as FeeType[];
    }
}

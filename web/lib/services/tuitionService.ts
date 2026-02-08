/**
 * Tuition Service - Calculate and manage tuition fees
 *
 * MIGRATED TO INSTANCE-BASED (Phase 2)
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface TuitionRate {
  id: string;
  classType: "group" | "tutoring";
  sessionsPerWeek: number;
  monthlyFee: number;
  description: string | null;
  isActive: boolean;
}

export interface ClassTuitionInfo {
  classId: string;
  className: string;
  classType: "group" | "tutoring";
  sessionsPerWeek: number;
  monthlyFee: number;
}

export class TuitionService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Set the Supabase client (primarily for testing)
   */
  public setSupabase(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getTuitionRates(): Promise<TuitionRate[]> {
    const { data, error } = await this.supabase
      .from("tuition_config")
      .select("*")
      .eq("is_active", true)
      .order("class_type")
      .order("sessions_per_week");

    if (error) {
      console.error("Failed to fetch tuition rates:", error);
      throw new Error("Failed to fetch tuition rates");
    }

    return (data || []).map((row) => ({
      id: row.id,
      classType: row.class_type as "group" | "tutoring",
      sessionsPerWeek: row.sessions_per_week,
      monthlyFee: row.monthly_fee,
      description: row.description,
      isActive: row.is_active,
    }));
  }

  async getClassTuition(classId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("classes")
      .select(`id, name, class_type, sessions_per_week`)
      .eq("id", classId)
      .single();

    if (error || !data) {
      console.error("Class not found:", error);
      return 0;
    }

    const { data: rateData } = await this.supabase
      .from("tuition_config")
      .select("monthly_fee")
      .eq("class_type", data.class_type || "group")
      .eq("sessions_per_week", data.sessions_per_week || 2)
      .eq("is_active", true)
      .single();

    return rateData?.monthly_fee || 0;
  }

  async calculateStudentTuition(studentId: string): Promise<{
    totalMonthly: number;
    classes: ClassTuitionInfo[];
  }> {
    const { data: enrollments, error } = await this.supabase
      .from("enrollments")
      .select(`
        class:classes (
          id,
          name,
          class_type,
          sessions_per_week
        )
      `)
      .eq("student_id", studentId)
      .eq("status", "active");

    if (error) {
      console.error("Failed to fetch enrollments:", error);
      throw new Error("Failed to calculate tuition");
    }

    const rates = await this.getTuitionRates();

    const classes: ClassTuitionInfo[] = [];
    let totalMonthly = 0;

    for (const enrollment of enrollments || []) {
      const classData = enrollment.class as unknown as {
        id: string;
        name: string;
        class_type: string | null;
        sessions_per_week: number | null;
      };

      if (!classData) continue;

      const classType = (classData.class_type || "group") as
        | "group"
        | "tutoring";
      const sessionsPerWeek = classData.sessions_per_week || 2;

      const rate = rates.find(
        (r) =>
          r.classType === classType && r.sessionsPerWeek === sessionsPerWeek,
      );

      const monthlyFee = rate?.monthlyFee || 0;
      totalMonthly += monthlyFee;

      classes.push({
        classId: classData.id,
        className: classData.name,
        classType,
        sessionsPerWeek,
        monthlyFee,
      });
    }

    return { totalMonthly, classes };
  }

  async getTuitionRate(
    classType: "group" | "tutoring",
    sessionsPerWeek: number,
  ): Promise<number> {
    const { data } = await this.supabase
      .from("tuition_config")
      .select("monthly_fee")
      .eq("class_type", classType)
      .eq("sessions_per_week", sessionsPerWeek)
      .eq("is_active", true)
      .single();

    return data?.monthly_fee || 0;
  }

  async updateTuitionRate(
    classType: "group" | "tutoring",
    sessionsPerWeek: number,
    monthlyFee: number,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("tuition_config")
      .update({
        monthly_fee: monthlyFee,
        updated_at: new Date().toISOString(),
      })
      .eq("class_type", classType)
      .eq("sessions_per_week", sessionsPerWeek);

    if (error) {
      console.error("Failed to update tuition rate:", error);
      throw new Error("Failed to update tuition rate");
    }
  }

  // ============================================================
  // STATIC METHODS FOR BACKWARD COMPATIBILITY
  // ============================================================

  static async getTuitionRates() {
    return tuitionService.getTuitionRates();
  }

  static async getClassTuition(classId: string) {
    return tuitionService.getClassTuition(classId);
  }

  static async calculateStudentTuition(studentId: string) {
    return tuitionService.calculateStudentTuition(studentId);
  }

  static async getTuitionRate(
    classType: "group" | "tutoring",
    sessionsPerWeek: number,
  ) {
    return tuitionService.getTuitionRate(classType, sessionsPerWeek);
  }

  static async updateTuitionRate(
    classType: "group" | "tutoring",
    sessionsPerWeek: number,
    monthlyFee: number,
  ) {
    return tuitionService.updateTuitionRate(
      classType,
      sessionsPerWeek,
      monthlyFee,
    );
  }
}

// Default singleton instance
export const tuitionService = new TuitionService();

/**
 * Default tuition rates based on business rules
 */
export const DEFAULT_TUITION_RATES = {
  group: {
    2: 800000,
    3: 1200000,
  },
  tutoring: {
    2: 1200000,
    3: 1800000,
  },
} as const;

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

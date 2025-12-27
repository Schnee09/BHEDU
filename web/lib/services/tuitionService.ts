/**
 * Tuition Service - Calculate and manage tuition fees
 */

import { createClient } from '@/lib/supabase/server';

export interface TuitionRate {
  id: string;
  classType: 'group' | 'tutoring';
  sessionsPerWeek: number;
  monthlyFee: number;
  description: string | null;
  isActive: boolean;
}

export interface ClassTuitionInfo {
  classId: string;
  className: string;
  classType: 'group' | 'tutoring';
  sessionsPerWeek: number;
  monthlyFee: number;
}

export class TuitionService {
  /**
   * Get all active tuition rates
   */
  static async getTuitionRates(): Promise<TuitionRate[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tuition_config')
      .select('*')
      .eq('is_active', true)
      .order('class_type')
      .order('sessions_per_week');

    if (error) {
      console.error('Failed to fetch tuition rates:', error);
      throw new Error('Failed to fetch tuition rates');
    }

    return (data || []).map((row) => ({
      id: row.id,
      classType: row.class_type as 'group' | 'tutoring',
      sessionsPerWeek: row.sessions_per_week,
      monthlyFee: row.monthly_fee,
      description: row.description,
      isActive: row.is_active,
    }));
  }

  /**
   * Get tuition fee for a specific class
   */
  static async getClassTuition(classId: string): Promise<number> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        class_type,
        sessions_per_week
      `)
      .eq('id', classId)
      .single();

    if (error || !data) {
      console.error('Class not found:', error);
      return 0;
    }

    // Get matching tuition rate
    const { data: rateData } = await supabase
      .from('tuition_config')
      .select('monthly_fee')
      .eq('class_type', data.class_type || 'group')
      .eq('sessions_per_week', data.sessions_per_week || 2)
      .eq('is_active', true)
      .single();

    return rateData?.monthly_fee || 0;
  }

  /**
   * Calculate total tuition for a student based on enrolled classes
   */
  static async calculateStudentTuition(studentId: string): Promise<{
    totalMonthly: number;
    classes: ClassTuitionInfo[];
  }> {
    const supabase = await createClient();

    // Get all active enrollments with class details
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        class:classes (
          id,
          name,
          class_type,
          sessions_per_week
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) {
      console.error('Failed to fetch enrollments:', error);
      throw new Error('Failed to calculate tuition');
    }

    // Get all active tuition rates
    const rates = await this.getTuitionRates();

    // Calculate tuition for each class
    const classes: ClassTuitionInfo[] = [];
    let totalMonthly = 0;

    for (const enrollment of enrollments || []) {
      const classData = enrollment.class as {
        id: string;
        name: string;
        class_type: string | null;
        sessions_per_week: number | null;
      };

      if (!classData) continue;

      const classType = (classData.class_type || 'group') as 'group' | 'tutoring';
      const sessionsPerWeek = classData.sessions_per_week || 2;

      // Find matching rate
      const rate = rates.find(
        (r) => r.classType === classType && r.sessionsPerWeek === sessionsPerWeek
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

  /**
   * Get tuition rate by class type and sessions
   */
  static async getTuitionRate(
    classType: 'group' | 'tutoring',
    sessionsPerWeek: number
  ): Promise<number> {
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('tuition_config')
      .select('monthly_fee')
      .eq('class_type', classType)
      .eq('sessions_per_week', sessionsPerWeek)
      .eq('is_active', true)
      .single();

    return data?.monthly_fee || 0;
  }

  /**
   * Update tuition rate (admin only)
   */
  static async updateTuitionRate(
    classType: 'group' | 'tutoring',
    sessionsPerWeek: number,
    monthlyFee: number
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('tuition_config')
      .update({ 
        monthly_fee: monthlyFee,
        updated_at: new Date().toISOString()
      })
      .eq('class_type', classType)
      .eq('sessions_per_week', sessionsPerWeek);

    if (error) {
      console.error('Failed to update tuition rate:', error);
      throw new Error('Failed to update tuition rate');
    }
  }
}

/**
 * Default tuition rates based on business rules
 */
export const DEFAULT_TUITION_RATES = {
  group: {
    2: 800000,    // Lớp nhóm 2 buổi/tuần
    3: 1200000,   // Lớp nhóm 3 buổi/tuần
  },
  tutoring: {
    2: 1200000,   // Kèm gia sư 2 buổi/tuần
    3: 1800000,   // Kèm gia sư 3 buổi/tuần
  },
} as const;

/**
 * Format currency in VND
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

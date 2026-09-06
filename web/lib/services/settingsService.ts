/**
 * Settings Service - Business logic for system settings and global academic context
 *
 * Architecture v5.0 (Instance-based)
 */

import { createServiceClient } from '@/lib/supabase/server';
import { CACHE_KEYS, CACHE_TTL, cached } from '@/lib/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Semester {
  id: string;
  name: string;
  code: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface AcademicContext {
  academicYear: AcademicYear;
  semester: Semester;
}

export class SettingsService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Retrieves all academic years (cached)
   */
  async getAcademicYears(): Promise<AcademicYear[]> {
    return cached(
      CACHE_KEYS.ACADEMIC_YEARS_ALL,
      async () => {
        const { data, error } = await this.supabase
          .from('academic_years')
          .select('*')
          .order('start_date', { ascending: false });

        if (error) {
          console.error('Error fetching academic years:', error);
          return [];
        }

        return data || [];
      },
      { ttl: CACHE_TTL.LONG }
    );
  }

  /**
   * Retrieves the current (active) academic year
   */
  async getCurrentAcademicYear(): Promise<AcademicYear> {
    return cached(
      CACHE_KEYS.ACADEMIC_YEARS_CURRENT,
      async () => {
        // 1. Try is_current = true
        const { data, error } = await this.supabase
          .from('academic_years')
          .select('*')
          .eq('is_current', true)
          .maybeSingle();

        if (!error && data) {
          return data as AcademicYear;
        }

        // 2. Fallback to latest start_date
        const { data: latest } = await this.supabase
          .from('academic_years')
          .select('*')
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest) {
          return latest as AcademicYear;
        }

        // 3. Fallback default
        return {
          id: 'default-ay',
          name: '2026-2027',
          start_date: '2026-06-01',
          end_date: '2027-05-31',
          is_current: true,
        };
      },
      { ttl: CACHE_TTL.MEDIUM }
    );
  }

  /**
   * Retrieves all semesters (cached)
   */
  async getSemesters(): Promise<Semester[]> {
    return cached(
      CACHE_KEYS.SEMESTERS_ALL,
      async () => {
        const { data, error } = await this.supabase
          .from('semesters')
          .select('*')
          .is('deleted_at', null)
          .order('start_date', { ascending: false });

        if (error) {
          console.error('Error fetching semesters:', error);
          return [];
        }

        return (data as Semester[]) || [];
      },
      { ttl: CACHE_TTL.LONG }
    );
  }

  /**
   * Retrieves the active semester (is_active = true)
   */
  async getActiveSemester(): Promise<Semester> {
    return cached(
      CACHE_KEYS.SEMESTER_ACTIVE,
      async () => {
        // 1. Query active semester from semesters table
        const { data, error } = await this.supabase
          .from('semesters')
          .select('*')
          .eq('is_active', true)
          .is('deleted_at', null)
          .maybeSingle();

        if (!error && data) {
          return data as Semester;
        }

        // 2. Fallback from settings table
        const { data: setting } = await this.supabase
          .from('settings')
          .select('value')
          .eq('key', 'semester')
          .maybeSingle();

        const semesterVal = setting?.value || 'HK1';
        const isHK2 = semesterVal.includes('2') || semesterVal.includes('HK2');

        return {
          id: isHK2 ? 'sem-hk2' : 'sem-hk1',
          name: isHK2 ? 'Học kỳ 2 (HK2)' : 'Học kỳ 1 (HK1)',
          code: isHK2 ? 'HK2' : 'HK1',
          is_active: true,
        };
      },
      { ttl: CACHE_TTL.MEDIUM }
    );
  }

  /**
   * Retrieves the full active academic context (Year + Semester)
   */
  async getAcademicContext(): Promise<AcademicContext> {
    const [academicYear, semester] = await Promise.all([
      this.getCurrentAcademicYear(),
      this.getActiveSemester(),
    ]);

    return { academicYear, semester };
  }
}

export const settingsService = new SettingsService();

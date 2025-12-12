/**
 * Dashboard Statistics API
 * GET /api/dashboard/stats
 * 
 * Returns aggregate statistics for the dashboard
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { hasAdminAccess } from '@/lib/auth/permissions'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service client to bypass RLS for counting
    const supabase = createServiceClient()
    // Admin and Staff see all, teachers see their own
    const canSeeAll = hasAdminAccess(authResult.userRole || '')

    try {
      const today = new Date().toISOString().split('T')[0]

      // Execute all count queries in parallel
      const [
        studentsResult,
        teachersResult,
        classesResult,
        assignmentsResult,
        attendanceResult,
      ] = await Promise.all([
        // Count total students (from profiles table with role filter)
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student"),

        // Count total teachers (from profiles table with role filter)
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "teacher"),

        // Count classes (all for admin/staff, own for teacher)
        canSeeAll
          ? supabase.from("classes").select("id", { count: "exact", head: true })
          : supabase.from("classes").select("id", { count: "exact", head: true }).eq("teacher_id", authResult.userId),

        // Count assignments (all for admin/staff, from teacher's classes for teacher)
        canSeeAll
          ? supabase.from("assignments").select("id", { count: "exact", head: true })
          : (async () => {
              // Get teacher's class IDs first
              const { data: userClasses } = await supabase
                .from("classes")
                .select("id")
                .eq("teacher_id", authResult.userId);
              
              const classIds = userClasses?.map(c => c.id) || [];
              if (classIds.length === 0) {
                return { count: 0, error: null };
              }
              
              return supabase
                .from("assignments")
                .select("id", { count: "exact", head: true })
                .in("class_id", classIds);
            })(),

        // Count today's attendance records
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("date", today),
      ]);

      // Log any errors
      if (studentsResult.error) {
        logger.error("Error fetching students count", studentsResult.error);
      }
      if (teachersResult.error) {
        logger.error("Error fetching teachers count", teachersResult.error);
      }
      if (classesResult.error) {
        logger.error("Error fetching classes count", classesResult.error);
      }
      if (assignmentsResult.error) {
        logger.error("Error fetching assignments count", assignmentsResult.error);
      }
      if (attendanceResult.error) {
        logger.error("Error fetching attendance count", attendanceResult.error);
      }

      const stats = {
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalAssignments: assignmentsResult.count || 0,
        attendanceToday: attendanceResult.count || 0,
      };

      logger.info("Dashboard stats retrieved", {
        user_id: authResult.userId,
        role: authResult.userRole,
        stats,
      });

      return NextResponse.json(stats);

    } catch (error: any) {
      logger.error('Error fetching dashboard stats:', error);
      return NextResponse.json(
        { error: 'Error fetching statistics', details: error.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    logger.error('Error in GET /api/dashboard/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Students API
 * GET/POST /api/admin/students
 * 
 * Manage student records
 * Updated: 2025-12-05
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'
import { handleApiError } from '@/lib/api/errors';
import { validateQuery } from '@/lib/api/validation';
import { createStudentSchema, studentQuerySchema } from '@/lib/schemas/students';
import { logger } from '@/lib/logger';
import { generateStudentCode } from '@/lib/students/studentCode';

// Per-request supabase client will be selected via getDataClient(request)

/**
 * GET /api/admin/students
 * Fetch all students with optional filtering, pagination, and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getDataClient(request)
    // Validate query parameters
    const queryParams = validateQuery(request, studentQuerySchema);
    
    const search = queryParams.search || "";
    const classId = queryParams.class_id;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 50;
    const offset = (page - 1) * limit;

    // Build base query
    let countQuery = supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student");

    let dataQuery = supabase
      .from("profiles")
      .select("id, user_id, email, full_name, role, phone, address, date_of_birth, student_code, grade_level, gender, status, is_active, photo_url, enrollment_date, notes, department, created_at, updated_at")
      .eq("role", "student")
      .order("full_name", { ascending: true });

    // Apply search filter
    if (search) {
      const searchFilter = `full_name.ilike.%${search}%,email.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // If filtering by class, join with enrollments
    if (classId) {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", classId)
        .eq("status", "active");

      if (enrollError) throw enrollError;

      const studentIds = enrollments.map((e) => e.student_id);
      if (studentIds.length > 0) {
        countQuery = countQuery.in("id", studentIds);
        dataQuery = dataQuery.in("id", studentIds);
      } else {
        // No students in this class
        return NextResponse.json({
          success: true,
          students: [],
          total: 0,
          statistics: {
            total_students: 0,
            active_students: 0,
            inactive_students: 0,
            by_grade: {},
          },
        });
      }
    }

    // Get total count
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Apply pagination to data query
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Get paginated data
    const { data, error } = await dataQuery;
    if (error) throw error;

    // Calculate statistics (only if no search/filter applied for performance)
    let statistics = null;
    if (!search && !classId && page === 1) {
      // Get all students for statistics with grade_level
      const { data: allStudents, error: statsError } = await supabase
        .from("profiles")
        .select("id, is_active, grade_level")
        .eq("role", "student");

      if (!statsError && allStudents) {
        // Calculate by_grade statistics
        const byGrade: Record<string, number> = {};
        let activeCount = 0;
        let inactiveCount = 0;

        allStudents.forEach((student) => {
          // Count active/inactive
          if (student.is_active !== false) {
            activeCount++;
          } else {
            inactiveCount++;
          }

          // Group by grade_level
          const gradeLevel = student.grade_level || "Chưa xác định";
          byGrade[gradeLevel] = (byGrade[gradeLevel] || 0) + 1;
        });

        statistics = {
          total_students: allStudents.length,
          active_students: activeCount,
          inactive_students: inactiveCount,
          by_grade: byGrade,
        };
      }
    }

    return NextResponse.json({
      success: true,
      students: data || [],
      total: count || 0,
      statistics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Student code generation is now handled by @/lib/students/studentCode

/**
 * POST /api/admin/students
 * Create a new student with all fields
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase: reqClient } = await getDataClient(request)
    // We need service client for auth admin operations and to bypass potential RLS on profile creation
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabaseService = createServiceClient();

    const body = await request.json();
    
    // Validate request body with schema
    const validatedData = createStudentSchema.parse(body);

    logger.info('Creating student', { email: validatedData.email, full_name: validatedData.full_name });

    // Check if email already exists (using service client to be sure)
    const { data: existingProfile } = await supabaseService
      .from("profiles")
      .select("id")
      .eq("email", validatedData.email)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    // Generate student code if not provided
    const studentCode = validatedData.student_code || (await generateStudentCode(supabaseService));

    // Check if student code already exists
    if (validatedData.student_code) {
      const { data: existingCode } = await supabaseService
        .from("profiles")
        .select("id")
        .eq("student_code", validatedData.student_code)
        .single();

      if (existingCode) {
        return NextResponse.json(
          { success: false, error: "Student code already exists" },
          { status: 400 }
        );
      }
    }

    // Create auth user first
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!"; // Strong temp password
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email: validatedData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.full_name,
        role: "student",
      },
    });

    if (authError) {
      // Handle duplicate email in auth
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { success: false, error: "Email already registered in authentication system" },
          { status: 400 }
        );
      }
      logger.error('Failed to create auth user:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }

    // Create profile with all fields
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        email: validatedData.email,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        full_name: validatedData.full_name,
        role: "student",
        student_code: studentCode,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        date_of_birth: validatedData.date_of_birth || null,
        gender: validatedData.gender || null,
        grade_level: validatedData.grade_level || null,
        photo_url: validatedData.photo_url || null,
        notes: validatedData.notes || null,
        status: validatedData.status || "active",
        is_active: validatedData.is_active !== false,
        enrollment_date: validatedData.enrollment_date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabaseService.auth.admin.deleteUser(authData.user.id);
      logger.error('Failed to create profile:', profileError);
      throw new Error(`Profile creation error: ${profileError.message}`);
    }

    logger.info('Student created successfully', { studentId: profile.id, code: studentCode });

    return NextResponse.json({
      success: true,
      data: profile,
      message: `Student created successfully with code ${studentCode}`,
      tempPassword, // Return temp password so admin can give it to student
    }, { status: 201 });
  } catch (error) {
    logger.error('Create student API error:', error);
    return handleApiError(error);
  }
}

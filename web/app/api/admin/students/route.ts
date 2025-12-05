/**
 * Students API
 * GET/POST /api/admin/students
 * 
 * Manage student records
 * Updated: 2025-12-05
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleApiError } from '@/lib/api/errors';
import { validateQuery } from '@/lib/api/validation';
import { createStudentSchema, studentQuerySchema } from '@/lib/schemas/students';
import { logger } from '@/lib/logger';

// Supabase admin client (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/students
 * Fetch all students with optional filtering, pagination, and statistics
 */
export async function GET(request: NextRequest) {
  try {
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
      // Get all students for statistics
      const { data: allStudents, error: statsError } = await supabase
        .from("profiles")
        .select("id, created_at")
        .eq("role", "student");

      if (!statsError && allStudents) {
        statistics = {
          total_students: allStudents.length,
          active_students: allStudents.length, // All are active since we don't have status column
          inactive_students: 0,
          by_grade: {}, // TODO: Add when we have grade data
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

/**
 * Generate unique Vietnamese student code
 * Format: HS + Year + Sequential (e.g., HS2025001, HS2025002)
 * HS = Học Sinh (Vietnamese for "student")
 */
async function generateStudentCode(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get the highest existing student code for current year
  // Supports both old format (STU-YYYY-NNNN) and new format (HSYYYYNNN)
  const { data: students, error } = await supabase
    .from("profiles")
    .select("student_code")
    .eq("role", "student")
    .or(`student_code.like.HS${year}%,student_code.like.STU-${year}-%`)
    .order("student_code", { ascending: false })
    .limit(100); // Get more to handle both formats

  if (error) throw error;

  let nextNumber = 1;
  if (students && students.length > 0) {
    // Find the highest number from both formats
    students.forEach((student) => {
      if (student.student_code) {
        // New format: HSYYYYNNN (e.g., HS2025001)
        const newFormatMatch = student.student_code.match(/^HS\d{4}(\d{3})$/);
        if (newFormatMatch) {
          const num = parseInt(newFormatMatch[1]);
          if (num >= nextNumber) nextNumber = num + 1;
        }
        
        // Old format: STU-YYYY-NNNN (for backward compatibility)
        const oldFormatMatch = student.student_code.match(/^STU-\d{4}-(\d{4})$/);
        if (oldFormatMatch) {
          const num = parseInt(oldFormatMatch[1]);
          if (num >= nextNumber) nextNumber = num + 1;
        }
      }
    });
  }

  // Return new Vietnamese format: HS + Year + 3-digit number
  return `HS${year}${String(nextNumber).padStart(3, "0")}`;
}

/**
 * POST /api/admin/students
 * Create a new student with all fields
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with schema
    const validatedData = createStudentSchema.parse(body);

    // Check if email already exists
    const { data: existingProfile } = await supabase
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
    const studentCode = validatedData.student_code || (await generateStudentCode());

    // Check if student code already exists
    if (validatedData.student_code) {
      const { data: existingCode } = await supabase
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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
    const { data: profile, error: profileError } = await supabase
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
      await supabase.auth.admin.deleteUser(authData.user.id);
      logger.error('Failed to create profile:', profileError);
      throw new Error(`Profile creation error: ${profileError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: `Student created successfully with code ${studentCode}`,
      tempPassword, // Return temp password so admin can give it to student
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

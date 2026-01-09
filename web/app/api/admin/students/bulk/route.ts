/**
 * Bulk Student Creation API
 * POST /api/admin/students/bulk
 * 
 * Creates multiple students at once and returns credentials
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getNextSequenceNumber, formatStudentCode } from '@/lib/students/studentCode';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getDataClient(request);
    
    // Basic auth check
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const studentsInput = body.students; // Expected: [{ full_name: string }, ...]

    if (!Array.isArray(studentsInput) || studentsInput.length === 0) {
      return NextResponse.json({ error: "Invalid input provided" }, { status: 400 });
    }

    if (studentsInput.length > 50) {
      return NextResponse.json({ error: "Batch size limit exceeded (max 50)" }, { status: 400 });
    }

    const supabaseService = createServiceClient();
    const year = new Date().getFullYear();
    
    // Get next sequence number once, then increment locally for each student
    let currentSeq = await getNextSequenceNumber(supabaseService);

    const results = [];
    const errors = [];

    // Process sequentially to ensure order
    for (const student of studentsInput) {
      const fullName = student.full_name?.trim();
      if (!fullName) {
        errors.push({ name: "Unknown", error: "Name is missing" });
        continue;
      }

      // Generate Code using shared utility
      const studentCode = formatStudentCode(year, currentSeq);
      currentSeq++; // Increment for next student

      // Generate Password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase() + "!";
      
      // Generate Email (based on student code for uniqueness)
      const email = `${studentCode.toLowerCase()}@student.bhedu.vn`;

      try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: "student",
            student_code: studentCode
          }
        });

        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }

        // 2. Create Profile
        const { error: profileError } = await supabaseService
          .from("profiles")
          .insert({
            user_id: authData.user.id,
            email: email,
            full_name: fullName,
            role: "student",
            student_code: studentCode,
            status: "active",
            enrollment_date: new Date().toISOString().split("T")[0],
            is_active: true
          });

        if (profileError) {
          // Rollback auth
          await supabaseService.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Profile error: ${profileError.message}`);
        }

        results.push({
          full_name: fullName,
          student_code: studentCode,
          password: tempPassword,
          email: email,
          status: "success"
        });

      } catch (err: any) {
        logger.error(`Failed to create student ${fullName}`, err);
        errors.push({
          full_name: fullName,
          error: err.message
        });
        // Note: We do NOT rollback previous successful students. Partial success is allowed.
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      errors: errors,
      message: `Processed ${results.length} students successfully.`
    });

  } catch (error: any) {
    logger.error('Bulk create error', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

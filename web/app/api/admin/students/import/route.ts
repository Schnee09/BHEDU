/**
 * Bulk Student Import API
 * POST /api/admin/students/import
 *
 * Handles bulk student creation with validation and error tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from "@/lib/auth/dataClient";
import { adminAuth } from "@/lib/auth/adminAuth";
import { logger } from "@/lib/logger";
import type { StudentImportRow } from "@/lib/importService";
import { userService } from "@/lib/services/userService";

export async function POST(req: NextRequest) {
  try {
    // Admin authentication
    const authResult = await adminAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || "Unauthorized" },
        { status: 401 },
      );
    }

    const { supabase } = await getDataClient(req);
    const body = await req.json();
    const { students } = body as { students: StudentImportRow[] };

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: students array is required" },
        { status: 400 },
      );
    }

    logger.info(`Starting bulk import of ${students.length} students`, {
      userId: authResult.userId,
      count: students.length,
    });

    // Create import log
    const { data: importLog, error: logError } = await supabase
      .from("import_logs")
      .insert({
        imported_by: authResult.userId,
        import_type: "students",
        total_rows: students.length,
        status: "processing",
      })
      .select()
      .single();

    if (logError || !importLog) {
      logger.error("Failed to create import log", logError);
      return NextResponse.json(
        { error: "Failed to create import log" },
        { status: 500 },
      );
    }

    const results = {
      importLogId: importLog.id,
      success: [] as string[],
      errors: [] as { row: number; email: string; error: string }[],
      successCount: 0,
      errorCount: 0,
    };

    // Process students in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      for (const [batchIndex, student] of batch.entries()) {
        const rowNumber = i + batchIndex + 2; // +2 for header row and 0-index

        try {
          // 1. Check if student already exists by email if provided
          if (student.email) {
            const { data: existingUser } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", student.email.toLowerCase())
              .maybeSingle();

            if (existingUser) {
              results.errors.push({
                row: rowNumber,
                email: student.email,
                error: "Student with this email already exists",
              });
              results.errorCount++;

              await supabase.from("import_errors").insert({
                import_log_id: importLog.id,
                row_number: rowNumber,
                field_name: "email",
                error_type: "duplicate",
                error_message: "Student with this email already exists",
                row_data: student,
                severity: "error",
              });
              continue;
            }
          }

          // 2. Use centralized UserService for consistent student creation
          const createdUser = await userService.createUser(
            {
              first_name: student.firstName,
              last_name: student.lastName,
              full_name: `${student.firstName} ${student.lastName}`.trim(),
              email: student.email || undefined,
              password: generateTemporaryPassword(),
              role: "student",
              phone: student.phone,
              address: student.address,
              date_of_birth: student.dateOfBirth,
              gender: student.gender,
              student_code: student.studentId || undefined,
              enrollment_date: student.enrollmentDate ||
                new Date().toISOString().split("T")[0],
              grade_level: student.gradeLevel,
              status: (student.status as any) || "active",
            },
            "admin",
            "system_import",
          );

          const studentId = createdUser.id;

          // 3. Create guardian record if guardian information provided
          if (student.guardianName) {
            const { error: guardianError } = await supabase
              .from("guardians")
              .insert({
                student_id: studentId,
                name: student.guardianName,
                relationship: student.guardianRelationship || null,
                phone: student.guardianPhone || null,
                email: student.guardianEmail || null,
                address: student.guardianAddress || null,
                is_primary_contact: student.isPrimaryContact || false,
                is_emergency_contact: student.isEmergencyContact || false,
              });

            if (guardianError) {
              logger.warn(`Failed to create guardian for row ${rowNumber}`, {
                error: guardianError.message,
                code: guardianError.code,
              });
              await supabase.from("import_errors").insert({
                import_log_id: importLog.id,
                row_number: rowNumber,
                field_name: "guardian",
                error_type: "database_error",
                error_message: guardianError.message ||
                  "Failed to create guardian",
                row_data: { guardianName: student.guardianName },
                severity: "warning",
              });
            }
          }

          results.success.push(studentId);
          results.successCount++;
          logger.info(
            `Successfully imported student: ${student.email || studentId}`,
          );
        } catch (error: any) {
          logger.error(`Import failed for row ${rowNumber}`, error);

          results.errors.push({
            row: rowNumber,
            email: student.email,
            error: error.message || "Failed to create student",
          });
          results.errorCount++;

          await supabase.from("import_errors").insert({
            import_log_id: importLog.id,
            row_number: rowNumber,
            field_name: "user_creation",
            error_type: "service_error",
            error_message: error.message ||
              "Failed to create student via service",
            row_data: student,
            severity: "error",
          });
        }
      }
    }

    // Update import log with final results
    await supabase
      .from("import_logs")
      .update({
        processed_rows: students.length,
        success_count: results.successCount,
        error_count: results.errorCount,
        status: results.errorCount === 0
          ? "completed"
          : (results.successCount > 0 ? "completed" : "failed"),
        error_summary: results.errors.length > 0
          ? JSON.stringify(results.errors.slice(0, 10))
          : null,
      })
      .eq("id", importLog.id);

    // Log audit
    await supabase.from("audit_logs").insert({
      actor_id: authResult.userId,
      action: "bulk_import_students",
      resource_type: "student",
      details: {
        import_log_id: importLog.id,
        total: students.length,
        success: results.successCount,
        errors: results.errorCount,
      },
    });

    return NextResponse.json({
      success: true,
      importLogId: importLog.id,
      results: {
        total: students.length,
        successCount: results.successCount,
        errorCount: results.errorCount,
        errors: results.errors,
      },
    });
  } catch (error) {
    logger.error("Bulk import error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * Generate a temporary password for new students
 */
function generateTemporaryPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

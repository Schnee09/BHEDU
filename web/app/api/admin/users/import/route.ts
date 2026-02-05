import { NextResponse } from "next/server";
import {
  apiSuccess,
  createApiHandler,
} from "@/lib/api";
import { importUsersSchema } from "@/lib/schemas/requests/user";
import { userService } from "@/lib/services/userService";
import { createAbility } from "@/lib/auth/permissions";

/**
 * POST /api/admin/users/import
 * Bulk import users
 */
export const POST = createApiHandler(
  {
    requireAuth: true,
    bodySchema: importUsersSchema,
  },
  async ({ body, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("create", "User")) {
       return NextResponse.json(
        { success: false, error: "Bạn không có quyền nhập người dùng" },
        { status: 403 }
      );
    }
    
    // Additional check: maybe rely on userService to check specific roles?
    
    const { users } = body;
    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const rowNumber = i + 1;

      try {
        // Prepare input for UserService
        // We need to map optional fields and ensure types match CreateUserInput
        // importUsersSchema is very similar to createUserSchema but allows partials?
        // No, CreateUserInput requires first_name, last_name.
        // importUsersSchema requires full_name (legacy csv format?) 
        // Let's check user.ts again.
        // importUsersSchema has full_name, role.
        // createUserSchema has first_name, last_name, full_name (optional/ignored?).
        // We need to split full_name if first/last are missing?
        
        let first_name = "";
        let last_name = "";
        
        if (userData.full_name) {
            const parts = userData.full_name.trim().split(" ");
            if (parts.length > 1) {
                last_name = parts.pop() || "";
                first_name = parts.join(" ");
            } else {
                first_name = parts[0];
                last_name = ""; // or duplicate?
            }
        }
        
        // Generate password if missing
        const password = userData.password || Math.random().toString(36).slice(-8) + "A1!";

        await userService.createUser({
            email: userData.email,
            password: password,
            first_name: first_name,
            last_name: last_name,
            role: userData.role,
            phone: userData.phone,
            status: "active", // Default to active
            is_active: userData.is_active ?? true,
            notes: userData.notes,
            // Role specific mapping
            student_code: userData.student_id, // CSV often uses student_id col for code
            grade_level: userData.grade_level,
            department: userData.department,
            // defaults
            is_managed: true,
        }, user.role, user.id); // Pass current user role/id for auditing

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          email: userData.email || "N/A",
          error: error.message || "Unknown error",
        });
      }
    }

    return apiSuccess(results, {
      message: `Import completed. ${results.successful} successful, ${results.failed} failed`,
    });
  }
);

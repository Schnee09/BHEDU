/**
 * User Service - Core logic for user and profile management
 *
 * MIGRATED TO INSTANCE-BASED (Phase 2/Architecture v5.0)
 */

import { createServiceClient } from "@/lib/supabase/server";
import {
    AuthorizationError,
    NotFoundError,
    ValidationError,
} from "@/lib/api/errors";
import type { CreateUserInput, UpdateUserInput } from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { studentService } from "./studentService";
import { teacherService } from "./teacherService";
import { isAtLeast, UserRole } from "@/lib/auth/core";
import { generateWelcomeEmail, sendEmail } from "@/lib/email/emailService";
import { generateUserEmailSlug, splitFullName } from "@/lib/utils/names";
import { generateStudentCode } from "@/lib/students/studentCode";

const MANAGED_DOMAINS = [
    "@student.bhedu.vn",
    "@parent.bhedu.vn",
    "@fake.bhedu.vn",
];

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    is_active: boolean;
    is_managed: boolean;
    personal_email?: string;
    created_at: string;
    // ... other fields
}

export class UserService {
    private supabase: SupabaseClient;

    constructor(supabase?: SupabaseClient) {
        this.supabase = supabase || createServiceClient();
    }

    /**
     * Creates a new user in Auth and Profile with automatic generation support
     */
    async createUser(
        input: CreateUserInput,
        currentUserRole: string,
        createdBy?: string,
    ) {
        // 1. Role Escalation / Protection Logic
        if (
            (input.role as string) === "super_admin" &&
            currentUserRole !== "super_admin"
        ) {
            throw new AuthorizationError(
                "Bạn không có quyền tạo tài khoản super_admin",
            );
        }

        if (
            ["owner", "admin", "staff"].includes(input.role as string) &&
            !isAtLeast(currentUserRole as UserRole, "admin")
        ) {
            throw new AuthorizationError(
                "Bạn không có quyền tạo tài khoản với vai trò này",
            );
        }

        // 2. Pre-processing & Auto-generation

        // Handle Names
        let firstName = input.first_name || "";
        let lastName = input.last_name || "";
        const fullName = input.full_name ||
            (firstName && lastName
                ? `${lastName} ${firstName}`.trim()
                : (firstName || lastName));

        if (!firstName || !lastName) {
            const split = splitFullName(fullName);
            firstName = firstName || split.first_name;
            lastName = lastName || split.last_name;
        }

        // Handle Student Code
        let studentCode = input.student_code;
        if (input.role === "student" && !studentCode) {
            studentCode = await generateStudentCode(this.supabase);
        }

        // Handle Email
        let email = input.email;
        if (!email) {
            if (input.role === "student") {
                email = `${studentCode?.toLowerCase()}@student.bhedu.vn`;
            } else {
                const domain = input.role === "parent"
                    ? "@parent.bhedu.vn"
                    : "@bhedu.vn";
                const slug = generateUserEmailSlug(fullName);
                let candidate = `${slug}${domain}`;
                let counter = 1;
                while (true) {
                    const { data: exists } = await this.supabase
                        .from("profiles")
                        .select("id")
                        .eq("email", candidate)
                        .maybeSingle();
                    if (!exists) break;
                    counter++;
                    candidate = `${slug}${counter}${domain}`;
                }
                email = candidate;
            }
        }

        // Handle Password
        const password = input.password ||
            (Math.random().toString(36).slice(-10) + "A1!");

        // 3. Create Auth User
        const { data: authData, error: authError } = await this.supabase.auth
            .admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullName,
                    role: input.role,
                    personal_email: input.personal_email,
                    student_code: studentCode,
                    grade_level: input.grade_level,
                    department: input.department,
                    teacher_type: input.teacher_type,
                    specialization: input.specialization,
                    hourly_rate: input.hourly_rate,
                },
            });

        if (authError || !authData.user) {
            console.error("Auth creation failed:", authError);
            throw new ValidationError(
                authError?.message || "Không thể tạo tài khoản người dùng",
            );
        }

        const userId = authData.user.id;

        try {
            // 4. Determine if managed
            const isManaged = MANAGED_DOMAINS.some((domain) =>
                email.toLowerCase().endsWith(domain)
            );

            // 5. Upsert Profile (trigger auto-creates it, but we upsert to handle race conditions)
            const { data: profile, error: profileError } = await this.supabase
                .from("profiles")
                .upsert({
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullName,
                    email: email,
                    role: input.role,
                    phone: input.phone,
                    is_active: true,
                    is_managed: isManaged,
                    created_by: createdBy,
                    notes: input.notes,
                    student_code: studentCode,
                    grade_level: input.grade_level,
                    department: input.department,
                    personal_email: input.personal_email,
                }, {
                    onConflict: "user_id",
                    ignoreDuplicates: false,
                })
                .select()
                .single();

            if (profileError) {
                console.error("Profile upsert failed:", {
                    error: profileError,
                    userId,
                    email,
                    role: input.role,
                    attemptedData: {
                        user_id: userId,
                        email,
                        role: input.role,
                        full_name: fullName,
                    },
                });

                // Provide more specific error message
                if (profileError.code === "PGRST116") {
                    throw new Error(
                        "Không thể tạo hồ sơ người dùng. Vui lòng chạy migration database hoặc liên hệ quản trị viên.",
                    );
                }

                throw new Error(
                    `Không thể cập nhật thông tin hồ sơ: ${
                        profileError.message || "Unknown error"
                    }`,
                );
            }

            // 6. Role-specific Synchronization (Use profile.id NOT userId)
            if (input.role === "student") {
                await studentService.updateStudent(profile.id, {
                    student_code: studentCode,
                    grade_level: input.grade_level,
                });
            } else if (input.role === "teacher" || input.role === "tutor") {
                await teacherService.syncTeacherProfile(profile.id, {
                    teacher_type: input.teacher_type ||
                        (input.role === "tutor" ? "tutor" : "full_time"),
                    department: input.department,
                    specialization: input.specialization,
                    hourly_rate: input.hourly_rate,
                });
            }

            // 7. Log activity
            await this.supabase.from("user_activity_logs").insert({
                user_id: userId,
                action: "user_created",
                description: `User created by ${currentUserRole}`,
                metadata: { created_by: createdBy, role: input.role },
            });

            // 8. Send welcome email (Intelligent Routing)
            const isManagedEmail = MANAGED_DOMAINS.some((domain) =>
                email.toLowerCase().endsWith(domain)
            );

            const recipientEmail = (isManagedEmail && input.personal_email)
                ? input.personal_email
                : (!isManagedEmail ? email : null);

            if (recipientEmail) {
                const loginUrl = `${
                    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                }/login`;
                const emailContent = generateWelcomeEmail({
                    firstName: firstName,
                    email: email,
                    password: password,
                    role: input.role,
                    loginUrl,
                });

                await sendEmail({
                    to: recipientEmail,
                    subject:
                        "Chào mừng đến với BH-EDU - Thông tin tài khoản của bạn",
                    ...emailContent,
                });
            }

            return {
                ...profile,
                tempPassword: password, // Return password for UI display
            };
        } catch (error) {
            await this.supabase.auth.admin.deleteUser(userId);
            throw error;
        }
    }

    /**
     * Updates an existing user and their role-specific profiles
     */
    async updateUser(id: string, input: UpdateUserInput) {
        // 1. Update Core Profile
        const { data: profile, error: profileError } = await this.supabase
            .from("profiles")
            .update({
                first_name: input.first_name,
                last_name: input.last_name,
                full_name: (input.first_name || input.last_name)
                    ? `${input.first_name || ""} ${input.last_name || ""}`
                        .trim()
                    : undefined,
                phone: input.phone,
                is_active: input.is_active,
                notes: input.notes,
                personal_email: input.personal_email,
            })
            .eq("id", id)
            .select()
            .single();

        if (profileError) {
            throw new Error("Không thể cập nhật hồ sơ");
        }

        // 2. Role-specific updates
        if (profile.role === "student") {
            await studentService.updateStudent(id, {
                student_code: input.student_code,
                grade_level: input.grade_level,
            });
        } else if (profile.role === "teacher") {
            await teacherService.syncTeacherProfile(id, {
                teacher_type: input.teacher_type,
                department: input.department,
                specialization: input.specialization,
                hourly_rate: input.hourly_rate,
            });
        }

        return profile;
    }

    /**
     * Deletes a user permanently from Auth and Profile
     */
    async deleteUser(id: string) {
        // 1. Get user to check role (protection)
        const { data: user, error: fetchError } = await this.supabase
            .from("profiles")
            .select("role, user_id")
            .eq("id", id)
            .single();

        if (fetchError || !user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }

        // 2. Delete from Auth (this will trigger profile deletion via DB trigger if configured,
        // but we'll be explicit for safety)
        if (user.user_id) {
            const { error: authError } = await this.supabase.auth.admin
                .deleteUser(user.user_id);
            if (authError) {
                console.error("Auth deletion failed:", authError);
                // Fallback: try to delete profile anyway
            }
        }

        // 3. Delete Profiles (Explicit cleanup)
        // Usually handled by ON DELETE CASCADE in DB, but being explicit is safer
        await this.supabase.from("teacher_profiles").delete().eq(
            "profile_id",
            id,
        );
        await this.supabase.from("student_profiles").delete().eq(
            "profile_id",
            id,
        );
        await this.supabase.from("profiles").delete().eq("id", id);
    }

    // ============================================================
    // STATIC METHODS FOR BACKWARD COMPATIBILITY
    // ============================================================

    static async createUser(
        input: CreateUserInput,
        currentUserRole: string,
        createdBy?: string,
    ) {
        return userService.createUser(input, currentUserRole, createdBy);
    }

    static async updateUser(id: string, input: UpdateUserInput) {
        return userService.updateUser(id, input);
    }
}

// Default singleton instance
export const userService = new UserService();

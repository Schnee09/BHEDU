import {
    apiSuccess,
    createApiHandler,
    createGetHandler,
} from "@/lib/api/apiHandler";
import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { z } from "zod";

/**
 * GET /api/admin/invitations - List all invitations
 * Restricted to admin/staff
 */
export const GET = createGetHandler({
    allowedRoles: ["admin", "staff", "super_admin", "owner"],
}, async () => {
    const supabase = createServiceClient(); // Use service client for DB access (RLS bypass)

    const { data: invites, error } = await supabase
        .from("user_invitations")
        .select(`
            *,
            invited_by:profiles!user_invitations_invited_by_fkey (
                full_name
            )
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return apiSuccess({ invites }, {});
});

/**
 * POST /api/admin/invitations - Create a new invitation
 * Restricted to admin/staff
 */
export const POST = createApiHandler({
    allowedRoles: ["admin", "staff", "super_admin", "owner"],
    bodySchema: z.object({
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        role: z.string(),
        expires_in_days: z.number().min(1).max(30).default(7),
        metadata: z.record(z.string(), z.any()).optional(),
    }),
}, async ({ body, user }) => {
    const { email, phone, role, expires_in_days, metadata = {} } = body;
    const supabase = createServiceClient();

    const token = randomUUID();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expires_in_days);

    const { data: invite, error } = await supabase
        .from("user_invitations")
        .insert({
            email: email || null,
            phone: phone || null,
            role,
            token,
            invited_by: user.id,
            expires_at: expires_at.toISOString(),
            metadata,
        })
        .select()
        .single();

    if (error) throw error;

    return apiSuccess({ invite }, {
        message: "Lời mời đã được tạo thành công",
    });
});

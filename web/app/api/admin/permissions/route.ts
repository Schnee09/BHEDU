/**
 * Permission Management API
 * CRUD operations for user permissions with audit logging
 */

import { NextResponse } from "next/server";
import { createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/admin/permissions - Get all permission definitions
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ user }) => {
    try {
      if (!["admin", "super_admin", "owner"].includes(user.role || "")) {
        return NextResponse.json({ error: "Admin access required" }, {
          status: 403,
        });
      }

      // Use service client to bypass RLS for fetching generic permission definitions
      const supabase = createServiceClient();

      // Get permission definitions
      const { data: definitions, error: defError } = await supabase
        .from("permission_definitions")
        .select("*")
        .order("category")
        .order("code");

      if (defError) {
        console.error("Failed to fetch definitions:", defError);
        return NextResponse.json({ error: "Failed to fetch permissions" }, {
          status: 500,
        });
      }

      // Get role permissions
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("*");

      return NextResponse.json({
        definitions: definitions || [],
        rolePermissions: rolePerms || [],
      });
    } catch (error) {
      console.error("Permission API error:", error);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  },
);

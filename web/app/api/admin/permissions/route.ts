/**
 * Permission Management API
 * CRUD operations for user permissions with audit logging
 */

import { NextResponse } from "next/server";
import { createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { SYSTEM_PERMISSION_DEFINITIONS } from "@/lib/auth/core";

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
      let definitions: any[] = [];
      try {
        const { data, error: defError } = await supabase
          .from("permission_definitions")
          .select("*")
          .order("category")
          .order("code");

        if (!defError && data && data.length > 0) {
          definitions = data;
        } else {
          definitions = SYSTEM_PERMISSION_DEFINITIONS;
        }
      } catch {
        definitions = SYSTEM_PERMISSION_DEFINITIONS;
      }

      // Get role permissions
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("*");

      return NextResponse.json({
        definitions,
        rolePermissions: rolePerms || [],
      });
    } catch (error) {
      console.error("Permission API error:", error);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  },
);

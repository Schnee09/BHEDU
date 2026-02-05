/**
 * Permissions Check API
 * POST /api/admin/monitoring/check-permission
 *
 * Check if a role has permission for a resource/action
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/guard";
import {
  getFlattenedPermissions,
  hasPermission,
  UserRole,
} from "@/lib/auth/core";

export async function POST(request: Request) {
  try {
    const { authorized } = await getAuthContext(request, "system.audit");
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { role, permission } = body as {
      role: string;
      permission: string;
    };

    if (!role || !permission) {
      return NextResponse.json(
        { error: "role and permission are required" },
        { status: 400 },
      );
    }

    const hasPerm = hasPermission(
      role as UserRole,
      permission as import("@/lib/auth/core").PermissionCode,
    );

    return NextResponse.json({
      success: true,
      result: {
        hasPermission: hasPerm,
      },
      role,
      permission,
    });
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}

export async function GET(request: Request) {
  try {
    const { authorized } = await getAuthContext(request, "system.audit");
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json(
        { error: "role parameter is required" },
        { status: 400 },
      );
    }

    const permissions = getFlattenedPermissions(role as UserRole);

    return NextResponse.json({
      success: true,
      role,
      permissions: Array.from(permissions),
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}

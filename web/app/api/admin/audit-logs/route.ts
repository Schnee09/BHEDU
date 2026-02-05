import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminAuth } from "@/lib/auth/adminAuth";
import { getDataClient } from "@/lib/auth/dataClient";

export async function GET(request: Request) {
  try {
    // Use the centralized adminAuth helper which supports super_admin via inheritance
    const auth = await adminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || "Forbidden" }, {
        status: auth.userId ? 403 : 401,
      });
    }

    // Use the privileged client from adminAuth (once updated) or getDataClient
    const { supabase, viewerRole, usingServiceClient } = await getDataClient(
      request,
    );
    console.log(
      `[audit-logs API] Role: ${viewerRole}, Privileged: ${usingServiceClient}`,
    );

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resource_type");

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (action) {
      query = query.eq("action", action);
    }
    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    // Handle case where audit_logs table doesn't exist
    if (error) {
      console.error("Error fetching audit logs:", error);
      // Return empty array if table doesn't exist
      return NextResponse.json({
        data: [],
        count: 0,
      });
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({
      data: [],
      count: 0,
    });
  }
}

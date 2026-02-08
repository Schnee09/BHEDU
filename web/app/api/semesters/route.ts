/**
 * Semesters API
 * GET /api/semesters - Fetch all semesters
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { data: semesters, error } = await supabase
      .from("semesters")
      .select("id, name, code, start_date, end_date, is_active")
      .order("start_date", { ascending: false });

    if (error) {
      logger.warn("Error fetching semesters", { error: error.message });
      return NextResponse.json({ success: true, semesters: [] });
    }

    return NextResponse.json({ success: true, semesters: semesters || [] });
  } catch (error: any) {
    logger.error("Error fetching semesters", error);
    return NextResponse.json(
      { success: false, error: error.message, semesters: [] },
      { status: 200 },
    );
  }
}

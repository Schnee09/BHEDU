/**
 * Admin Assignments API
 * GET/POST /api/admin/assignments
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth } from "@/lib/auth/adminAuth";
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

  const { supabase } = await getDataClient(request);
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("class_id");
    const categoryId = searchParams.get("category_id");

    // First, get assignment records
    let query = supabase
      .from("assignments")
      .select("*")
      .order("due_date", { ascending: false });

    if (classId) query = query.eq("class_id", classId);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data: assignmentData, error: assignmentError } = await query;
    if (assignmentError) {
      logger.error("Assignments fetch error:", { error: assignmentError });
      throw new Error(`Database error: ${assignmentError.message}`);
    }

    if (!assignmentData || assignmentData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Get unique class and category IDs
    const classIds = [...new Set(assignmentData.map(a => a.class_id).filter(Boolean))];
    const categoryIds = [...new Set(assignmentData.map(a => a.category_id).filter(Boolean))];

    // Fetch classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .in("id", classIds);

    // Fetch categories
    const { data: categories } = await supabase
      .from("assignment_categories")
      .select("id, name")
      .in("id", categoryIds);

    // Create lookup maps
    const classMap = new Map(classes?.map(c => [c.id, c]) || []);
    const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);

    // Combine data
    const enrichedData = assignmentData.map(assignment => ({
      ...assignment,
      class: assignment.class_id ? classMap.get(assignment.class_id) || null : null,
      category: assignment.category_id ? categoryMap.get(assignment.category_id) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedData,
      total: enrichedData.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

  const { supabase } = await getDataClient(request);
    const body = await request.json();
    const { class_id, category_id, title, description, due_date, max_points = 100 } = body;

    if (!class_id || !title) {
      throw new ValidationError("Class ID and title are required");
    }

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        class_id,
        category_id,
        title,
        description,
        due_date,
        max_points,
      })
      .select()
      .single();

    if (error) {
      logger.error("Create assignment error:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Admin Courses [id] API - DISABLED
 * 
 * These routes are currently disabled because the 'courses' table
 * does not exist in the current database schema.
 * 
 * TODO: Create courses table in Supabase and re-enable these routes
 */

import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get single course - DISABLED
export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { 
      error: 'Courses feature is not yet implemented',
      message: 'The courses table does not exist in the database schema'
    },
    { status: 501 }
  );
}

// PUT: Update course - DISABLED
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { 
      error: 'Courses feature is not yet implemented',
      message: 'The courses table does not exist in the database schema'
    },
    { status: 501 }
  );
}

// DELETE: Delete course - DISABLED
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { 
      error: 'Courses feature is not yet implemented',
      message: 'The courses table does not exist in the database schema'
    },
    { status: 501 }
  );
}

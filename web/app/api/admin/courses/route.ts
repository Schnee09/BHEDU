/**
 * Admin Courses API - DISABLED
 * 
 * These routes are currently disabled because the 'courses' table
 * does not exist in the current database schema.
 * 
 * TODO: Create courses table in Supabase and re-enable these routes
 */

import { NextRequest, NextResponse } from "next/server";

// GET: List all courses - DISABLED
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Courses feature is not yet implemented',
      message: 'The courses table does not exist in the database schema'
    },
    { status: 501 }
  );
}

// POST: Create a new course - DISABLED
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Courses feature is not yet implemented',
      message: 'The courses table does not exist in the database schema'
    },
    { status: 501 }
  );
}

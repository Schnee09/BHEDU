/**
 * Admin Courses [id] API — DEPRECATED
 * Dùng /api/subjects/[id] thay thế.
 */
import { NextResponse } from 'next/server';

const GONE = () =>
  NextResponse.json(
    { success: false, error: 'Endpoint này đã bị xóa. Dùng /api/subjects/[id] thay thế.', redirect: '/api/subjects' },
    { status: 410 },
  );

export const GET = GONE;
export const PUT = GONE;
export const DELETE = GONE;

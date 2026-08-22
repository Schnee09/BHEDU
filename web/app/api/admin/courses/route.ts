/**
 * Admin Courses API — DEPRECATED
 * Bảng courses đã được gộp vào subjects.
 * Endpoint này trả về 410 Gone, dùng /api/subjects thay thế.
 */
import { NextResponse } from 'next/server';

const GONE = () =>
  NextResponse.json(
    { success: false, error: 'Endpoint này đã bị xóa. Dùng /api/subjects thay thế.', redirect: '/api/subjects' },
    { status: 410 },
  );

export const GET = GONE;
export const POST = GONE;

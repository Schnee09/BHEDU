import { NextResponse } from 'next/server';

const GONE = () =>
  NextResponse.json(
    {
      success: false,
      error: 'Endpoint này đã ngừng hoạt động.',
      replacement: '/api/admin/users',
    },
    { status: 410 }
  );

export const GET = GONE;
export const POST = GONE;

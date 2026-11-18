import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint thử nghiệm này đã ngừng hoạt động.',
      replacement: '/api/admin/users',
    },
    { status: 410 }
  );
}

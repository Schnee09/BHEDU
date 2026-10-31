import { NextResponse } from 'next/server';

/**
 * Compatibility endpoint for the retired generic CSV importer.
 * Data imports now require their dedicated workflows and permissions.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Quy trình nhập dữ liệu này không còn được hỗ trợ',
      replacements: {
        students: '/api/admin/students/import',
        grades: '/api/grades/bulk-import',
        attendance: '/api/attendance/bulk',
      },
    },
    { status: 410 }
  );
}

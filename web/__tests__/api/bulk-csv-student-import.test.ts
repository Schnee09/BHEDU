/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/bulk-import/route';

describe('POST /api/admin/bulk-import', () => {
  it('retires the generic importer and points clients to dedicated workflows', async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toEqual({
      error: 'Quy trình nhập dữ liệu này không còn được hỗ trợ',
      replacements: {
        students: '/api/admin/students/import',
        grades: '/api/grades/bulk-import',
        attendance: '/api/attendance/bulk',
      },
    });
  });
});

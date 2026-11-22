/**
 * @jest-environment node
 */
import { GET as getStudentReport } from '@/app/api/reports/students/route';
import { GET as getAttendanceReport } from '@/app/api/reports/attendance/route';
import { GET as getGradeReport } from '@/app/api/reports/grades/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessClass } from '@/lib/auth/classAccess';
import { classService } from '@/lib/services';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ from: jest.fn() })),
}));

const getAttendanceData = jest.fn();
const getStudentsForExport = jest.fn();
const getStudentDemographicsReport = jest.fn();
jest.mock('@/lib/repositories/ReportsRepository', () => ({
  ReportsRepository: jest.fn().mockImplementation(() => ({
    getAttendanceReport: getAttendanceData,
    getStudentsForExport,
    getStudentDemographicsReport,
  })),
}));
jest.mock('@/lib/services', () => ({
  classService: {
    getClassById: jest.fn(),
    getClassGradeStats: jest.fn(),
  },
}));

const CLASS_ID = '123e4567-e89b-42d3-a456-426614174000';

function request(path: string) {
  const value: any = new Request(`http://localhost${path}`);
  value.nextUrl = {
    pathname: path.split('?')[0],
    searchParams: new URL(value.url).searchParams,
  };
  return value;
}

function authenticate(role: string) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id: `${role}-1`, email: `${role}@example.com` },
    role,
  });
}

describe('aggregate report scopes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAttendanceData.mockResolvedValue({ data: [] });
    getStudentDemographicsReport.mockResolvedValue({
      total: 10,
      active: 9,
      inactive: 1,
      newThisMonth: 2,
      byGrade: [],
      byGender: [],
    });
    (classService.getClassById as jest.Mock).mockResolvedValue({ id: CLASS_ID, name: 'Toán 9' });
    (classService.getClassGradeStats as jest.Mock).mockResolvedValue({ average: 8 });
  });

  it.each([
    [
      'attendance report',
      getAttendanceReport,
      `/api/reports/attendance?class_id=${CLASS_ID}`,
      'attendance.reports',
    ],
    ['grade report', getGradeReport, `/api/reports/grades?classId=${CLASS_ID}`, 'grades.view'],
  ] as const)(
    'requires the explicit permission for %s before scope queries',
    async (_name, handler, path, permission) => {
      (getAuthContext as jest.Mock).mockResolvedValue({
        authorized: false,
        profile: { id: 'teacher-1', email: 'teacher@example.com' },
        role: 'teacher',
      });

      const response = await handler(request(path), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), permission);
      expect(canAccessClass).not.toHaveBeenCalled();
    }
  );

  it.each(['teacher', 'tutor', 'staff', 'student', 'parent'])(
    'blocks %s from the center-wide student report',
    async (role) => {
      (getAuthContext as jest.Mock).mockResolvedValue({
        authorized: false,
        profile: { id: `${role}-1`, email: `${role}@example.com` },
        role,
      });

      const response = await getStudentReport(request('/api/reports/students'), {
        params: Promise.resolve({}),
      } as any);

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'reports.center_view');
      expect(getStudentsForExport).not.toHaveBeenCalled();
      expect(getStudentDemographicsReport).not.toHaveBeenCalled();
    }
  );

  it('allows staff granted center report access dynamically to view demographics', async () => {
    authenticate('staff');

    const response = await getStudentReport(request('/api/reports/students'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(getStudentDemographicsReport).toHaveBeenCalled();
  });

  it('requires reports.export in addition to center report access for CSV', async () => {
    authenticate('staff');
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await getStudentReport(request('/api/reports/students?format=csv'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(403);
    expect(resolveServerPermission).toHaveBeenCalledWith('staff-1', 'staff', 'reports.export');
    expect(getStudentsForExport).not.toHaveBeenCalled();
  });

  it('requires a class filter for non-management attendance reports', async () => {
    authenticate('teacher');

    const response = await getAttendanceReport(request('/api/reports/attendance'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(400);
    expect(getAttendanceData).not.toHaveBeenCalled();
  });

  it.each(['teacher', 'tutor', 'staff', 'student', 'parent'])(
    'rejects %s from an inaccessible class report',
    async (role) => {
      authenticate(role);
      (canAccessClass as jest.Mock).mockResolvedValue(false);

      const attendanceResponse = await getAttendanceReport(
        request(`/api/reports/attendance?class_id=${CLASS_ID}`),
        { params: Promise.resolve({}) } as any
      );
      const gradeResponse = await getGradeReport(
        request(`/api/reports/grades?classId=${CLASS_ID}`),
        { params: Promise.resolve({}) } as any
      );

      expect(attendanceResponse.status).toBe(403);
      expect(gradeResponse.status).toBe(403);
      expect(getAttendanceData).not.toHaveBeenCalled();
      expect(classService.getClassById).not.toHaveBeenCalled();
    }
  );

  it('allows an assigned tutor to load class-scoped attendance and grade reports', async () => {
    authenticate('tutor');
    (canAccessClass as jest.Mock).mockResolvedValue(true);

    const attendanceResponse = await getAttendanceReport(
      request(`/api/reports/attendance?class_id=${CLASS_ID}`),
      { params: Promise.resolve({}) } as any
    );
    const gradeResponse = await getGradeReport(request(`/api/reports/grades?classId=${CLASS_ID}`), {
      params: Promise.resolve({}),
    } as any);

    expect(attendanceResponse.status).toBe(200);
    expect(gradeResponse.status).toBe(200);
    expect(getAttendanceData).toHaveBeenCalledWith(expect.objectContaining({ classId: CLASS_ID }));
    expect(classService.getClassById).toHaveBeenCalledWith(CLASS_ID);
  });

  it('maps stored attendance remarks to the report notes field', async () => {
    authenticate('admin');
    getAttendanceData.mockResolvedValue({
      data: [
        {
          id: 'attendance-1',
          date: '2026-11-12',
          status: 'late',
          remarks: 'Đến muộn 10 phút',
          student_id: 'student-1',
          class_id: CLASS_ID,
        },
      ],
    });

    const response = await getAttendanceReport(request('/api/reports/attendance'), {
      params: Promise.resolve({}),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0]).toMatchObject({ notes: 'Đến muộn 10 phút' });
  });
});

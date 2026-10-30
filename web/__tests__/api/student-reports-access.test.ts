/**
 * @jest-environment node
 */
import { GET as getTranscript } from '@/app/api/reports/transcript/route';
import { GET as getReportCard } from '@/app/api/reports/report-card/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { studentService, gradeService } from '@/lib/services';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ from: jest.fn() })),
}));

const getTranscriptData = jest.fn();
jest.mock('@/lib/repositories/ReportsRepository', () => ({
  ReportsRepository: jest.fn().mockImplementation(() => ({
    getTranscript: getTranscriptData,
  })),
}));

const findAttendance = jest.fn();
jest.mock('@/lib/repositories/AttendanceRepository', () => ({
  AttendanceRepository: jest.fn().mockImplementation(() => ({ findAll: findAttendance })),
}));

jest.mock('@/lib/services', () => ({
  studentService: { getStudentById: jest.fn() },
  gradeService: { getStudentTranscript: jest.fn() },
}));

const STUDENT_ID = '123e4567-e89b-42d3-a456-426614174000';

function request(path: string) {
  const value: any = new Request(`http://localhost${path}`);
  value.nextUrl = {
    pathname: path.split('?')[0],
    searchParams: new URL(value.url).searchParams,
  };
  return value;
}

function authenticate(role: string, id = `${role}-1`) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

describe('student report access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTranscriptData.mockResolvedValue({ student: { id: STUDENT_ID } });
    (studentService.getStudentById as jest.Mock).mockResolvedValue({ id: STUDENT_ID });
    (gradeService.getStudentTranscript as jest.Mock).mockResolvedValue([]);
    findAttendance.mockResolvedValue({
      data: [{ status: 'present' }, { status: 'late' }, { status: 'absent' }],
    });
  });

  it.each(['teacher', 'tutor', 'parent', 'student', 'staff'])(
    'rejects %s when the student is outside their scope',
    async (role) => {
      authenticate(role);
      (canAccessStudent as jest.Mock).mockResolvedValue(false);

      const transcriptResponse = await getTranscript(
        request(`/api/reports/transcript?studentId=${STUDENT_ID}`),
        { params: Promise.resolve({}) } as any
      );
      const reportCardResponse = await getReportCard(
        request(`/api/reports/report-card?studentId=${STUDENT_ID}`),
        { params: Promise.resolve({}) } as any
      );

      expect(transcriptResponse.status).toBe(403);
      expect(reportCardResponse.status).toBe(403);
      expect(getTranscriptData).not.toHaveBeenCalled();
      expect(studentService.getStudentById).not.toHaveBeenCalled();
    }
  );

  it('allows a linked parent but never exposes pending transcript entries', async () => {
    authenticate('parent');
    (canAccessStudent as jest.Mock).mockResolvedValue(true);

    const response = await getTranscript(
      request(`/api/reports/transcript?studentId=${STUDENT_ID}&includePending=true`),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(200);
    expect(getTranscriptData).toHaveBeenCalledWith(
      STUDENT_ID,
      expect.objectContaining({ includePending: false })
    );
  });

  it('counts late attendance as attended in an authorized report card', async () => {
    authenticate('parent');
    (canAccessStudent as jest.Mock).mockResolvedValue(true);

    const response = await getReportCard(
      request(`/api/reports/report-card?studentId=${STUDENT_ID}`),
      { params: Promise.resolve({}) } as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.attendanceSummary).toMatchObject({
      totalDays: 3,
      presentDays: 2,
      attendanceRate: 66.7,
    });
  });
});

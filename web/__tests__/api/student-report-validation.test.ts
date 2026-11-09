/**
 * @jest-environment node
 */
import { POST as createReportCard } from '@/app/api/students/[id]/report-card/route';
import { GET as getTranscript } from '@/app/api/students/[id]/transcript/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createClientFromRequest } from '@/lib/supabase/server';
import { settingsService } from '@/lib/services/settingsService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({
  createClientFromRequest: jest.fn(),
  createServiceClient: jest.fn(),
}));
jest.mock('@/lib/services/settingsService', () => ({
  settingsService: { getAcademicContext: jest.fn() },
}));
jest.mock('@react-pdf/renderer', () => ({ renderToBuffer: jest.fn() }));
jest.mock('@/components/reports/ReportCardPDF', () => jest.fn());

describe('student report academic period validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    });
    (createClientFromRequest as jest.Mock).mockReturnValue({});
    (settingsService.getAcademicContext as jest.Mock).mockResolvedValue({
      academicYear: { id: 'year-1', name: '2026-2027' },
      semester: { id: 'semester-1', name: 'Học kỳ 1', code: '2026-2027-HK1' },
    });
  });

  it.each([
    ['transcript', getTranscript],
    ['report card', createReportCard],
  ])('rejects an invalid semester before querying %s data', async (_label, handler) => {
    const response = await handler(
      new Request('http://localhost/api/students/student-1/report?semester=summer'),
      { params: Promise.resolve({ id: 'student-1' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Học kỳ không hợp lệ' });
  });
});

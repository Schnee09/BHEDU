/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, PUT } from '@/app/api/subjects/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { subjectService } from '@/lib/services';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services', () => ({
  subjectService: {
    getSubjectById: jest.fn(),
    updateSubject: jest.fn(),
    deleteSubject: jest.fn(),
  },
}));

const context = { params: Promise.resolve({ id: 'subject-1' }) };

function request(method: 'GET' | 'PUT' | 'DELETE') {
  return new NextRequest('http://localhost/api/subjects/subject-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PUT' ? JSON.stringify({ name: 'Toán học' }) : undefined,
  });
}

describe('/api/subjects/[id] dynamic authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['GET', GET, 'subjects.view'],
    ['PUT', PUT, 'subjects.manage'],
    ['DELETE', DELETE, 'subjects.manage'],
  ] as const)('requires the explicit permission for %s', async (method, handler, permission) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method), context);

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    expect(subjectService.getSubjectById).not.toHaveBeenCalled();
  });

  it('allows staff granted subjects.manage dynamically to update a subject', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
      isCustomOverride: true,
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(subjectService.getSubjectById).mockResolvedValue({ id: 'subject-1' } as never);
    jest
      .mocked(subjectService.updateSubject)
      .mockResolvedValue({ id: 'subject-1', name: 'Toán học' } as never);

    const response = await PUT(request('PUT'), context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(subjectService.updateSubject).toHaveBeenCalledWith(
      'subject-1',
      expect.objectContaining({ name: 'Toán học' })
    );
    expect(json.name).toBe('Toán học');
  });
});

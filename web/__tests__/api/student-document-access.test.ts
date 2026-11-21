/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/students/[id]/documents/route';
import { DELETE } from '@/app/api/students/[id]/documents/[docId]/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const studentContext = { params: Promise.resolve({ id: 'student-1' }) };
const documentContext = {
  params: Promise.resolve({ id: 'student-1', docId: 'document-1' }),
};

type DocumentHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, DocumentHandler, 'GET' | 'POST' | 'DELETE', string]> = [
  ['document list', (request) => GET(request, studentContext), 'GET', 'students.view'],
  ['document upload', (request) => POST(request, studentContext), 'POST', 'students.edit'],
  ['document deletion', (request) => DELETE(request, documentContext), 'DELETE', 'students.edit'],
];

function request(method: 'GET' | 'POST' | 'DELETE') {
  return new NextRequest('http://localhost/api/students/student-1/documents', { method });
}

describe('student document authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(handlers)(
    'returns 401 for %s without a profile',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: null,
        role: null,
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(401);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );

  it.each(handlers)(
    'returns 403 for %s without its student permission',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'user-1' },
        role: 'parent',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );
});

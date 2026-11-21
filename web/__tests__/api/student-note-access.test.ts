/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/students/[id]/notes/route';
import { DELETE } from '@/app/api/students/[id]/notes/[noteId]/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const studentContext = { params: Promise.resolve({ id: 'student-1' }) };
const noteContext = { params: Promise.resolve({ id: 'student-1', noteId: 'note-1' }) };

type NoteHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, NoteHandler, 'GET' | 'POST' | 'DELETE']> = [
  ['note list', (request) => GET(request, studentContext), 'GET'],
  ['note creation', (request) => POST(request, studentContext), 'POST'],
  ['note deletion', (request) => DELETE(request, noteContext), 'DELETE'],
];

function request(method: 'GET' | 'POST' | 'DELETE') {
  return new NextRequest('http://localhost/api/students/student-1/notes', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify({ content: 'Ghi chú nội bộ' }) : undefined,
  });
}

describe('student note authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(handlers)('returns 401 for %s without a profile', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'students.edit');
  });

  it.each(handlers)('returns 403 for %s without students.edit', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'students.edit');
  });
});

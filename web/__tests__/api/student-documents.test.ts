/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/students/[id]/documents/route';
import { adminAuth } from '@/lib/auth/adminAuth';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/adminAuth', () => ({ adminAuth: jest.fn() }));

const documentQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
};
const storage = {
  createSignedUrl: jest.fn(),
  upload: jest.fn(),
  remove: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => documentQuery),
    storage: { from: jest.fn(() => storage) },
  })),
}));

function params() {
  return { params: Promise.resolve({ id: 'student-1' }) };
}

describe('/api/students/[id]/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminAuth as jest.Mock).mockResolvedValue({
      authorized: true,
      userId: 'admin-1',
      userRole: 'admin',
    });
    documentQuery.select.mockReturnValue(documentQuery);
    documentQuery.eq.mockReturnValue(documentQuery);
    documentQuery.order.mockResolvedValue({
      data: [
        {
          id: 'document-1',
          name: 'hoc-ba.pdf',
          type: 'application/pdf',
          url: 'https://public.example/legacy',
          storage_path: 'student-1/hoc-ba.pdf',
          size: 1024,
          uploaded_at: '2026-10-30T00:00:00Z',
          profiles: { full_name: 'Quản trị viên' },
        },
      ],
      error: null,
    });
    storage.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/document' },
      error: null,
    });
  });

  it('returns a short-lived signed URL instead of the stored public URL', async () => {
    const request: any = new Request('http://localhost/api/students/student-1/documents');

    const response = await GET(request, params());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(storage.createSignedUrl).toHaveBeenCalledWith('student-1/hoc-ba.pdf', 900);
    expect(body.documents[0].url).toBe('https://signed.example/document');
  });

  it('rejects unsupported files before creating a service client', async () => {
    const formData = new FormData();
    formData.append(
      'file',
      new File(['content'], 'script.exe', { type: 'application/x-msdownload' })
    );
    const request: any = new Request('http://localhost/api/students/student-1/documents', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request, params());

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
  });
});

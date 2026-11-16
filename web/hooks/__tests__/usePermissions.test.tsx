import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';

jest.mock('@/hooks/useProfile');
jest.mock('@/lib/supabase/client');

const mockUseProfile = jest.mocked(useProfile);
const mockCreateClient = jest.mocked(createClient);

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('grants every permission to a super administrator without querying overrides', async () => {
    mockUseProfile.mockReturnValue({
      profile: { id: 'admin-1', role: 'super_admin' },
      loading: false,
    } as ReturnType<typeof useProfile>);

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.can('students.delete')).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isOwner).toBe(true);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('gives user-level denials priority over role-level grants', async () => {
    mockUseProfile.mockReturnValue({
      profile: { id: 'teacher-1', role: 'teacher' },
      loading: false,
    } as ReturnType<typeof useProfile>);

    const from = jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue(
          table === 'user_permissions'
            ? {
                data: [{ permission_code: 'students.delete', is_denied: true, expires_at: null }],
              }
            : { data: [{ permission_code: 'students.delete', is_denied: false }] }
        ),
      })),
    }));
    mockCreateClient.mockReturnValue({ from } as unknown as ReturnType<typeof createClient>);

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.can('students.delete')).toBe(false);
    expect(result.current.permissions.has('students.delete')).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

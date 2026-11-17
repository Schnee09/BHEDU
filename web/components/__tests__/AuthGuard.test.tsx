import { act, render, screen, waitFor } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase/client';
import { requestCache } from '@/lib/api/requestCache';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

const mockUseRouter = jest.mocked(useRouter);
const mockGetSession = jest.mocked(supabase.auth.getSession);
const mockOnAuthStateChange = jest.mocked(supabase.auth.onAuthStateChange);

describe('AuthGuard cache isolation', () => {
  const replace = jest.fn();
  let authChangeCallback:
    | ((event: AuthChangeEvent, session: Session | null) => void | Promise<void>)
    | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    requestCache.clear();
    mockUseRouter.mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } as Session },
      error: null,
    });
    mockOnAuthStateChange.mockImplementation(
      (callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>) => {
        authChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        } as ReturnType<typeof supabase.auth.onAuthStateChange>;
      }
    );
  });

  afterEach(() => {
    requestCache.clear();
  });

  it('clears cached API data when the user signs out', async () => {
    requestCache.set('/api/students', { students: [{ id: 'student-1' }] });

    render(
      <AuthGuard>
        <div>Nội dung riêng tư</div>
      </AuthGuard>
    );

    await waitFor(() => expect(screen.getByText('Nội dung riêng tư')).toBeInTheDocument());
    expect(requestCache.getStats().cacheSize).toBe(1);

    act(() => {
      authChangeCallback?.('SIGNED_OUT', null);
    });

    expect(requestCache.getStats().cacheSize).toBe(0);
    expect(replace).toHaveBeenCalledWith('/login');
  });
});

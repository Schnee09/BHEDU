import { act, renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = jest.mocked(useRouter);

describe('useKeyboardShortcuts', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  it('navigates with an enabled Alt shortcut', () => {
    renderHook(() => useKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', altKey: true }));
    });

    expect(push).toHaveBeenCalledWith('/dashboard/students');
  });

  it('does not trigger navigation while the user is typing', () => {
    renderHook(() => useKeyboardShortcuts());
    const input = document.createElement('input');
    document.body.appendChild(input);

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 's', altKey: true, bubbles: true }));
    });

    expect(push).not.toHaveBeenCalled();
    input.remove();
  });

  it('opens and closes the help panel with slash and Escape', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    });
    expect(result.current.showHelp).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.showHelp).toBe(false);
  });
});

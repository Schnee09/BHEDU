import { act, renderHook } from '@testing-library/react';
import { useIsTouchDevice, useMediaQuery } from '@/hooks/useResponsive';

describe('responsive hooks', () => {
  it('subscribes to media query changes without effect-driven state updates', () => {
    let matches = false;
    const listeners = new Set<() => void>();

    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      media: query,
      get matches() {
        return matches;
      },
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    })) as typeof window.matchMedia;

    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(true);
    unmount();
    expect(listeners.size).toBe(0);
  });

  it('reads touch capability from the browser snapshot', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 2,
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });
});

/**
 * @jest-environment jsdom
 */

/**
 * Normalization behavior tests for `useFetch` and `useMutation`.
 *
 * These are intentionally lightweight: we mock the API client and assert the
 * hook returns stable shapes for the most common API responses in this repo.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetch, useMutation } from '@/hooks/useFetch';

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const { apiFetch } = jest.requireMock('@/lib/api/client') as {
  apiFetch: jest.Mock;
};

const mockJsonResponse = (payload: any, ok = true, status = ok ? 200 : 400) =>
  Promise.resolve({
    ok,
    status,
    headers: {
      get: (key: string) => (key.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  });

describe('useFetch normalization', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it('wraps raw array responses into an envelope with data + total', async () => {
    apiFetch.mockImplementation(() => mockJsonResponse([{ id: 1 }, { id: 2 }]));

    const { result } = renderHook(() => useFetch<any>('/api/students'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      expect.objectContaining({
        data: [{ id: 1 }, { id: 2 }],
        total: 2,
      })
    );
  });

  it('preserves envelopes like { students, total, statistics }', async () => {
    apiFetch.mockImplementation(() =>
      mockJsonResponse({
        success: true,
        students: [{ id: 's1' }],
        total: 1,
        statistics: { total_students: 1 },
      })
    );

    const { result } = renderHook(() => useFetch<any>('/api/students?page=1&limit=50'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.students).toHaveLength(1);
    expect(result.current.data.total).toBe(1);
    expect(result.current.data.statistics).toEqual({ total_students: 1 });
  });

  it('sets error when success=false', async () => {
    apiFetch.mockImplementation(() => mockJsonResponse({ success: false, error: 'Nope' }));

    const { result } = renderHook(() => useFetch<any>('/api/admin/courses'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Nope');
  });

  it('ignores stale responses when url changes quickly (default cancellation-on)', async () => {
    let resolveFirst!: (value: any) => void;
    const first = new Promise((r) => (resolveFirst = r));

    apiFetch
      // First call: delayed
      .mockImplementationOnce(() => first)
      // Second call: immediate
      .mockImplementationOnce(() => mockJsonResponse({ success: true, data: [{ id: 'new' }] }));

    const { result, rerender } = renderHook(
      ({ url }) => useFetch<any>(url),
      { initialProps: { url: '/api/anything?slow=1' } }
    );

    rerender({ url: '/api/anything?fast=1' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should reflect the second response (new).
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(expect.objectContaining({ data: [{ id: 'new' }] }));

    // Resolve the first (stale) request — it must NOT overwrite state.
    resolveFirst(
      await mockJsonResponse({ success: true, data: [{ id: 'old' }] })
    );

    // Give the microtask queue a turn.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toEqual(expect.objectContaining({ data: [{ id: 'new' }] }));
  });

  it("doesn't fetch when url is empty", async () => {
    const { result } = renderHook(() => useFetch<any>(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('useMutation normalization', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it('returns data when API responds with { success:true, data: ... }', async () => {
    apiFetch.mockImplementation(() => mockJsonResponse({ success: true, data: { id: 'x' } }));

    const { result } = renderHook(() => useMutation('/api/grades', 'POST'));

    let out: any;
    await act(async () => {
      out = await result.current.mutate({ hello: 'world' });
    });

    expect(out).toEqual({ id: 'x' });
  });

  it('throws when success=false', async () => {
    apiFetch.mockImplementation(() => mockJsonResponse({ success: false, error: 'Bad' }, false));

    const { result } = renderHook(() => useMutation('/api/students', 'DELETE'));

    let thrown: any;
    await act(async () => {
      try {
        await result.current.mutate();
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeTruthy();
    expect(thrown.message).toBe('Bad');
  });
});

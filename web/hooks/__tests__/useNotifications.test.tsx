import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client');

const mockCreateClient = jest.mocked(createClient);
const originalFetch = globalThis.fetch;

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }
  });

  it('keeps one Supabase client and one realtime channel across rerenders', async () => {
    const channel = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    channel.on.mockReturnValue(channel);
    channel.subscribe.mockReturnValue(channel);

    const removeChannel = jest.fn();
    const createChannel = jest.fn().mockReturnValue(channel);
    mockCreateClient.mockReturnValue({
      channel: createChannel,
      removeChannel,
    } as unknown as ReturnType<typeof createClient>);

    jest.mocked(globalThis.fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('unread-count')) {
        return { ok: true, json: async () => ({ count: 1 }) } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          notifications: [
            {
              id: 'notification-1',
              user_id: 'user-1',
              title: 'Nhắc lịch học',
              message: 'Bạn có lịch học lúc 18:00.',
              type: 'info',
              is_read: false,
              created_at: '2026-11-16T10:00:00.000Z',
            },
          ],
        }),
      } as Response;
    });

    const { result, rerender, unmount } = renderHook(({ userId }) => useNotifications(userId), {
      initialProps: { userId: 'user-1' },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notifications).toHaveLength(1);

    rerender({ userId: 'user-1' });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(createChannel).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});

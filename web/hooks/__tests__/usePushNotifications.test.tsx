import { act, renderHook, waitFor } from '@testing-library/react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

describe('usePushNotifications', () => {
  const originalVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: jest.fn().mockResolvedValue(null),
          },
        }),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalVapidKey === undefined) {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    } else {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = originalVapidKey;
    }
  });

  it('detects browser support and does not report a false subscription without VAPID', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => expect(result.current.isSupported).toBe(true));
    await waitFor(() => expect(result.current.isSubscribed).toBe(false));

    let subscribed = true;
    await act(async () => {
      subscribed = await result.current.subscribe();
    });

    expect(subscribed).toBe(false);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.permission).toBe('granted');
  });
});

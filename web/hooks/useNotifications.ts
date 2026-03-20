'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ─── Fetch from API ──────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      const data = json.notifications || [];

      setNotifications(data);

      const countRes = await fetch('/api/notifications/unread-count');
      if (countRes.ok) {
        const countJson = await countRes.json();
        setUnreadCount(countJson.count || 0);
      } else {
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ─── Mark One as Read ────────────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch(`/api/notifications/${notificationId}`, {
          method: 'PATCH',
        });
        if (!res.ok) throw new Error();
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // On error, let the next fetch or realtime event fix it
      }
    },
    [userId]
  );

  // ─── Mark All as Read ────────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // ─── Delete Notification ─────────────────────────────────────────────────────
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      const n = notifications.find((x) => x.id === notificationId);
      const wasUnread = n && !n.is_read;

      // Optimistic
      setNotifications((prev) => prev.filter((x) => x.id !== notificationId));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error();
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [userId, notifications]
  );

  // ─── Realtime Logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    // Full Real-time (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Simplest and most robust for list consistency: re-fetch
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications, supabase]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}

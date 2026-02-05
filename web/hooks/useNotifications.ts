"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    is_read: boolean;
    created_at: string;
}

export function useNotifications(userId: string | undefined) {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(
                (data || []).filter((n: Notification) => !n.is_read).length,
            );
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, userId]);

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId)
                .eq("user_id", userId);

            if (error) throw error;

            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }, [supabase, userId]);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) throw error;

            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    }, [supabase, userId]);

    useEffect(() => {
        fetchNotifications();

        if (!userId) return;

        // Real-time subscription
        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload: any) => {
                    const newNotif = payload.new as Notification;
                    setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
                    setUnreadCount((prev) => prev + 1);
                },
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
        refresh: fetchNotifications,
    };
}

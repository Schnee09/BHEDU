"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error loading notifications:", error);
      } else {
        setNotifications((data as Notification[]) || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Icons.Progress className="w-8 h-8 animate-spin text-stone-600" />
          <p>Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Icons.Notifications className="w-8 h-8 text-stone-600" />
            Thông báo
          </h1>
          <p className="text-stone-500 mt-1">Cập nhật với các cảnh báo mới nhất của bạn</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-stone-500">
            <Icons.Notifications className="w-12 h-12 mx-auto mb-3 text-stone-400" />
            <p>Chưa có thông báo nào</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`transition-colors cursor-pointer hover:shadow-md ${
                notification.is_read ? "bg-white" : "bg-stone-50 border-stone-200"
              }`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <CardBody className="flex gap-4">
                <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${
                  notification.is_read ? "bg-stone-100 text-stone-500" : "bg-stone-200 text-stone-700"
                }`}>
                  <Icons.Notifications className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`font-semibold text-lg mb-1 ${
                      notification.is_read ? "text-stone-900" : "text-stone-900"
                    }`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-800">
                        Mới
                      </span>
                    )}
                  </div>
                  <p className="text-stone-600 mb-3 leading-relaxed">{notification.message}</p>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Icons.Calendar className="w-4 h-4" />
                    {new Date(notification.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


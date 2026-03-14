"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/Icons";
import { Bell, Calendar, Check, Mail, Info, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Hệ thống đang đồng bộ thông báo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200/50 dark:border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-accent-glow" />
            <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
              Trung tâm <span className="text-amber-500">Thông báo</span>
            </h1>
          </div>
          <p className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] pl-4">
            Cập nhật những diễn biến quan trọng nhất từ hệ thống
          </p>
        </div>
        <div className="hidden md:block">
          <Badge variant="default" className="px-3 py-1 bg-stone-100 dark:bg-white/5 text-stone-500 font-bold uppercase tracking-widest text-[9px]">
            {notifications.filter(n => !n.is_read).length} thông báo mới
          </Badge>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="py-24 text-center space-y-6">
          <div className="w-20 h-20 bg-stone-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto border border-dashed border-stone-200 dark:border-white/10">
            <Bell className="w-10 h-10 text-stone-300" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">Hộp thư trống</p>
            <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">Hiện tại không có thông báo nào cần xử lý</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 mb-4">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-3 border-l-4 border-amber-500">DANH SÁCH THÔNG BÁO GẦN ĐÂY</p>
          </div>
          <div className="grid grid-cols-1 gap-3 stagger-children">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300 cursor-pointer rounded-2xl border",
                  notification.is_read
                    ? "bg-white/40 dark:bg-stone-900/40 border-stone-100 dark:border-white/5 opacity-80"
                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-white/10 shadow-sm hover:border-amber-500/40 hover:shadow-md"
                )}
              >
                <div className="p-5 flex items-start gap-4 relative z-10">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-3",
                    notification.is_read
                      ? "bg-stone-50 dark:bg-white/5 text-stone-400"
                      : "bg-amber-500/10 text-amber-500 shadow-sm"
                  )}>
                    {notification.is_read ? <Mail className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={cn(
                        "font-black uppercase tracking-tight truncate transition-colors",
                        notification.is_read ? "text-stone-500 dark:text-stone-400 text-sm" : "text-stone-900 dark:text-white text-base group-hover:text-amber-600"
                      )}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <Badge variant="warning" className="text-[8px] px-1.5 py-0 shadow-amber-glow animate-pulse">NEW</Badge>
                      )}
                    </div>

                    <p className={cn(
                      "text-xs leading-relaxed transition-colors",
                      notification.is_read ? "text-stone-400 dark:text-stone-500 font-medium" : "text-stone-600 dark:text-stone-300 font-bold"
                    )}>
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(notification.created_at).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      {notification.is_read && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                          <Check className="w-3 h-3" /> Đã đọc
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="self-center flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-5 h-5 text-stone-300" />
                  </div>
                </div>

                {/* Visual indicator for unread */}
                {!notification.is_read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


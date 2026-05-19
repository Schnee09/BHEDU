'use client';

import { useEffect, useState } from 'react';
import { Megaphone, CalendarDays, TreePalm, AlertTriangle, Info } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  type: 'info' | 'event' | 'holiday' | 'urgent';
  published_at: string;
}

const typeConfig = {
  info: {
    icon: Info,
    label: 'Thông tin',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  event: {
    icon: CalendarDays,
    label: 'Sự kiện',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  holiday: {
    icon: TreePalm,
    label: 'Nghỉ lễ',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  urgent: {
    icon: AlertTriangle,
    label: 'Khẩn cấp',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NoticeBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements?limit=3');
        const json = await res.json();
        setAnnouncements(json.data || []);
      } catch {
        // Silently fail — the section simply won't show
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  // Don't render anything if no announcements
  if (!loading && announcements.length === 0) return null;

  return (
    <section className="w-full py-16 bg-gray-50/80 dark:bg-gray-950/80 relative">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng tin Trung tâm</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {announcements.map((item) => {
              const config = typeConfig[item.type] || typeConfig.info;
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${config.bg} ${config.border}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${config.iconColor}`} />
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeDate(item.published_at)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  {item.content && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {item.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

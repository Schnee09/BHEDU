'use client';

import React from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import { Megaphone, Calendar, AlertCircle, Info, ChevronRight } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'academic' | 'warning' | 'event';
  published_at: string;
}

export default function AnnouncementsFeedWidget() {
  const { data: announcements, loading } = useFetch<Announcement[]>('/api/announcements?limit=5');

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'academic':
        return <Megaphone className="w-5 h-5 text-emerald-500" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-sky-500" />;
      default:
        return <Info className="w-5 h-5 text-amber-500" />;
    }
  };

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'academic':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'event':
        return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20';
      default:
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'warning':
        return 'Quan trọng';
      case 'academic':
        return 'Học tập';
      case 'event':
        return 'Sự kiện';
      default:
        return 'Thông báo';
    }
  };

  return (
    <Card padding="p-0">
      <CardHeader className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl shadow-accent-glow">
            <Megaphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Bảng tin thông báo
            </h3>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
              Cập nhật mới nhất từ nhà trường
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-20 bg-stone-100 dark:bg-stone-855 animate-pulse rounded-2xl" />
            <div className="h-20 bg-stone-100 dark:bg-stone-855 animate-pulse rounded-2xl" />
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="py-12 text-center text-stone-400 font-bold uppercase tracking-widest text-xs">
            Hiện tại chưa có thông báo mới
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="group flex gap-4 p-5 bg-white/45 dark:bg-stone-900/40 border border-stone-200/60 dark:border-white/5 rounded-2xl hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all duration-300"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center">
                    {getAnnouncementIcon(announcement.type)}
                  </div>
                </div>
                <div className="flex-grow space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border',
                        getBadgeStyles(announcement.type)
                      )}
                    >
                      {getBadgeLabel(announcement.type)}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-bold">
                      {new Date(announcement.published_at).toLocaleDateString('vi-VN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h4 className="font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight text-base sm:text-lg group-hover:text-amber-500 transition-colors">
                    {announcement.title}
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed whitespace-pre-line">
                    {announcement.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

'use client';

import React from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

interface AssignmentDeadline {
  id: string;
  title: string;
  dueDate: string;
  className: string;
  subjectName: string;
  subjectCode: string;
}

export default function UpcomingDeadlinesWidget() {
  const { data: stats, loading } = useFetch<any>('/api/student/dashboard');
  const deadlines: AssignmentDeadline[] = stats?.upcomingAssignmentsList || [];

  const getDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysRemainingLabel = (days: number) => {
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Ngày mai';
    if (days > 1) return `Còn ${days} ngày`;
    return 'Quá hạn';
  };

  const getBadgeColorClass = (days: number) => {
    if (days <= 1) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
    if (days <= 3) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <Card padding="p-0" className="h-full border-amber-500/15">
      <CardHeader className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl shadow-accent-glow">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Bài tập sắp hạn
            </h3>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
              Hạn nộp trong vòng 7 ngày tới
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-14 bg-stone-100 dark:bg-stone-850 animate-pulse rounded-2xl" />
            <div className="h-14 bg-stone-100 dark:bg-stone-850 animate-pulse rounded-2xl" />
          </div>
        ) : deadlines.length === 0 ? (
          <div className="py-12 text-center text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs">
            Tuyệt vời! Không có bài tập sắp đến hạn
          </div>
        ) : (
          <div className="space-y-4">
            {deadlines.map((deadline) => {
              const days = getDaysRemaining(deadline.dueDate);
              return (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between p-4 bg-white/45 dark:bg-stone-900/40 border border-stone-200/60 dark:border-white/5 rounded-2xl hover:border-amber-500/30 transition-all duration-300 gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight text-sm sm:text-base truncate">
                      {deadline.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                        {deadline.subjectCode}
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                        Lớp {deadline.className}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border flex-shrink-0',
                      getBadgeColorClass(days)
                    )}
                  >
                    {getDaysRemainingLabel(days)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

'use client';

import React from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Award, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttendanceStatsWidget() {
  const { data: stats, loading } = useFetch<any>('/api/student/dashboard');

  const attendanceRate = stats?.attendanceRate ?? 100;
  const roundedRate = Math.round(attendanceRate);

  // SVG parameters for the circular progress
  const radius = 55;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (roundedRate / 100) * circumference;

  const getStatusText = (rate: number) => {
    if (rate >= 95) return 'Xuất sắc';
    if (rate >= 90) return 'Tốt';
    if (rate >= 80) return 'Khá';
    return 'Cần lưu ý';
  };

  const getStatusColorClass = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card padding="p-0" className="h-full">
      <CardHeader className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl shadow-emerald-glow">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Tỷ lệ chuyên cần
            </h3>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
              Thống kê điểm danh học kỳ
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6 flex flex-col items-center justify-center min-h-[220px]">
        {loading ? (
          <div className="w-32 h-32 rounded-full border-4 border-stone-200 dark:border-stone-850 border-t-amber-500 animate-spin" />
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  className="text-stone-200 dark:text-stone-800"
                />
                {/* Foreground Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={cn(
                    'transition-all duration-1000 ease-out',
                    attendanceRate >= 90
                      ? 'text-emerald-500'
                      : attendanceRate >= 80
                        ? 'text-amber-500'
                        : 'text-red-500'
                  )}
                />
              </svg>
              {/* Central Text */}
              <div className="absolute text-center">
                <span className="text-3xl font-black text-stone-950 dark:text-white tabular-nums tracking-tighter">
                  {attendanceRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                Đánh giá chuyên cần:
              </p>
              <p
                className={cn(
                  'text-base font-black uppercase tracking-tight',
                  getStatusColorClass(attendanceRate)
                )}
              >
                {getStatusText(attendanceRate)}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

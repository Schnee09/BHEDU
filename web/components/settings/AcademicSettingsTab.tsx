'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Edit3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { AcademicYear } from '@/lib/settings/types';
import { cn } from '@/lib/utils';

interface AcademicSettingsTabProps {
  academicYears: AcademicYear[];
  onEditYear: (year: AcademicYear) => void;
  onSetCurrentYear?: (yearId: string) => void;
  onCreateYear?: () => void;
}

export function AcademicSettingsTab({
  academicYears,
  onEditYear,
  onSetCurrentYear,
  onCreateYear,
}: AcademicSettingsTabProps) {
  const calculateProgress = (startDateStr: string, endDateStr: string): number => {
    try {
      const start = new Date(startDateStr).getTime();
      const end = new Date(endDateStr).getTime();
      const now = Date.now();

      if (now <= start) return 0;
      if (now >= end) return 100;

      const total = end - start;
      const current = now - start;
      return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    } catch {
      return 0;
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Overview Card */}
      <div className="p-6 md:p-8 rounded-[32px] bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-900 dark:text-white">
              Cấu trúc Năm học & Học kỳ
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Năm học được kích hoạt sẽ áp dụng tự động cho Thời khóa biểu, Điểm danh và Học phí.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="px-4 py-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/50 dark:border-white/10 text-xs font-bold text-stone-700 dark:text-stone-300">
            Tổng số: <span className="text-amber-500">{academicYears.length}</span> năm học
          </div>
          {onCreateYear && (
            <button
              onClick={onCreateYear}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm năm học
            </button>
          )}
        </div>
      </div>

      {/* Academic Years Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {academicYears.map((year) => {
          const progress = calculateProgress(year.start_date, year.end_date);
          const isCurrent = year.is_current;

          return (
            <div
              key={year.id}
              onClick={() => onEditYear(year)}
              className={cn(
                'group p-8 rounded-[32px] border transition-all duration-500 relative overflow-hidden cursor-pointer flex flex-col justify-between space-y-6',
                isCurrent
                  ? 'bg-white dark:bg-stone-900/90 border-amber-500/40 shadow-xl shadow-amber-500/5 ring-2 ring-amber-500/10'
                  : 'bg-white dark:bg-stone-900/50 border-stone-100 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/20 shadow-sm'
              )}
            >
              {/* Top Row: Icon & Badges */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'p-4 rounded-2xl transition-colors',
                      isCurrent
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-stone-100 dark:bg-white/5 text-stone-500 group-hover:bg-amber-500/10 group-hover:text-amber-500'
                    )}
                  >
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">
                      {year.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      {formatDate(year.start_date)} &mdash; {formatDate(year.end_date)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {isCurrent ? (
                    <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đang kích hoạt
                    </span>
                  ) : year.is_active ? (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                      Sẵn sàng
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-stone-100 dark:bg-white/5 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      Lưu trữ
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Progress Bar */}
              <div className="space-y-2 bg-stone-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-stone-100 dark:border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Tiến độ năm học
                  </span>
                  <span className="font-mono font-bold text-stone-900 dark:text-white">
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-200/60 dark:bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000',
                      isCurrent
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                        : 'bg-stone-400 dark:bg-stone-600'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Bottom Row: Semesters & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-white/5 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 font-bold text-[11px]">
                    Học kỳ 1
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 font-bold text-[11px]">
                    Học kỳ 2
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 font-bold text-[11px]">
                    Học kỳ Hè
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-500 font-black uppercase text-[10px] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Chỉnh sửa</span>
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {academicYears.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-16 text-center space-y-4 rounded-3xl bg-stone-50 dark:bg-white/5 border border-dashed border-stone-200 dark:border-white/10">
            <Calendar className="w-12 h-12 text-stone-400 mx-auto opacity-40" />
            <p className="text-stone-500 font-bold text-sm">Chưa có năm học nào được thiết lập.</p>
          </div>
        )}
      </div>
    </div>
  );
}

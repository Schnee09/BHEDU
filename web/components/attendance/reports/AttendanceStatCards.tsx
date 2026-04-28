'use client';

import React from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface AttendanceStatCardsProps {
  totalRecords: number;
  attendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
  getRateColor: (rate: number) => string;
  t: (key: string) => string;
}

export function AttendanceStatCards({
  totalRecords,
  attendanceRate,
  totalPresent,
  totalAbsent,
  getRateColor,
  t,
}: AttendanceStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl p-8 hover-up transition-all group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-1">
              {t('attendance.report.totalRecords')}
            </p>
            <p className="text-4xl font-black text-stone-900 tracking-tighter">
              {totalRecords}
            </p>
          </div>
          <div className="p-3 bg-stone-100 rounded-2xl group-hover:bg-stone-200 transition-colors">
            <ChartBarIcon className="w-8 h-8 text-stone-400" />
          </div>
        </div>
      </div>

      <div className="glass-premium rounded-[32px] border border-emerald-500/10 shadow-xl p-8 hover-up transition-all group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">
                {t('attendance.report.attendanceRate')}
              </p>
              <p className={`text-4xl font-black tracking-tighter ${getRateColor(attendanceRate)}`}>
                {attendanceRate}%
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <ArrowTrendingUpIcon className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="relative h-2 bg-emerald-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl p-8 col-span-2 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center justify-around h-full">
          <div className="text-center group">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600/60 mb-2">
              {t('attendance.present')}
            </p>
            <p className="text-5xl font-black text-emerald-600 tracking-tighter group-hover:scale-110 transition-transform">
              {totalPresent}
            </p>
            <div className="mt-1 text-[10px] font-bold text-stone-400">{t('attendance.report.presentCount')}</div>
          </div>
          <div className="w-px h-16 bg-stone-100" />
          <div className="text-center group">
            <p className="text-[11px] font-black uppercase tracking-widest text-red-600/60 mb-2">
              {t('attendance.absent')}
            </p>
            <p className="text-5xl font-black text-red-600 tracking-tighter group-hover:scale-110 transition-transform">
              {totalAbsent}
            </p>
            <div className="mt-1 text-[10px] font-bold text-stone-400">{t('attendance.report.absentCount')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

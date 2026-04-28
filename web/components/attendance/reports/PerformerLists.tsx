'use client';

import React from 'react';

interface Performer {
  name: string;
  studentId: string;
  rate: number;
}

interface PerformerListsProps {
  topPerformers: Performer[];
  bottomPerformers: Performer[];
  getRateColor: (rate: number) => string;
  t: (key: string) => string;
}

export function PerformerLists({
  topPerformers,
  bottomPerformers,
  getRateColor,
  t,
}: PerformerListsProps) {
  return (
    <div className="space-y-8">
      <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl p-8 bg-gradient-to-br from-emerald-500/5 to-transparent text-stone-900">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600 mb-8 flex items-center gap-2">
          🏆 {t('attendance.report.topPerformers')}
        </h2>
        <div className="space-y-4">
          {topPerformers.map((student, index) => (
            <div key={`top-${student.studentId || index}`} className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-white shadow-sm border-emerald-500/10">
              <span className="text-sm font-black text-stone-300">#0{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-stone-900 truncate tracking-tight">{student.name}</p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{student.studentId}</p>
              </div>
              <span className={`text-base font-black tracking-tighter ${getRateColor(student.rate)}`}>{student.rate}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl p-8 bg-gradient-to-br from-red-500/5 to-transparent text-stone-900">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-red-600 mb-8 flex items-center gap-2">
          ⚠️ {t('attendance.report.needAttention')}
        </h2>
        <div className="space-y-4">
          {bottomPerformers.map((student, index) => (
            <div key={`bottom-${student.studentId || index}`} className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-white shadow-sm border-red-500/10">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-stone-900 truncate tracking-tight">{student.name}</p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{student.studentId}</p>
              </div>
              <span className={`text-base font-black tracking-tighter ${getRateColor(student.rate)}`}>{student.rate}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

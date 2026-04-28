'use client';

import React from 'react';
import { TableCellsIcon } from '@heroicons/react/24/outline';

interface ClassAttendanceTableProps {
  byClass: Record<string, { name: string; count: number; present: number; rate: number }>;
  getRateColor: (rate: number) => string;
  t: (key: string) => string;
}

export function ClassAttendanceTable({
  byClass,
  getRateColor,
  t,
}: ClassAttendanceTableProps) {
  return (
    <div className="xl:col-span-2 glass-premium rounded-[32px] border border-white/20 shadow-xl p-8">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-stone-400 mb-8 flex items-center gap-2">
         <TableCellsIcon className="w-5 h-5 text-emerald-500" />
         {t('attendance.report.classStats')}
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">{t('students.class')}</th>
              <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{t('dashboard.totalStudents')}</th>
              <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{t('attendance.present')}</th>
              <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest text-stone-400">{t('attendance.rate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {Object.entries(byClass)
              .sort((a, b) => b[1].rate - a[1].rate)
              .map(([classId, stats]) => (
                <tr key={classId} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-4 py-6 text-sm font-bold text-stone-900">{stats.name}</td>
                  <td className="px-4 py-6 text-center text-sm font-bold text-stone-500">{stats.count}</td>
                  <td className="px-4 py-6 text-center text-sm font-bold text-emerald-600">{stats.present}</td>
                  <td className="px-4 py-6 text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-tight ${getRateColor(stats.rate).replace('text-', 'bg-').replace('-600', '-500')} bg-opacity-10 ${getRateColor(stats.rate)}`}>
                      {stats.rate}%
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

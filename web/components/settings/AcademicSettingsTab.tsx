'use client';

import React from 'react';
import Icons from '@/components/ui/Icons';
import { AcademicYear } from '@/lib/settings/types';

interface AcademicSettingsTabProps {
  academicYears: AcademicYear[];
  onEditYear: (year: AcademicYear) => void;
}

export function AcademicSettingsTab({
  academicYears,
  onEditYear,
}: AcademicSettingsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {academicYears.map((year) => (
        <div
          key={year.id}
          onClick={() => onEditYear(year)}
          className="p-8 rounded-[36px] border border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl transition-all duration-700 group hover:-translate-y-1.5 cursor-pointer relative overflow-hidden"
        >
          {year.is_current && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          )}
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-white dark:bg-stone-900 rounded-[22px] shadow-sm group-hover:bg-amber-500 transition-colors group-hover:text-white">
              <Icons.Calendar className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-end">
              {year.is_current && (
                <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                  Active Now
                </span>
              )}
              <span className="text-[11px] font-black text-stone-400 mt-3 opacity-40 group-hover:opacity-100 transition-opacity tracking-widest">
                {year.id.split('-')[0]}
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tight leading-none mb-2">
            {year.name}
          </h3>
          <p className="text-sm text-stone-500 font-medium opacity-60">
            {new Date(year.start_date).toLocaleDateString()} &mdash;{' '}
            {new Date(year.end_date).toLocaleDateString()}
          </p>

          <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            <div className="w-10 h-10 rounded-full bg-stone-900 dark:bg-amber-500 text-white flex items-center justify-center">
              <Icons.Edit className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

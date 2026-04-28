'use client';

import React from 'react';
import { Badge } from '@/components/ui';
import { GradingScale } from '@/lib/settings/types';

interface GradingSettingsTabProps {
  gradingScales: GradingScale[];
}

export function GradingSettingsTab({ gradingScales }: GradingSettingsTabProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gradingScales.map((scale) => (
          <div
            key={scale.id}
            className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 rounded-3xl hover:border-amber-500/30 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white uppercase tracking-tight">
                  {scale.name}
                </h3>
                {scale.description && (
                  <p className="text-xs text-stone-500 mt-1">
                    {scale.description}
                  </p>
                )}
              </div>
              {scale.is_default && (
                <Badge
                  variant="warning"
                  className="text-[9px] px-2 py-0.5 uppercase tracking-widest"
                >
                  Mặc định
                </Badge>
              )}
            </div>
            <div className="flex gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
                  MIN
                </p>
                <p className="font-mono font-bold">{scale.min_score ?? '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
                  MAX
                </p>
                <p className="font-mono font-bold">{scale.max_score ?? '-'}</p>
              </div>
              {scale.grade_letter && (
                <div className="space-y-1">
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
                    GRADE
                  </p>
                  <p className="font-black text-amber-500">
                    {scale.grade_letter}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        {gradingScales.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-12 text-center text-stone-500 font-medium">
            Chưa có thang điểm nào được thiết lập.
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Award, Plus, CheckCircle2, Edit3, Trash2, HelpCircle } from 'lucide-react';
import { GradingScale } from '@/lib/settings/types';
import { cn } from '@/lib/utils';

interface GradingSettingsTabProps {
  gradingScales: GradingScale[];
  onAddScale?: () => void;
  onEditScale?: (scale: GradingScale) => void;
  onDeleteScale?: (scaleId: string) => void;
}

export function GradingSettingsTab({
  gradingScales,
  onAddScale,
  onEditScale,
  onDeleteScale,
}: GradingSettingsTabProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-[32px] bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-900 dark:text-white">
              Thang điểm & Xếp loại học lực
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Quy đổi điểm thi số sang điểm chữ, GPA và phân loại học lực cho bảng điểm học sinh.
            </p>
          </div>
        </div>
        {onAddScale && (
          <button
            onClick={onAddScale}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-amber-600 text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm thang điểm
          </button>
        )}
      </div>

      {/* Grading Scales Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gradingScales.map((scale) => {
          const levels = scale.scale || [];
          const isDefault = scale.is_default;

          return (
            <div
              key={scale.id}
              onClick={() => onEditScale?.(scale)}
              className={cn(
                'group p-8 rounded-[32px] border transition-all duration-500 relative overflow-hidden cursor-pointer space-y-6 flex flex-col justify-between',
                isDefault
                  ? 'bg-white dark:bg-stone-900/90 border-blue-500/40 shadow-xl shadow-blue-500/5 ring-2 ring-blue-500/10'
                  : 'bg-white dark:bg-stone-900/50 border-stone-100 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/20 shadow-sm'
              )}
            >
              <div className="space-y-4">
                {/* Header of Scale */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        'p-3 rounded-2xl transition-colors',
                        isDefault
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'bg-stone-100 dark:bg-white/5 text-stone-500 group-hover:text-blue-500 group-hover:bg-blue-500/10'
                      )}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                        {scale.name}
                      </h4>
                      {scale.description && (
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          {scale.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isDefault && (
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mặc định
                    </span>
                  )}
                </div>

                {/* Visual Scale Levels */}
                {levels.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-1 gap-1.5">
                      {levels.map((lvl, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-white/10 flex items-center justify-center font-black text-stone-800 dark:text-stone-100 text-xs">
                              {lvl.letter}
                            </span>
                            <span className="font-bold text-stone-700 dark:text-stone-300">
                              {lvl.description || 'Mức điểm'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-stone-500 text-[11px]">
                              {lvl.min} &mdash; {lvl.max}
                            </span>
                            {lvl.gpa !== undefined && (
                              <span className="px-2 py-0.5 rounded-md bg-stone-200/50 dark:bg-white/5 font-mono text-[10px] font-bold text-stone-600 dark:text-stone-400">
                                GPA {lvl.gpa.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/5 text-center text-xs text-stone-400 font-medium">
                    Thang điểm chưa có các bậc quy đổi chi tiết.
                  </div>
                )}
              </div>

              {/* Bottom Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-white/5 text-xs">
                <span className="text-[11px] font-mono text-stone-400">
                  {levels.length} bậc xếp loại
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 font-black uppercase text-[10px] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>Chỉnh sửa</span>
                    <Edit3 className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {gradingScales.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-16 text-center space-y-4 rounded-3xl bg-stone-50 dark:bg-white/5 border border-dashed border-stone-200 dark:border-white/10">
            <Award className="w-12 h-12 text-stone-400 mx-auto opacity-40" />
            <p className="text-stone-500 font-bold text-sm">Chưa có thang điểm nào được thiết lập.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

// Types for the matrix
export interface GradeEntry {
  id: string;
  score: number | null;
  component_type: string;
  semester: string;
  academic_year?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
}

interface AcademicMatrixProps {
  grades: any[];
  hideTitle?: boolean;
  emptyMessage?: string;
}

function normalizeComponentType(type?: string): 'midterm' | 'final' {
  if (!type) return 'midterm';
  const t = type.toLowerCase().trim();
  if (['final', 'final_exam', 'cuoi_ky', 'cuoiky', 'semester_final', 'exam', 'end'].includes(t)) {
    return 'final';
  }
  return 'midterm';
}

function calculateAverage(midterm?: number | null, final?: number | null): string {
  if (midterm != null && final != null) {
    return ((midterm + final) / 2).toFixed(1);
  }
  if (midterm != null) return midterm.toFixed(1);
  if (final != null) return final.toFixed(1);
  return '-';
}

function getScoreColor(scoreStr: string) {
  const val = parseFloat(scoreStr);
  if (isNaN(val)) return 'text-stone-400';
  if (val >= 8.0) return 'text-emerald-600 dark:text-emerald-400';
  if (val >= 6.5) return 'text-blue-600 dark:text-blue-400';
  if (val >= 5.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

/**
 * Professional Academic Matrix (Học Bạ) component - TTGD Bùi Hoàng
 * Standardized exclusively on Giữa kỳ (GK 50%) and Cuối kỳ (CK 50%)
 */
export const AcademicMatrix: React.FC<AcademicMatrixProps> = ({
  grades,
  emptyMessage = 'Chưa có bản ghi điểm nào',
}) => {
  // 1. Group by Academic Year
  const yearGroups = React.useMemo(() => {
    const groups: Record<string, { name: string; subjects: Record<string, any> }> = {};

    grades.forEach((g: any) => {
      const yearId = g.academic_year_id || g.academic_year?.id || 'unknown';
      const yearName = g.academic_year?.name || 'Năm học hiện tại';
      const subjectId = g.subject_id || g.subject?.id || 'unknown';
      const subjectName = g.subject?.name || 'Môn học';

      if (!groups[yearId]) {
        groups[yearId] = { name: yearName, subjects: {} };
      }

      if (!groups[yearId].subjects[subjectId]) {
        groups[yearId].subjects[subjectId] = {
          id: subjectId,
          name: subjectName,
          code: g.subject?.code || '',
          midterm: null as number | null,
          final: null as number | null,
        };
      }

      const score = g.score ?? g.points_earned;
      if (typeof score === 'number') {
        const bucket = normalizeComponentType(g.component_type);
        if (bucket === 'midterm') {
          groups[yearId].subjects[subjectId].midterm = score;
        } else if (bucket === 'final') {
          groups[yearId].subjects[subjectId].final = score;
        }
      }
    });

    // Sort years descending (Latest first)
    return Object.entries(groups).sort((a, b) => b[1].name.localeCompare(a[1].name));
  }, [grades]);

  if (yearGroups.length === 0) {
    return (
      <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-stone-400 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-white/10 p-6">
        <Icons.Classes className="w-12 h-12 mb-3 opacity-20 text-stone-400" />
        <p className="font-bold uppercase tracking-wider text-xs max-w-xs text-center leading-relaxed">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      {yearGroups.map(([yearId, yearData]) => (
        <div key={yearId} className="space-y-4 sm:space-y-6">
          {/* Year Header */}
          <div className="flex items-center gap-3 sm:gap-4 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
            <div className="px-3.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200/60 dark:border-white/10 shadow-xs">
              {yearData.name}
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
          </div>

          {/* 1. MOBILE RESPONSIVE CARDS */}
          <div className="block md:hidden space-y-3">
            {Object.values(yearData.subjects).map((subject: any) => {
              const avg = calculateAverage(subject.midterm, subject.final);

              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                        {subject.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 dark:text-white text-sm sm:text-base truncate">
                          {subject.name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                          {subject.code || 'Môn học'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
                        ĐTB môn
                      </div>
                      <div className={cn('text-lg font-bold font-mono', getScoreColor(avg))}>
                        {avg}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 rounded-xl">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Giữa kỳ (50%)
                      </div>
                      <div className="text-base font-bold text-blue-800 dark:text-blue-200 font-mono">
                        {subject.midterm != null ? Number(subject.midterm).toFixed(1) : '-'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                        Cuối kỳ (50%)
                      </div>
                      <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 font-mono">
                        {subject.final != null ? Number(subject.final).toFixed(1) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP ACADEMIC MATRIX TABLE */}
          <div className="hidden md:block">
            <Card className="border border-stone-200/80 dark:border-white/10 shadow-xs bg-white dark:bg-stone-900 rounded-2xl overflow-hidden">
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-stone-50/90 dark:bg-stone-800/80 border-b border-stone-100 dark:border-white/5">
                        <th className="px-5 py-3.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
                          Môn học
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold text-blue-700 dark:text-blue-300 text-center bg-blue-500/5">
                          Điểm Giữa kỳ (50%)
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-center bg-emerald-500/5">
                          Điểm Cuối kỳ (50%)
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold text-stone-600 dark:text-stone-300 text-right">
                          Điểm Tổng kết (TBM)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                      {Object.values(yearData.subjects).map((subject: any) => {
                        const avg = calculateAverage(subject.midterm, subject.final);

                        return (
                          <tr
                            key={subject.id}
                            className="group/row hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  {subject.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-stone-900 dark:text-white">
                                    {subject.name}
                                  </div>
                                  <div className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                                    {subject.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center bg-blue-500/5">
                              <span className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-300 font-mono">
                                {subject.midterm != null ? Number(subject.midterm).toFixed(1) : '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center bg-emerald-500/5">
                              <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                                {subject.final != null ? Number(subject.final).toFixed(1) : '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span
                                className={cn(
                                  'text-base sm:text-lg font-bold font-mono',
                                  getScoreColor(avg)
                                )}
                              >
                                {avg}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
};

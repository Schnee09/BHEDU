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
}

function normalizeComponentType(
  type?: string
): 'oral' | 'fifteen_min' | 'one_period' | 'midterm' | 'final' {
  if (!type) return 'fifteen_min';
  const t = type.toLowerCase().trim();
  if (['oral', 'mieng', 'speaking'].includes(t)) return 'oral';
  if (
    [
      'fifteen_min',
      '15p',
      '15min',
      'quiz',
      'regular',
      'regular_1',
      'regular_2',
      'regular_3',
      'homework',
      'assignment',
    ].includes(t)
  )
    return 'fifteen_min';
  if (
    ['one_period', '1tiet', '1period', '45min', 'period', 'test', 'project', 'unit_test'].includes(
      t
    )
  )
    return 'one_period';
  if (['midterm', 'mid_term', 'giua_ky', 'giuaky', 'midterm_exam'].includes(t)) return 'midterm';
  if (['final', 'final_exam', 'cuoi_ky', 'cuoiky', 'semester_final', 'exam'].includes(t))
    return 'final';
  return 'fifteen_min';
}

/**
 * Professional Academic Matrix (Học Bạ) component
 * Groups grades chronologically by Year -> Subject -> Components
 */
export const AcademicMatrix: React.FC<AcademicMatrixProps> = ({ grades, hideTitle = false }) => {
  // 1. Group by Academic Year
  const yearGroups = React.useMemo(() => {
    const groups: Record<string, { name: string; subjects: Record<string, any> }> = {};

    grades.forEach((g: any) => {
      const yearId = g.academic_year_id || g.academic_year?.id || 'unknown';
      const yearName = g.academic_year?.name || 'Năm học khác';
      const subjectId = g.subject_id || g.subject?.id || 'unknown';
      const subjectName = g.subject?.name || 'Môn học khác';

      if (!groups[yearId]) {
        groups[yearId] = { name: yearName, subjects: {} };
      }

      if (!groups[yearId].subjects[subjectId]) {
        groups[yearId].subjects[subjectId] = {
          id: subjectId,
          name: subjectName,
          code: g.subject?.code || '',
          components: {
            oral: [] as number[],
            fifteen_min: [] as number[],
            one_period: [] as number[],
            midterm: [] as number[],
            final: [] as number[],
          },
        };
      }

      const score = g.score ?? g.points_earned;
      if (typeof score === 'number') {
        const bucket = normalizeComponentType(g.component_type);
        groups[yearId].subjects[subjectId].components[bucket].push(score);
      }
    });

    // Sort years descending (Latest first)
    return Object.entries(groups).sort((a, b) => b[1].name.localeCompare(a[1].name));
  }, [grades]);

  const calculateAvg = (components: Record<string, number[]>) => {
    let weightedSum = 0;
    let totalWeight = 0;

    const oral = components?.['oral'] ?? [];
    const fifteen = components?.['fifteen_min'] ?? [];
    const onePeriod = components?.['one_period'] ?? [];
    const midterm = components?.['midterm'] ?? [];
    const final = components?.['final'] ?? [];

    // Regular assessments (oral + 15min): Weight 1 each
    const regulars = [...oral, ...fifteen];
    regulars.forEach((score) => {
      weightedSum += score * 1;
      totalWeight += 1;
    });

    // 1-period (one_period): Weight 2 each
    onePeriod.forEach((score) => {
      weightedSum += score * 2;
      totalWeight += 2;
    });

    // Midterm: Weight 2
    midterm.forEach((score) => {
      weightedSum += score * 2;
      totalWeight += 2;
    });

    // Final: Weight 3
    final.forEach((score) => {
      weightedSum += score * 3;
      totalWeight += 3;
    });

    if (totalWeight > 0) {
      return (weightedSum / totalWeight).toFixed(1);
    }

    // Simple fallback
    const allScores = Object.values(components || {}).flat();
    if (allScores.length === 0) return '-';
    const sum = allScores.reduce((a, b) => a + b, 0);
    return (sum / allScores.length).toFixed(1);
  };

  const getScoreColor = (score: string) => {
    const val = parseFloat(score);
    if (isNaN(val)) return 'text-stone-400';
    if (val >= 8.0) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 6.5) return 'text-blue-600 dark:text-blue-400';
    if (val >= 5.0) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (yearGroups.length === 0) {
    return (
      <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-stone-400 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-white/10 p-6">
        <Icons.Classes className="w-12 h-12 mb-3 opacity-20 text-stone-400" />
        <p className="font-bold uppercase tracking-wider text-xs max-w-xs text-center leading-relaxed">
          Chưa có bản ghi điểm nào cho học sinh này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {yearGroups.map(([yearId, yearData]) => (
        <div key={yearId} className="space-y-4 sm:space-y-6">
          {/* Year Header */}
          <div className="flex items-center gap-3 sm:gap-4 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
            <div className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-sm">
              {yearData.name}
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
          </div>

          {/* 1. MOBILE RESPONSIVE CARDS (Visible on mobile screens) */}
          <div className="block md:hidden space-y-3">
            {Object.values(yearData.subjects).map((subject: any) => {
              const avg = calculateAvg(subject.components);
              const regulars = subject.components.oral.concat(subject.components.fifteen_min);

              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-white/5 pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 font-black text-xs flex items-center justify-center shrink-0">
                        {subject.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-stone-900 dark:text-white text-sm uppercase truncate">
                          {subject.name}
                        </div>
                        <div className="text-[10px] font-bold text-stone-400 font-mono">
                          {subject.code || 'MON-HOC'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] font-black uppercase text-stone-400">ĐTB Môn</div>
                      <div className={cn('text-lg font-black', getScoreColor(avg))}>{avg}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <div className="text-[9px] font-black uppercase text-stone-400 mb-1">
                        TX (M/15&apos;)
                      </div>
                      <div className="font-bold text-stone-700 dark:text-stone-300">
                        {regulars.length > 0 ? regulars.join(', ') : '-'}
                      </div>
                    </div>
                    <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <div className="text-[9px] font-black uppercase text-stone-400 mb-1">
                        1 Tiết
                      </div>
                      <div className="font-bold text-stone-700 dark:text-stone-300">
                        {subject.components.one_period.length > 0
                          ? subject.components.one_period.join(', ')
                          : '-'}
                      </div>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/40 dark:border-blue-800/30 rounded-xl">
                      <div className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 mb-1">
                        Giữa kỳ
                      </div>
                      <div className="font-black text-blue-700 dark:text-blue-300">
                        {subject.components.midterm.length > 0
                          ? subject.components.midterm.join(', ')
                          : '-'}
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/40 dark:border-emerald-800/30 rounded-xl">
                      <div className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                        Cuối kỳ
                      </div>
                      <div className="font-black text-emerald-700 dark:text-emerald-300">
                        {subject.components.final.length > 0
                          ? subject.components.final.join(', ')
                          : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP ACADEMIC MATRIX TABLE */}
          <div className="hidden md:block">
            <Card className="border border-stone-200/80 dark:border-white/10 shadow-sm bg-white dark:bg-stone-900 rounded-3xl overflow-hidden">
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-stone-50/90 dark:bg-stone-800/80 border-b border-stone-100 dark:border-white/5">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-stone-400">
                          Môn học
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-stone-400 text-center">
                          TX (Miệng / 15&apos;)
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-stone-400 text-center">
                          Định kỳ (1 Tiết)
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 text-center bg-blue-500/5">
                          Giữa kỳ (x2)
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-center bg-emerald-500/5">
                          Cuối kỳ (x3)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-stone-400 text-right">
                          TBM
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                      {Object.values(yearData.subjects).map((subject: any) => {
                        const avg = calculateAvg(subject.components);
                        const regulars = subject.components.oral.concat(
                          subject.components.fifteen_min
                        );

                        return (
                          <tr
                            key={subject.id}
                            className="group/row hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-xs">
                                  {subject.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">
                                    {subject.name}
                                  </div>
                                  <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
                                    {subject.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {regulars.length > 0 ? (
                                  regulars.map((score: any, i: number) => (
                                    <span
                                      key={i}
                                      className="text-xs font-bold text-stone-700 dark:text-stone-300"
                                    >
                                      {score}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-stone-300 dark:text-stone-700">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {subject.components.one_period.length > 0 ? (
                                  subject.components.one_period.map((score: any, i: number) => (
                                    <span
                                      key={i}
                                      className="text-xs font-bold text-stone-700 dark:text-stone-300"
                                    >
                                      {score}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-stone-300 dark:text-stone-700">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center bg-blue-500/5">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {subject.components.midterm.length > 0 ? (
                                  subject.components.midterm.map((score: any, i: number) => (
                                    <span
                                      key={i}
                                      className="text-sm font-black text-blue-600 dark:text-blue-400"
                                    >
                                      {score}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-stone-300 dark:text-stone-700">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center bg-emerald-500/5">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {subject.components.final.length > 0 ? (
                                  subject.components.final.map((score: any, i: number) => (
                                    <span
                                      key={i}
                                      className="text-sm font-black text-emerald-600 dark:text-emerald-400"
                                    >
                                      {score}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-stone-300 dark:text-stone-700">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div
                                className={cn(
                                  'text-base font-black tracking-tight font-mono',
                                  getScoreColor(avg)
                                )}
                              >
                                {avg}
                              </div>
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

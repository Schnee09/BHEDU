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
            'oral': [],
            'fifteen_min': [],
            'one_period': [],
            'midterm': [],
            'final': []
          }
        };
      }

      const score = g.score ?? g.points_earned;
      if (typeof score === 'number' && groups[yearId].subjects[subjectId].components[g.component_type]) {
        groups[yearId].subjects[subjectId].components[g.component_type].push(score);
      }
    });

    // Sort years descending? (Latest first)
    return Object.entries(groups).sort((a, b) => b[1].name.localeCompare(a[1].name));
  }, [grades]);

  const calculateAvg = (components: Record<string, number[]>) => {
    let sum = 0;
    let count = 0;
    Object.values(components).flat().forEach(score => {
      sum += score;
      count++;
    });
    return count > 0 ? (sum / count).toFixed(1) : '-';
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
      <div className="py-20 flex flex-col items-center justify-center text-stone-400">
        <Icons.Classes className="w-16 h-16 mb-4 opacity-10" />
        <p className="font-bold uppercase tracking-widest text-[10px] max-w-[200px] text-center leading-relaxed">
          Chưa có bản ghi điểm nào cho học sinh này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {yearGroups.map(([yearId, yearData]) => (
        <div key={yearId} className="space-y-6">
          {/* Year Header */}
          <div className="flex items-center gap-4 px-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
            <div className="px-6 py-2 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-black uppercase tracking-[0.3em]">
              {yearData.name}
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
          </div>

          <Card className="border-none shadow-ultra bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-stone-50/50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-white/5">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Môn học</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">TX (M/15')</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">Định kỳ (1T)</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center bg-blue-500/5">Giữa kỳ</th>
                      <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center bg-emerald-500/5">Cuối kỳ</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">TBM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                    {Object.values(yearData.subjects).map((subject: any) => {
                      const avg = calculateAvg(subject.components);
                      return (
                        <tr key={subject.id} className="group/row hover:bg-stone-50/50 dark:hover:bg-amber-500/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold group-hover/row:scale-110 transition-transform">
                                {subject.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">{subject.name}</div>
                                <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{subject.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex items-center justify-center gap-1.5">
                              {subject.components.oral.concat(subject.components.fifteen_min).length > 0 ? (
                                subject.components.oral.concat(subject.components.fifteen_min).map((score: any, i: number) => (
                                  <span key={i} className="text-xs font-bold text-stone-600 dark:text-stone-400">{score}</span>
                                ))
                              ) : <span className="text-stone-300 dark:text-stone-700">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex items-center justify-center gap-1.5">
                              {subject.components.one_period.length > 0 ? (
                                subject.components.one_period.map((score: any, i: number) => (
                                  <span key={i} className="text-xs font-bold text-stone-600 dark:text-stone-400">{score}</span>
                                ))
                              ) : <span className="text-stone-300 dark:text-stone-700">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-6 bg-blue-500/5">
                            <div className="flex items-center justify-center gap-1.5">
                              {subject.components.midterm.length > 0 ? (
                                subject.components.midterm.map((score: any, i: number) => (
                                  <span key={i} className="text-base font-black text-blue-600 dark:text-blue-400">{score}</span>
                                ))
                              ) : <span className="text-stone-300 dark:text-stone-700">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-6 bg-emerald-500/5">
                            <div className="flex items-center justify-center gap-1.5">
                              {subject.components.final.length > 0 ? (
                                subject.components.final.map((score: any, i: number) => (
                                  <span key={i} className="text-base font-black text-emerald-600 dark:text-emerald-400">{score}</span>
                                ))
                              ) : <span className="text-stone-300 dark:text-stone-700">-</span>}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className={cn("text-xl font-black tracking-tighter", getScoreColor(avg))}>
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
      ))}
    </div>
  );
};

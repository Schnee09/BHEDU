'use client';

import React from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

interface Grade {
  id: string;
  score: number;
  points_earned?: number;
  component_type: string;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
}

interface RecentGradesWidgetProps {
  dataUrl: string;
  title?: string;
  showStudentColumn?: boolean;
}

export default function RecentGradesWidget({
  dataUrl,
  title = 'Điểm số vừa nhập',
  showStudentColumn = true,
}: RecentGradesWidgetProps) {
  const { data: rawData, loading } = useFetch<{ data?: Grade[] } | Grade[]>(dataUrl);

  const grades: Grade[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  const getComponentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      quiz: 'Kiểm tra nhanh',
      homework: 'Bài tập về nhà',
      midterm: 'Giữa kỳ',
      final: 'Cuối kỳ',
      classwork: 'Bài tập trên lớp',
      attendance: 'Chuyên cần',
    };
    return types[type] || type;
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 8.0)
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 5.0)
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <Card padding="p-0">
      <CardHeader className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl shadow-emerald-glow">
            <Icons.Grades className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              {title}
            </h3>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
              Hiển thị tối đa 20 bản ghi gần nhất
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-10 bg-stone-100 dark:bg-stone-850 animate-pulse rounded-xl" />
            <div className="h-10 bg-stone-100 dark:bg-stone-850 animate-pulse rounded-xl" />
            <div className="h-10 bg-stone-100 dark:bg-stone-850 animate-pulse rounded-xl" />
          </div>
        ) : !grades || grades.length === 0 ? (
          <div className="py-12 text-center text-stone-400 font-bold uppercase tracking-widest text-xs">
            Chưa có ghi nhận điểm số nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/2 border-b border-stone-200/40 dark:border-white/5 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                  {showStudentColumn && <th className="p-4 text-left pl-6">Học sinh</th>}
                  <th className="p-4 text-left">Môn / Lớp</th>
                  <th className="p-4 text-left">Loại điểm</th>
                  <th className="p-4 text-center">Điểm số</th>
                  <th className="p-4 text-right pr-6">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/5 font-medium text-stone-700 dark:text-stone-300 text-sm">
                {grades.map((grade) => (
                  <tr
                    key={grade.id}
                    className="hover:bg-stone-500/2 dark:hover:bg-white/1 transition-colors"
                  >
                    {showStudentColumn && (
                      <td className="p-4 pl-6 font-black text-stone-900 dark:text-white uppercase tracking-tight">
                        {grade.student?.full_name || 'N/A'}
                      </td>
                    )}
                    <td className="p-4">
                      <div className="font-bold text-stone-900 dark:text-white">
                        {grade.subject?.name || 'Môn học'}
                      </div>
                      {grade.class?.name && (
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                          Lớp: {grade.class.name}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs font-bold text-stone-500 dark:text-stone-400">
                      {getComponentTypeLabel(grade.component_type)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-10 h-8 rounded-xl font-black text-base border tabular-nums',
                          getScoreColorClass(grade.score)
                        )}
                      >
                        {grade.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6 text-xs text-stone-400 dark:text-stone-500">
                      {new Date(grade.created_at).toLocaleDateString('vi-VN', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

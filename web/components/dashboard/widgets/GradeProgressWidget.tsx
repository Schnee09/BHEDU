'use client';

import React, { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { AnalyticsWidget } from '@/components/dashboard/AnalyticsWidget';
import { TrendingUp } from 'lucide-react';

interface Grade {
  id: string;
  score: number;
  created_at: string;
}

export default function GradeProgressWidget() {
  const { data: rawData, loading } = useFetch<{ data?: Grade[] } | Grade[]>('/api/grades');

  const grades: Grade[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  const chartData = useMemo(() => {
    if (!grades || grades.length === 0) return [];

    // Group scores by YYYY-MM
    const monthlyGroups: Record<string, number[]> = {};

    grades.forEach((grade) => {
      const date = new Date(grade.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(grade.score);
    });

    // Format for chart and sort chronologically
    return Object.entries(monthlyGroups)
      .map(([monthKey, scores]) => {
        const [year, month] = monthKey.split('-');
        const yearStr = year ? year.substring(2) : '';
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        return {
          name: `Tháng ${month || ''}/${yearStr}`,
          'Điểm TB': parseFloat(avg.toFixed(2)),
          monthKey,
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [grades]);

  return (
    <AnalyticsWidget
      title="Tiến trình học tập"
      subtitle="Biến động điểm trung bình theo tháng"
      chartType="area"
      data={chartData}
      dataKey="Điểm TB"
      xAxisKey="name"
      height={280}
      loading={loading}
      emptyMessage="Chưa có dữ liệu điểm số"
      icon={<TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
    />
  );
}

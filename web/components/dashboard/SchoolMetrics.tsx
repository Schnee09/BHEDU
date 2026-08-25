import { useMemo } from 'react';
import { StatCard } from '@/components/ui/Card';
import { generateSchoolMetrics, SchoolMetricsData } from './config/school-metrics-config';

interface SchoolMetricsProps extends SchoolMetricsData {
  loading?: boolean;
}

export default function SchoolMetrics({
  totalStudents,
  totalTeachers,
  totalClasses,
  averageGPA,
  attendanceRate,
  passRate,
  trends,
  loading = false,
}: SchoolMetricsProps) {
  const metrics = useMemo(
    () =>
      generateSchoolMetrics({
        totalStudents,
        totalTeachers,
        totalClasses,
        averageGPA,
        attendanceRate,
        passRate,
        trends,
      }),
    [totalStudents, totalTeachers, totalClasses, averageGPA, attendanceRate, passRate, trends]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-stone-100 dark:bg-white/5 rounded-2xl animate-pulse border border-stone-200/50 dark:border-white/5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4 animate-in fade-in duration-500">
      {metrics.map((metric, index) => (
        <StatCard
          key={index}
          label={metric.label}
          value={`${metric.value}${metric.suffix}`}
          icon={metric.icon}
          color={metric.color}
          trend={
            metric.trend !== undefined
              ? {
                  value: Math.abs(metric.trend),
                  isPositive: metric.trend >= 0,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

export { SchoolMetrics };

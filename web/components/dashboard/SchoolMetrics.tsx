'use client';

/**
 * School Metrics Component
 * 
 * Displays overall school statistics with beautiful stat cards
 * and trend indicators.
 */

import { useMemo } from 'react';
import { Card, StatCard } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

interface SchoolMetricsProps {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    averageGPA: number;
    attendanceRate: number;
    passRate: number;
    trends?: {
        students: number; // percentage change
        gpa: number;
        attendance: number;
    };
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
    const metrics = useMemo(() => [
        {
            label: 'Tổng số học sinh',
            value: totalStudents,
            icon: <Icons.Students className="w-6 h-6" />,
            color: 'blue' as const,
            trend: trends?.students,
            suffix: '',
        },
        {
            label: 'Giáo viên',
            value: totalTeachers,
            icon: <Icons.Teachers className="w-6 h-6" />,
            color: 'purple' as const,
            suffix: '',
        },
        {
            label: 'Lớp học',
            value: totalClasses,
            icon: <Icons.Classes className="w-6 h-6" />,
            color: 'green' as const,
            suffix: '',
        },
        {
            label: 'Điểm TB toàn trường',
            value: averageGPA.toFixed(2),
            icon: <Icons.Grades className="w-6 h-6" />,
            color: 'orange' as const,
            trend: trends?.gpa,
            suffix: '/10',
        },
        {
            label: 'Tỷ lệ đi học',
            value: attendanceRate.toFixed(1),
            icon: <Icons.Attendance className="w-6 h-6" />,
            color: 'slate' as const,
            trend: trends?.attendance,
            suffix: '%',
        },
        {
            label: 'Tỷ lệ đạt yêu cầu',
            value: passRate.toFixed(1),
            icon: <Icons.Success className="w-6 h-6" />,
            color: 'blue' as const,
            suffix: '%',
        },
    ], [totalStudents, totalTeachers, totalClasses, averageGPA, attendanceRate, passRate, trends]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-6 animate-pulse">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="h-4 bg-muted/20 rounded w-24 mb-2" />
                                <div className="h-8 bg-muted/20 rounded w-16" />
                            </div>
                            <div className="w-12 h-12 bg-muted/20 rounded-lg" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {metrics.map((metric, index) => (
                <StatCard
                    key={index}
                    label={metric.label}
                    value={`${metric.value}${metric.suffix}`}
                    icon={metric.icon}
                    color={metric.color}
                    trend={metric.trend !== undefined ? {
                        value: Math.abs(metric.trend),
                        isPositive: metric.trend >= 0,
                    } : undefined}
                />
            ))}
        </div>
    );
}

export { SchoolMetrics };

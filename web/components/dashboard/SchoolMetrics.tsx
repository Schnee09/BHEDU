import { useMemo } from 'react';
import { Card, StatCard } from '@/components/ui/Card';
import { Users, BookOpen, GraduationCap, BarChart3, Clock, CheckCircle2 } from 'lucide-react';

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
            icon: <Users className="w-5 h-5" />,
            color: 'blue' as const,
            trend: trends?.students,
            suffix: '',
        },
        {
            label: 'Đội ngũ giáo viên',
            value: totalTeachers,
            icon: <BookOpen className="w-5 h-5" />,
            color: 'purple' as const,
            suffix: '',
        },
        {
            label: 'Số lượng lớp học',
            value: totalClasses,
            icon: <LayersIcon className="w-5 h-5" />,
            color: 'slate' as const,
            suffix: '',
        },
        {
            label: 'Điểm trung bình (GPA)',
            value: averageGPA.toFixed(2),
            icon: <GraduationCap className="w-5 h-5" />,
            color: 'amber' as const,
            trend: trends?.gpa,
            suffix: '',
        },
        {
            label: 'Tỷ lệ chuyên cần',
            value: attendanceRate.toFixed(1),
            icon: <Clock className="w-5 h-5" />,
            color: 'blue' as const,
            trend: trends?.attendance,
            suffix: '%',
        },
        {
            label: 'Tỷ lệ đạt yêu cầu',
            value: passRate.toFixed(1),
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: 'green' as const,
            suffix: '%',
        },
    ], [totalStudents, totalTeachers, totalClasses, averageGPA, attendanceRate, passRate, trends]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-stone-100 dark:bg-white/5 rounded-2xl animate-pulse border border-stone-200/50 dark:border-white/5" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
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

function LayersIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    );
}

export { SchoolMetrics };

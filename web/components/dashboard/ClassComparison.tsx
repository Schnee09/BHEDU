'use client';

/**
 * Class Comparison Component
 * 
 * Compares performance metrics across different classes
 * with sortable tables and visualization options.
 */

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ClassData {
    classId: string;
    className: string;
    teacherName: string;
    studentCount: number;
    averageGPA: number;
    attendanceRate: number;
    passRate: number;
}

interface ClassComparisonProps {
    classes: ClassData[];
    loading?: boolean;
}

type SortField = 'className' | 'averageGPA' | 'attendanceRate' | 'passRate' | 'studentCount';
type ViewMode = 'table' | 'chart';

export default function ClassComparison({ classes, loading = false }: ClassComparisonProps) {
    const [sortField, setSortField] = useState<SortField>('averageGPA');
    const [sortAsc, setSortAsc] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    const sortedClasses = useMemo(() => {
        return [...classes].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [classes, sortField, sortAsc]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    const getGPAColor = (gpa: number) => {
        if (gpa >= 8.0) return '#10b981'; // emerald
        if (gpa >= 6.5) return '#3b82f6'; // blue
        if (gpa >= 5.0) return '#f59e0b'; // amber
        return '#ef4444'; // red
    };

    const getGPABadgeVariant = (gpa: number): 'success' | 'info' | 'warning' | 'error' => {
        if (gpa >= 8.0) return 'success';
        if (gpa >= 6.5) return 'info';
        if (gpa >= 5.0) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="h-6 bg-muted/20 rounded w-48 animate-pulse" />
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />
                        ))}
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">So sánh lớp học</h3>
                        <p className="text-sm text-muted-foreground">
                            Xếp hạng theo {sortField === 'averageGPA' ? 'điểm TB' : sortField === 'attendanceRate' ? 'tỷ lệ đi học' : sortField === 'passRate' ? 'tỷ lệ đạt' : 'số học sinh'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'table' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                        >
                            Bảng
                        </Button>
                        <Button
                            variant={viewMode === 'chart' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('chart')}
                        >
                            Biểu đồ
                        </Button>
                    </div>
                </div>
            </div>

            {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    #
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('className')}
                                >
                                    Lớp {sortField === 'className' && (sortAsc ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Giáo viên
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('studentCount')}
                                >
                                    Sĩ số {sortField === 'studentCount' && (sortAsc ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('averageGPA')}
                                >
                                    Điểm TB {sortField === 'averageGPA' && (sortAsc ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('attendanceRate')}
                                >
                                    Đi học {sortField === 'attendanceRate' && (sortAsc ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('passRate')}
                                >
                                    Đạt YC {sortField === 'passRate' && (sortAsc ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sortedClasses.map((cls, index) => (
                                <tr key={cls.classId} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-4 py-4 text-sm">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                            index === 1 ? 'bg-slate-100 text-slate-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-muted text-muted-foreground'
                                            }`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-medium text-foreground">{cls.className}</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {cls.teacherName}
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm">
                                        {cls.studentCount}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <Badge variant={getGPABadgeVariant(cls.averageGPA)}>
                                            {cls.averageGPA.toFixed(2)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm">
                                        <span className={cls.attendanceRate >= 90 ? 'text-emerald-600' : cls.attendanceRate >= 80 ? 'text-amber-600' : 'text-red-600'}>
                                            {cls.attendanceRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm">
                                        <span className={cls.passRate >= 90 ? 'text-emerald-600' : cls.passRate >= 70 ? 'text-amber-600' : 'text-red-600'}>
                                            {cls.passRate.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={sortedClasses.slice(0, 10)}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                            <XAxis type="number" domain={[0, 10]} stroke="var(--text-muted)" />
                            <YAxis
                                type="category"
                                dataKey="className"
                                stroke="var(--text-muted)"
                                width={90}
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [value.toFixed(2), 'Điểm TB']}
                            />
                            <Bar dataKey="averageGPA" radius={[0, 4, 4, 0]} maxBarSize={30}>
                                {sortedClasses.slice(0, 10).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getGPAColor(entry.averageGPA)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
}

export { ClassComparison };

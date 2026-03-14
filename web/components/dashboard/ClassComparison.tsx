import { useState, useMemo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutGrid, List, RefreshCw, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        if (gpa >= 6.5) return '#0ea5e9'; // sky/light-blue
        if (gpa >= 5.0) return '#f59e0b'; // amber
        return '#ef4444'; // red
    };

    const getGPABadgeVariant = (gpa: number): 'success' | 'info' | 'warning' | 'danger' => {
        if (gpa >= 8.0) return 'success';
        if (gpa >= 6.5) return 'info';
        if (gpa >= 5.0) return 'warning';
        return 'danger';
    };

    if (loading) {
        return (
            <Card padding="p-0">
                <CardHeader className="flex items-center gap-3 border-b border-stone-100 dark:border-white/5">
                    <div className="w-6 h-6 bg-stone-100 dark:bg-white/5 animate-pulse rounded" />
                    <div className="h-5 bg-stone-100 dark:bg-white/5 rounded w-48 animate-pulse" />
                </CardHeader>
                <CardBody className="p-0">
                    <div className="space-y-0.5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-14 bg-stone-50/50 dark:bg-white/5 animate-pulse" />
                        ))}
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card padding="p-0" className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-white/5 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl shadow-accent-glow">
                        <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">So sánh lớp học</h3>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                            Sắp xếp: {sortField === 'averageGPA' ? 'Điểm TB' : sortField === 'attendanceRate' ? 'Đi học' : sortField === 'passRate' ? 'Tỷ lệ đạt' : 'Sĩ số'}
                        </p>
                    </div>
                </div>
                <div className="flex p-1 bg-stone-100 dark:bg-white/5 rounded-lg border border-stone-200 dark:border-white/10">
                    <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all",
                            viewMode === 'table' ? "bg-white dark:bg-white/10 text-stone-900 dark:text-white shadow-sm" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                        )}
                    >
                        <List className="w-3 h-3" />
                        Bảng
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all",
                            viewMode === 'chart' ? "bg-white dark:bg-white/10 text-stone-900 dark:text-white shadow-sm" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                        )}
                    >
                        <LayoutGrid className="w-3 h-3" />
                        Biểu đồ
                    </button>
                </div>
            </CardHeader>

            <CardBody className="p-0 overflow-hidden">
                {viewMode === 'table' ? (
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 w-16">#</th>
                                    <th
                                        className="px-4 py-4 cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={() => handleSort('className')}
                                    >
                                        Lớp {sortField === 'className' && (sortAsc ? '↑' : '↓')}
                                    </th>
                                    <th className="px-4 py-4">Giáo viên</th>
                                    <th
                                        className="px-4 py-4 text-center cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={() => handleSort('studentCount')}
                                    >
                                        Sĩ số {sortField === 'studentCount' && (sortAsc ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="px-4 py-4 text-center cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={() => handleSort('averageGPA')}
                                    >
                                        Điểm TB {sortField === 'averageGPA' && (sortAsc ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="px-4 py-4 text-center cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={() => handleSort('attendanceRate')}
                                    >
                                        Đi học {sortField === 'attendanceRate' && (sortAsc ? '↑' : '↓')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                                {sortedClasses.map((cls, index) => (
                                    <tr key={cls.classId} className="group hover:bg-stone-50 dark:hover:bg-white/5 transition-all duration-300">
                                        <td className="px-6 py-5">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                                index === 0 ? 'bg-amber-500/10 text-amber-600 shadow-accent-glow' :
                                                    index === 1 ? 'bg-slate-500/10 text-slate-600' :
                                                        index === 2 ? 'bg-orange-500/10 text-orange-600' :
                                                            'bg-stone-100 dark:bg-white/5 text-stone-400'
                                            )}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            <span className="font-black text-stone-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase tracking-tight text-sm">{cls.className}</span>
                                        </td>
                                        <td className="px-4 py-5 font-bold text-stone-500 dark:text-stone-400 text-xs">
                                            {cls.teacherName}
                                        </td>
                                        <td className="px-4 py-5 text-center font-black text-stone-400 tabular-nums">
                                            {cls.studentCount}
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <Badge variant={getGPABadgeVariant(cls.averageGPA)} className="font-black tracking-tighter tabular-nums px-3">
                                                {cls.averageGPA.toFixed(2)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className={cn(
                                                "text-xs font-black tabular-nums tracking-tighter px-2 py-1 rounded-md bg-stone-50 dark:bg-white/5",
                                                cls.attendanceRate >= 90 ? 'text-emerald-600' : cls.attendanceRate >= 80 ? 'text-amber-600' : 'text-red-600'
                                            )}>
                                                {cls.attendanceRate.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8">
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart
                                data={sortedClasses.slice(0, 10)}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                <XAxis
                                    type="number"
                                    domain={[0, 10]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="className"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 900, fill: '#44403C' }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #E7E5E4',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        padding: '12px'
                                    }}
                                    labelStyle={{ fontWeight: 900, color: '#1C1917', marginBottom: '4px', textTransform: 'uppercase' }}
                                    itemStyle={{ fontSize: 12, fontWeight: 700 }}
                                    formatter={(value: any) => [Number(value).toFixed(2), 'Điểm trung bình']}
                                />
                                <Bar dataKey="averageGPA" radius={[0, 6, 6, 0]} barSize={24}>
                                    {sortedClasses.slice(0, 10).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getGPAColor(entry.averageGPA)} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export { ClassComparison };

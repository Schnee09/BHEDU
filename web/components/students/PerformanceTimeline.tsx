'use client';

/**
 * Performance Timeline Component
 * 
 * Visualizes a student's academic performance over time
 * with GPA trend charts, milestone markers, and event annotations.
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    AreaChart,
} from 'recharts';

interface TimelineEvent {
    date: string;
    type: 'grade' | 'attendance' | 'achievement' | 'warning';
    title: string;
    description?: string;
}

interface SemesterData {
    semester: string;
    gpa: number;
    classAverage?: number;
    rank?: number;
    credits?: number;
}

interface PerformanceTimelineProps {
    semesters: SemesterData[];
    events?: TimelineEvent[];
    targetGPA?: number;
    showClassAverage?: boolean;
    height?: number;
}

export default function PerformanceTimeline({
    semesters,
    events = [],
    targetGPA = 8.0,
    showClassAverage = true,
    height = 300,
}: PerformanceTimelineProps) {
    const chartData = useMemo(() => {
        return semesters.map(s => ({
            name: s.semester,
            gpa: s.gpa,
            classAverage: s.classAverage,
            rank: s.rank,
            credits: s.credits,
        }));
    }, [semesters]);

    const stats = useMemo(() => {
        if (semesters.length === 0) return null;

        const gpas = semesters.map(s => s.gpa);
        const highest = Math.max(...gpas);
        const lowest = Math.min(...gpas);
        const current = gpas[gpas.length - 1];
        const average = gpas.reduce((a, b) => a + b, 0) / gpas.length;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (semesters.length >= 2) {
            const diff = current - gpas[gpas.length - 2];
            if (diff > 0.2) trend = 'up';
            else if (diff < -0.2) trend = 'down';
        }

        return { highest, lowest, current, average, trend };
    }, [semesters]);

    const getGPAColor = (gpa: number) => {
        if (gpa >= 8.0) return '#10b981';
        if (gpa >= 6.5) return '#3b82f6';
        if (gpa >= 5.0) return '#f59e0b';
        return '#ef4444';
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        return (
            <div className="bg-surface border border-border rounded-lg shadow-lg p-3">
                <p className="font-medium text-sm text-foreground mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Điểm TB:</span>
                        <span className="text-sm font-semibold" style={{ color: getGPAColor(data.gpa) }}>
                            {data.gpa.toFixed(2)}
                        </span>
                    </div>
                    {data.classAverage && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-muted-foreground">TB lớp:</span>
                            <span className="text-sm">{data.classAverage.toFixed(2)}</span>
                        </div>
                    )}
                    {data.rank && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Xếp hạng:</span>
                            <span className="text-sm">#{data.rank}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-semibold text-lg">Tiến trình học tập</h3>
                        <p className="text-sm text-muted-foreground">
                            Diễn biến điểm trung bình qua các học kỳ
                        </p>
                    </div>
                    {stats && (
                        <div className="flex items-center gap-2">
                            <Badge variant={stats.trend === 'up' ? 'success' : stats.trend === 'down' ? 'danger' : 'info'}>
                                {stats.trend === 'up' ? '↑ Tiến bộ' : stats.trend === 'down' ? '↓ Giảm' : '→ Ổn định'}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 rounded-lg bg-muted/5">
                            <div className="text-2xl font-bold" style={{ color: getGPAColor(stats.current) }}>
                                {stats.current.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Hiện tại</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/5">
                            <div className="text-2xl font-bold text-emerald-600">{stats.highest.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Cao nhất</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/5">
                            <div className="text-2xl font-bold text-amber-600">{stats.lowest.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Thấp nhất</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/5">
                            <div className="text-2xl font-bold text-blue-600">{stats.average.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Trung bình</div>
                        </div>
                    </div>
                )}

                {/* Chart */}
                <div style={{ height }}>
                    {semesters.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Chưa có dữ liệu
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 10]}
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />

                                {/* Target GPA Reference Line */}
                                <ReferenceLine
                                    y={targetGPA}
                                    stroke="#10b981"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: `Mục tiêu: ${targetGPA}`,
                                        position: 'right',
                                        fill: '#10b981',
                                        fontSize: 11,
                                    }}
                                />

                                {/* Pass threshold */}
                                <ReferenceLine
                                    y={5.0}
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    strokeOpacity={0.5}
                                />

                                {/* Class Average */}
                                {showClassAverage && (
                                    <Line
                                        type="monotone"
                                        dataKey="classAverage"
                                        stroke="#94a3b8"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name="TB Lớp"
                                    />
                                )}

                                {/* Student GPA */}
                                <Area
                                    type="monotone"
                                    dataKey="gpa"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fill="url(#gpaGradient)"
                                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                                    activeDot={{ r: 7, strokeWidth: 0 }}
                                    name="Điểm TB"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Events Timeline */}
                {events.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border">
                        <h4 className="font-medium text-sm mb-3">Sự kiện nổi bật</h4>
                        <div className="space-y-2">
                            {events.slice(0, 5).map((event, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${event.type === 'achievement' ? 'bg-emerald-500' :
                                        event.type === 'warning' ? 'bg-amber-500' :
                                            event.type === 'grade' ? 'bg-blue-500' :
                                                'bg-slate-400'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground truncate">
                                                {event.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {event.date}
                                            </span>
                                        </div>
                                        {event.description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

export { PerformanceTimeline };

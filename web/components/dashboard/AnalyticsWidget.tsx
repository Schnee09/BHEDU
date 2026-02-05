'use client';

/**
 * Analytics Widget Component
 * 
 * A reusable chart widget for displaying various types of analytics data.
 * Supports line, bar, pie, area, and radar charts using Recharts.
 * Uses lazy-loaded chart components for better performance.
 */

import { ReactNode, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Line,
    Bar,
    Area,
    Pie,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChartPie, BarChart3, TrendingUp, Activity } from 'lucide-react';

// Loading skeleton for charts
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
    <div className="space-y-4 w-full" style={{ height }}>
        <div className="flex justify-between items-end h-[70%] gap-2 px-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton
                    key={i}
                    height={`${20 + Math.random() * 60}%`}
                    width="12%"
                    className="rounded-t-lg"
                />
            ))}
        </div>
        <div className="space-y-2">
            <Skeleton height="1rem" width="100%" />
            <Skeleton height="1rem" width="70%" />
        </div>
    </div>
);

// Lazy load chart containers
const LazyLineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), {
    ssr: false,
    loading: () => <ChartSkeleton />
});
const LazyBarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), {
    ssr: false,
    loading: () => <ChartSkeleton />
});
const LazyPieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), {
    ssr: false,
    loading: () => <ChartSkeleton />
});
const LazyAreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), {
    ssr: false,
    loading: () => <ChartSkeleton />
});
const LazyRadarChart = dynamic(() => import('recharts').then(mod => mod.RadarChart), {
    ssr: false,
    loading: () => <ChartSkeleton />
});

// Chart color palette - BH-EDU Premium
const COLORS = {
    primary: '#F5A623',   // Amber (Brand Primary)
    secondary: '#8B5A2B', // Brown (Brand Accent)
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    gradient: ['#F5A623', '#D97706', '#B45309', '#8B5A2B', '#5D3E2A'],
    gradeScale: ['#10B981', '#22C55E', '#84CC16', '#EAB308', '#F59E0B', '#EF4444'],
};

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'radar';

interface DataPoint {
    [key: string]: string | number;
}

interface AnalyticsWidgetProps {
    title: string;
    subtitle?: string;
    chartType: ChartType;
    data: DataPoint[];
    dataKey: string; // Primary data key to display
    xAxisKey?: string; // Key for X-axis labels
    secondaryDataKey?: string; // For comparison charts
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    color?: keyof typeof COLORS | string;
    secondaryColor?: string;
    loading?: boolean;
    emptyMessage?: string;
    valueFormatter?: (value: number) => string;
    icon?: ReactNode;
    className?: string;
}

export default function AnalyticsWidget({
    title,
    subtitle,
    chartType,
    data,
    dataKey,
    xAxisKey = 'name',
    secondaryDataKey,
    height = 300,
    showLegend = true,
    showGrid = true,
    color = 'primary',
    secondaryColor,
    loading = false,
    emptyMessage = 'Không có dữ liệu',
    valueFormatter = (v) => v.toString(),
    icon,
    className = '',
}: AnalyticsWidgetProps) {
    const primaryColor = useMemo(() => {
        if (color in COLORS) {
            return COLORS[color as keyof typeof COLORS];
        }
        return color;
    }, [color]);

    const secondColor = secondaryColor || COLORS.secondary;

    const renderChart = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            );
        }

        if (!data || data.length === 0) {
            return (
                <EmptyState
                    title={emptyMessage}
                    description="Chúng tôi chưa tìm thấy dữ liệu cho khoảng thời gian này."
                    className="h-full border-none bg-transparent p-0"
                />
            );
        }

        const tooltipStyle = {
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-light)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        };

        switch (chartType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LazyLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />}
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: any) => [valueFormatter(Number(value)), dataKey]}
                            />
                            {showLegend && <Legend />}
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={primaryColor as string}
                                strokeWidth={2}
                                dot={{ fill: primaryColor as string, strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            {secondaryDataKey && (
                                <Line
                                    type="monotone"
                                    dataKey={secondaryDataKey}
                                    stroke={secondColor}
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: secondColor, strokeWidth: 2, r: 3 }}
                                />
                            )}
                        </LazyLineChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LazyBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />}
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: any) => [valueFormatter(Number(value)), dataKey]}
                            />
                            {showLegend && <Legend />}
                            <Bar
                                dataKey={dataKey}
                                fill={primaryColor as string}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            />
                            {secondaryDataKey && (
                                <Bar
                                    dataKey={secondaryDataKey}
                                    fill={secondColor}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={50}
                                />
                            )}
                        </LazyBarChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LazyPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey={dataKey}
                                nameKey={xAxisKey}
                                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS.gradient[index % COLORS.gradient.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: any) => [valueFormatter(Number(value)), '']}
                            />
                            {showLegend && <Legend />}
                        </LazyPieChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LazyAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />}
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: any) => [valueFormatter(Number(value)), dataKey]}
                            />
                            {showLegend && <Legend />}
                            <defs>
                                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={primaryColor as string} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={primaryColor as string} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={primaryColor as string}
                                strokeWidth={2}
                                fill="url(#colorPrimary)"
                            />
                        </LazyAreaChart>
                    </ResponsiveContainer>
                );

            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LazyRadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
                            <PolarGrid stroke="var(--border-light)" />
                            <PolarAngleAxis
                                dataKey={xAxisKey}
                                stroke="var(--text-muted)"
                                fontSize={12}
                            />
                            <PolarRadiusAxis
                                stroke="var(--text-muted)"
                                fontSize={10}
                            />
                            <Radar
                                name={dataKey}
                                dataKey={dataKey}
                                stroke={primaryColor as string}
                                fill={primaryColor as string}
                                fillOpacity={0.3}
                            />
                            {secondaryDataKey && (
                                <Radar
                                    name={secondaryDataKey}
                                    dataKey={secondaryDataKey}
                                    stroke={secondColor}
                                    fill={secondColor}
                                    fillOpacity={0.2}
                                />
                            )}
                            <Tooltip contentStyle={tooltipStyle} />
                            {showLegend && <Legend />}
                        </LazyRadarChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <Card className={cn(
            "overflow-hidden glass-premium rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border border-white/20 dark:border-white/5 shadow-2xl shadow-stone-500/10 transition-all hover:scale-[1.01]",
            className
        )}>
            <div className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div className="flex items-center gap-3 md:gap-4">
                        {icon && (
                            <div className="p-2 md:p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h3 className="font-black text-lg md:text-xl text-stone-900 dark:text-white uppercase tracking-tight">{title}</h3>
                            {subtitle && (
                                <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5 md:mt-1">{subtitle}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ height }} className="relative">
                    {renderChart()}
                </div>
            </div>
        </Card>
    );
}

// Export named component and colors
export { AnalyticsWidget, COLORS as ChartColors };

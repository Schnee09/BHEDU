'use client';

/**
 * Analytics Widget Component
 * 
 * A reusable chart widget for displaying various types of analytics data.
 * Supports line, bar, pie, area, and radar charts using Recharts.
 */

import { ReactNode, useMemo } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    RadarChart,
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

// Chart color palette
const COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    gradient: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
    gradeScale: ['#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#ef4444'],
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
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    {emptyMessage}
                </div>
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
                        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                formatter={(value: number) => [valueFormatter(value), dataKey]}
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
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                formatter={(value: number) => [valueFormatter(value), dataKey]}
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
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey={dataKey}
                                nameKey={xAxisKey}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                                formatter={(value: number) => [valueFormatter(value), '']}
                            />
                            {showLegend && <Legend />}
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                formatter={(value: number) => [valueFormatter(value), dataKey]}
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
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
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
                        </RadarChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <Card className={`overflow-hidden ${className}`}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                            {subtitle && (
                                <p className="text-sm text-muted-foreground">{subtitle}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ height }}>
                    {renderChart()}
                </div>
            </div>
        </Card>
    );
}

// Export named component and colors
export { AnalyticsWidget, COLORS as ChartColors };

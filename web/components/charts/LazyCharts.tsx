'use client';

/**
 * Lazy-loaded Recharts Components
 * 
 * These components are dynamically imported to reduce initial bundle size.
 * Recharts is ~200KB and only needed on dashboard/analytics pages.
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading skeleton for charts
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
    <div
        className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg"
        style={{ height }}
    >
        <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 dark:text-gray-500 text-sm">
                Đang tải biểu đồ...
            </div>
        </div>
    </div>
);

// Dynamic imports for all Recharts components
export const LazyLineChart = dynamic(
    () => import('recharts').then((mod) => mod.LineChart as ComponentType<any>),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyBarChart = dynamic(
    () => import('recharts').then((mod) => mod.BarChart as ComponentType<any>),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyAreaChart = dynamic(
    () => import('recharts').then((mod) => mod.AreaChart as ComponentType<any>),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyPieChart = dynamic(
    () => import('recharts').then((mod) => mod.PieChart as ComponentType<any>),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyRadarChart = dynamic(
    () => import('recharts').then((mod) => mod.RadarChart as ComponentType<any>),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyResponsiveContainer = dynamic(
    () => import('recharts').then((mod) => mod.ResponsiveContainer as ComponentType<any>),
    { ssr: false }
);

// Re-export static components that don't need lazy loading
// These are small and used within dynamically loaded charts
export {
    Line,
    Bar,
    Area,
    Pie,
    Radar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ReferenceLine,
} from 'recharts';

// Export ChartSkeleton for use in other components
export { ChartSkeleton };

"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

// Premium gradient variants with enhanced colors
const cardVariants = [
  {
    bg: 'from-indigo-50 via-white to-indigo-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20',
    border: 'border-indigo-100/80 dark:border-indigo-800/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    icon: 'text-indigo-600 dark:text-indigo-400',
    glow: 'group-hover:shadow-indigo-500/20 dark:group-hover:shadow-indigo-500/30',
    iconBg: 'bg-indigo-100/80 dark:bg-indigo-900/40',
    accent: 'bg-gradient-to-r from-indigo-500 to-purple-500'
  },
  {
    bg: 'from-sky-50 via-white to-sky-50/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-sky-950/20',
    border: 'border-sky-100/80 dark:border-sky-800/40',
    text: 'text-sky-600 dark:text-sky-400',
    icon: 'text-sky-600 dark:text-sky-400',
    glow: 'group-hover:shadow-sky-500/20 dark:group-hover:shadow-sky-500/30',
    iconBg: 'bg-sky-100/80 dark:bg-sky-900/40',
    accent: 'bg-gradient-to-r from-sky-500 to-cyan-500'
  },
  {
    bg: 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20',
    border: 'border-amber-100/80 dark:border-amber-800/40',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
    glow: 'group-hover:shadow-amber-500/20 dark:group-hover:shadow-amber-500/30',
    iconBg: 'bg-amber-100/80 dark:bg-amber-900/40',
    accent: 'bg-gradient-to-r from-amber-500 to-orange-500'
  },
  {
    bg: 'from-rose-50 via-white to-rose-50/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20',
    border: 'border-rose-100/80 dark:border-rose-800/40',
    text: 'text-rose-600 dark:text-rose-400',
    icon: 'text-rose-600 dark:text-rose-400',
    glow: 'group-hover:shadow-rose-500/20 dark:group-hover:shadow-rose-500/30',
    iconBg: 'bg-rose-100/80 dark:bg-rose-900/40',
    accent: 'bg-gradient-to-r from-rose-500 to-pink-500'
  },
  {
    bg: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20',
    border: 'border-emerald-100/80 dark:border-emerald-800/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/20 dark:group-hover:shadow-emerald-500/30',
    iconBg: 'bg-emerald-100/80 dark:bg-emerald-900/40',
    accent: 'bg-gradient-to-r from-emerald-500 to-teal-500'
  },
];

// Animated number counter hook
function useAnimatedNumber(value: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  colorIndex?: number;
  className?: string;
  index?: number; // For stagger animation
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  colorIndex = 0,
  className,
  index = 0,
  trend,
}: DashboardCardProps) {
  const variant = cardVariants[colorIndex % cardVariants.length];
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString()) || 0;
  const animatedValue = useAnimatedNumber(numericValue, 1200);
  const isNumeric = typeof value === 'number' || !isNaN(parseInt(value.toString()));

  // Stagger delay based on index
  const animationDelay = `${index * 100}ms`;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-2",
        "bg-gradient-to-br backdrop-blur-sm",
        "opacity-0 animate-fade-in-up",
        variant.bg,
        variant.border,
        variant.glow,
        className
      )}
      style={{ animationDelay, animationFillMode: 'forwards' }}
    >
      {/* Accent line at top */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        variant.accent
      )} />

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-heading">
            {title}
          </h3>
          {icon && (
            <div className={cn(
              "p-2.5 rounded-xl backdrop-blur-sm transition-all duration-300",
              "group-hover:scale-110 group-hover:rotate-3",
              variant.iconBg,
              variant.icon
            )}>
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-4xl font-bold text-foreground font-heading tracking-tight tabular-nums">
            {isNumeric ? animatedValue.toLocaleString('vi-VN') : value}
          </p>

          {/* Trend indicator */}
          {trend && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-sm font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                trend.isPositive
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              )}>
                {trend.isPositive ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">so với tháng trước</span>
            </div>
          )}

          {subtitle && (
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Animated background blobs */}
      <div className={cn(
        "absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-20 blur-3xl",
        "group-hover:scale-150 group-hover:opacity-30 transition-all duration-700",
        variant.text.replace('text-', 'bg-')
      )} />
      <div className={cn(
        "absolute -left-4 -top-4 w-20 h-20 rounded-full opacity-10 blur-2xl",
        "group-hover:scale-125 group-hover:opacity-20 transition-all duration-500",
        variant.text.replace('text-', 'bg-')
      )} />

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}

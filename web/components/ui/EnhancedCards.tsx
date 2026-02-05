"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useCustomization } from "@/contexts/CustomizationContext";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "primary" | "success" | "warning" | "error" | "info";
  hoverGlow?: boolean;
  onClick?: () => void;
}

/**
 * Enhanced card with glow effect on hover
 * Responsive and touch-friendly
 */
export function GlowCard({
  children,
  className,
  glowColor = "primary",
  hoverGlow = true,
  onClick,
}: GlowCardProps) {
  const glowColors = {
    primary: "hover:border-amber-500/50 hover:shadow-md",
    success: "hover:border-green-500/50 hover:shadow-md",
    warning: "hover:border-orange-500/50 hover:shadow-md",
    error: "hover:border-red-500/50 hover:shadow-md",
    info: "hover:border-blue-500/50 hover:shadow-md",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-premium rounded-2xl md:rounded-3xl p-4 md:p-6",
        "transition-all duration-300 ease-out",
        hoverGlow && glowColors[glowColor],
        onClick && "cursor-pointer press-effect",
        className
      )}
    >
      {children}
    </div>
  );
}

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: "amber" | "purple" | "green" | "blue" | "slate";
}

/**
 * Card with subtle gradient background
 */
export function GradientCard({
  children,
  className,
  gradient = "amber",
}: GradientCardProps) {
  const gradients = {
    amber: "bg-gradient-to-br from-amber-50/50 via-transparent to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/5",
    purple: "bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/5",
    green: "bg-gradient-to-br from-green-50/50 via-transparent to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/5",
    blue: "bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/30 dark:from-blue-900/10 dark:to-cyan-900/5",
    slate: "bg-gradient-to-br from-slate-50/50 via-transparent to-gray-50/30 dark:from-slate-900/10 dark:to-gray-900/5",
  };

  return (
    <div
      className={cn(
        "rounded-2xl md:rounded-3xl p-4 md:p-6",
        "border border-[var(--border-default)]",
        gradients[gradient],
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

interface LiveIndicatorCardProps {
  children: React.ReactNode;
  className?: string;
  isLive?: boolean;
  pulseColor?: "green" | "amber" | "red";
}

/**
 * Card with live/pulse indicator for real-time data
 */
export function LiveIndicatorCard({
  children,
  className,
  isLive = true,
  pulseColor = "green",
}: LiveIndicatorCardProps) {
  const colors = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "glass-premium rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden",
        className
      )}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Live
          </span>
          <div className="relative">
            <div className={cn("w-2 h-2 rounded-full", colors[pulseColor])} />
            <div className={cn(
              "absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75",
              colors[pulseColor]
            )} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Enhanced metric card for dashboard stats
 * Mobile-first with compact and expanded variants
 */
export function MetricCard({
  label,
  value,
  change,
  icon,
  className,
}: MetricCardProps) {
  return (
    <GlowCard className={cn("group", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-stone-900 dark:text-white">
            {value}
          </p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              change.type === "increase" && "text-green-600 dark:text-green-400",
              change.type === "decrease" && "text-red-600 dark:text-red-400",
              change.type === "neutral" && "text-[var(--text-muted)]"
            )}>
              <span>
                {change.type === "increase" && "↑"}
                {change.type === "decrease" && "↓"}
                {change.type === "neutral" && "→"}
              </span>
              <span>{Math.abs(change.value)}%</span>
              <span className="text-[var(--text-muted)]">vs tuần trước</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-2.5 md:p-3 rounded-xl shrink-0",
            "bg-[var(--color-primary-10)] text-[var(--color-primary)]",
            "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          )}>
            {icon}
          </div>
        )}
      </div>
    </GlowCard>
  );
}

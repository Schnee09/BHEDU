"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  FileQuestion, 
  Users, 
  Calendar, 
  ClipboardList, 
  BookOpen,
  Search,
  Plus
} from "lucide-react";

interface EmptyStateProps {
  type?: "default" | "students" | "attendance" | "calendar" | "grades" | "search";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Illustrated empty state component
 * Mobile-optimized with responsive sizing
 */
export function IllustratedEmptyState({
  type = "default",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = getIconForType(type);
  const gradientClass = getGradientForType(type);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 md:py-16 px-4 text-center",
      className
    )}>
      {/* Illustration Container */}
      <div className="relative mb-6">
        {/* Background Glow */}
        <div className={cn(
          "absolute inset-0 blur-3xl opacity-20 rounded-full scale-150",
          gradientClass
        )} />
        
        {/* Icon Circle */}
        <div className={cn(
          "relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-[var(--surface)] to-[var(--surface-hover)]",
          "border border-[var(--border-default)] shadow-lg"
        )}>
          <Icon className="w-8 h-8 md:w-10 md:h-10 text-[var(--text-muted)]" />
        </div>

        {/* Decorative Dots */}
        <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-[var(--color-primary)] opacity-60" />
        <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-[var(--color-primary)] opacity-40" />
      </div>

      {/* Text Content */}
      <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm md:text-base text-[var(--text-muted)] max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

function getIconForType(type: EmptyStateProps["type"]) {
  switch (type) {
    case "students": return Users;
    case "attendance": return ClipboardList;
    case "calendar": return Calendar;
    case "grades": return BookOpen;
    case "search": return Search;
    default: return FileQuestion;
  }
}

function getGradientForType(type: EmptyStateProps["type"]) {
  switch (type) {
    case "students": return "bg-blue-500";
    case "attendance": return "bg-green-500";
    case "calendar": return "bg-purple-500";
    case "grades": return "bg-amber-500";
    case "search": return "bg-slate-500";
    default: return "bg-amber-500";
  }
}

interface NoDataCardProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Compact empty state for inline use
 */
export function NoDataCard({
  message = "Không có dữ liệu",
  actionLabel,
  onAction,
  className,
}: NoDataCardProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4",
      "glass-premium rounded-2xl",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center mb-3">
        <FileQuestion className="w-6 h-6 text-[var(--text-muted)]" />
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-3">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl",
            "bg-[var(--color-primary)] text-white",
            "hover:bg-[var(--color-primary-hover)] transition-colors",
            "press-effect"
          )}
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * Mobile-optimized card component with press effect
 */
export function MobileCard({ 
  children, 
  className, 
  onClick,
  active = false 
}: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "mobile-card glass-premium rounded-2xl p-4 cursor-pointer",
        "transition-all duration-200 ease-out",
        active && "ring-2 ring-[var(--color-primary)] ring-offset-2 dark:ring-offset-[#1A1410]",
        onClick && "press-effect",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container for mobile card layout
 */
export function MobileCardList({ children, className }: MobileCardListProps) {
  return (
    <div className={cn("mobile-card-list", className)}>
      {children}
    </div>
  );
}

interface MobileCardFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

/**
 * Label-value pair for mobile card display
 */
export function MobileCardField({ label, value, className }: MobileCardFieldProps) {
  return (
    <div className={cn("flex justify-between items-center py-1.5", className)}>
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

/**
 * Header section for mobile cards
 */
export function MobileCardHeader({ 
  title, 
  subtitle, 
  icon, 
  badge,
  className 
}: MobileCardHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3 mb-3", className)}>
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface MobileCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Action buttons container for mobile cards
 */
export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <div className={cn("flex gap-2 mt-3 pt-3 border-t border-[var(--border-default)]", className)}>
      {children}
    </div>
  );
}

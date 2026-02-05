"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomization } from "@/contexts/CustomizationContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Unified PageHeader component
 * Mobile-first responsive design with dynamic accent colors
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  const { accentColor } = useCustomization();

  return (
    <header className={cn("space-y-3 md:space-y-4", className)}>
      {/* Breadcrumbs - Scrollable on mobile */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trang chủ</span>
          </Link>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {/* Clean Accent Bar */}
          <div 
            className="w-1 md:w-1.25 h-7 md:h-8 rounded-full shrink-0 bg-amber-500"
          />
          
          {/* Icon (optional) */}
          {icon && (
            <div 
              className="p-2 md:p-2.5 rounded-xl shrink-0"
              style={{
                backgroundColor: `var(--color-primary-10)`,
                color: `var(--color-primary)`,
              }}
            >
              {icon}
            </div>
          )}
          
          {/* Title & Subtitle */}
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions - Stack on mobile */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

interface PageSectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Page section with consistent header styling
 */
export function PageSection({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-0.75 h-4 bg-amber-500 rounded-full"
          />
          <div>
            <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Compact breadcrumb-only header for simple pages
 */
export function SimpleBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-hide">
      <Link
        href="/dashboard"
        className="p-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <Home className="w-4 h-4 text-[var(--text-muted)]" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="px-2 py-1 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-2 py-1 text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

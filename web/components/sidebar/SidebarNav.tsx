'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NavSection, NavGroup, NavLink, getNavLabel } from '@/lib/auth/navigation.config';
import { UserRole } from '@/lib/auth/core';

interface SidebarNavProps {
  navSections: NavSection[];
  role: UserRole;
  isCollapsed: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export function SidebarNav({
  navSections,
  role,
  isCollapsed,
  setIsMobileMenuOpen,
}: SidebarNavProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Auto-expand groups that contain active links
  useEffect(() => {
    const activeGroups = new Set<string>();
    navSections.forEach((section) => {
      section.groups?.forEach((group) => {
        const hasActiveLink = group.links.some(
          (link) => pathname === link.href || pathname?.startsWith(link.href + '/')
        );
        if (hasActiveLink) {
          activeGroups.add(group.label);
        }
      });
    });
    if (activeGroups.size > 0) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        activeGroups.forEach((g) => next.add(g));
        return next;
      });
    }
  }, [pathname, navSections]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupLabel)) {
        next.delete(groupLabel);
      } else {
        next.add(groupLabel);
      }
      return next;
    });
  };

  const renderNavLink = (link: NavLink, inGroup = false) => {
    const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
    const label = getNavLabel(link, role);

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setIsMobileMenuOpen?.(false)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 mx-2 my-0.5 rounded-xl transition-all duration-200 relative overflow-hidden',
          'hover:scale-[1.01] active:scale-95',
          inGroup ? 'ml-8 text-sm' : '',
          isCollapsed && 'justify-center mx-1 px-0',
          isActive
            ? 'bg-amber-500/10 dark:bg-amber-500/15 shadow-sm border border-amber-500/20'
            : 'hover:bg-stone-100/80 dark:hover:bg-white/5 border border-transparent hover:border-stone-200/60 dark:hover:border-white/8'
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3/5 bg-amber-500 rounded-r-full shadow-accent-glow" />
        )}

        <link.icon
          size={inGroup ? 15 : 18}
          className={cn(
            'shrink-0 transition-all duration-200',
            isActive
              ? 'text-amber-500 scale-110 drop-shadow-[0_0_6px_rgba(245,166,35,0.4)]'
              : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 group-hover:scale-110'
          )}
        />

        {!isCollapsed && (
          <span
            className={cn(
              'truncate transition-colors tracking-tight text-sm',
              isActive
                ? 'text-amber-700 dark:text-amber-400 font-semibold'
                : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white font-medium'
            )}
          >
            {label}
          </span>
        )}

        {link.badge && !isCollapsed && (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full min-w-[18px] text-center shadow-lg shadow-amber-500/20">
            {link.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups.has(group.label);
    const hasActiveLink = group.links.some(
      (link) => pathname === link.href || pathname?.startsWith(link.href + '/')
    );

    return (
      <div key={group.label} className="space-y-1">
        {/* Group Header */}
        <button
          onClick={() => toggleGroup(group.label)}
          aria-expanded={isExpanded}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 mx-3 my-0.5 rounded-2xl transition-all duration-300 relative group overflow-hidden hover:scale-[1.01]',
            isCollapsed && 'justify-center mx-2 px-0',
            hasActiveLink
              ? 'bg-amber-500/5 border border-amber-500/10'
              : 'hover:bg-white/50 dark:hover:bg-white/5 border border-transparent hover:border-stone-200 dark:hover:border-white/10',
            isExpanded ? 'mb-1' : ''
          )}
          style={{ width: 'calc(100% - 1.5rem)' }}
        >
          {hasActiveLink && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-amber-500 rounded-r-full opacity-50 shadow-accent-glow" />
          )}

          <group.icon
            size={20}
            className={cn(
              'shrink-0 transition-all duration-300',
              hasActiveLink
                ? 'text-amber-500 scale-110'
                : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 group-hover:scale-110'
            )}
          />

          {!isCollapsed && (
            <>
              <span
                className={cn(
                  'flex-1 text-left truncate transition-colors',
                  hasActiveLink
                    ? 'text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white font-semibold'
                )}
              >
                {group.label}
              </span>
              {isExpanded ? (
                <ChevronDown
                  size={16}
                  className="shrink-0 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform duration-200 rotate-180"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="shrink-0 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform duration-200"
                />
              )}
            </>
          )}
        </button>

        {/* Group Links */}
        {!isCollapsed && isExpanded && (
          <div className="space-y-0.5 animate-accordion-down mb-2 border-l border-stone-100 dark:border-white/5 ml-7 pl-1">
            {group.links.map((link) => renderNavLink(link, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto py-6 space-y-8 custom-scrollbar scroll-smooth">
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          {/* Section Title */}
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-6 mb-2 mt-1">
              <div className="w-1 h-1 bg-amber-500/60 rounded-full shadow-accent-glow"></div>
              <h3 className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-[0.15em] font-sans">
                {section.title}
              </h3>
            </div>
          )}

          <div className="space-y-0.5">
            {/* Direct Links */}
            {section.links?.map((link) => renderNavLink(link))}

            {/* Collapsible Groups */}
            {section.groups?.map((group) => renderNavGroup(group))}
          </div>
        </div>
      ))}
    </div>
  );
}

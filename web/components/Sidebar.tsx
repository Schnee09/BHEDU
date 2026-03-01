"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { getNavigationForPermissions, getNavLabel, NavSection, NavGroup, NavLink } from "@/lib/auth/navigation.config";
import { UserRole } from "@/lib/auth/core";
import { createClient } from "@/lib/supabase/client";
import { getDisplayName } from "@/lib/utils/names";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}) {
  const { profile } = useProfile();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [greeting, setGreeting] = useState("");

  // Greeting logic
  useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Chào buổi sáng");
    else if (hours < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  // Get navigation items based on user's actual permissions
  const navSections = useMemo(() => {
    if (permissionsLoading || !profile) return [];
    return getNavigationForPermissions(permissions);
  }, [permissions, permissionsLoading, profile]);

  // Auto-expand groups that contain active links
  useMemo(() => {
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
      setExpandedGroups(activeGroups);
    }
  }, [pathname, navSections]);

  if (!profile) return null;

  const role = (profile.role ?? "student") as UserRole;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

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
        className={cn(
          "group flex items-center gap-3 px-6 py-2.5 transition-all duration-200 relative",
          inGroup ? "ml-4 text-sm" : "",
          isCollapsed && "justify-center px-3"
        )}
      >
        {/* Active indicator - Left border style */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-r-full" />
        )}

        <link.icon size={inGroup ? 16 : 20} className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-amber-500" : "text-stone-400 group-hover:text-stone-600"
        )} />

        {!isCollapsed && (
          <span className={cn(
            "truncate transition-colors",
            isActive ? "text-stone-900 font-bold" : "text-stone-500 group-hover:text-stone-900 font-medium"
          )}>{label}</span>
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
          className={cn(
            "w-full flex items-center gap-3 px-6 py-2.5 transition-all duration-200 relative group",
            isCollapsed && "justify-center px-3"
          )}
        >
          {hasActiveLink && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-r-full" />
          )}

          <group.icon size={20} className={cn(
            "shrink-0 transition-colors",
            hasActiveLink ? "text-amber-500" : "text-stone-400 group-hover:text-stone-600"
          )} />

          {!isCollapsed && (
            <>
              <span className={cn(
                "flex-1 text-left truncate transition-colors",
                hasActiveLink ? "text-stone-900 font-bold" : "text-stone-500 group-hover:text-stone-900 font-medium"
              )}>{group.label}</span>
              {isExpanded ? (
                <ChevronDown size={16} className="shrink-0 text-stone-400" />
              ) : (
                <ChevronRight size={16} className="shrink-0 text-stone-400" />
              )}
            </>
          )}
        </button>

        {/* Group Links */}
        {!isCollapsed && isExpanded && (
          <div className="space-y-0.5 animate-fade-in mb-2">
            {group.links.map((link) => renderNavLink(link, true))}
          </div>
        )}
      </div>
    );
  };

  // Swipe handlers
  const swipeHandlers = useSwipe({
    onSwipedLeft: () => setIsMobileMenuOpen?.(false),
  });

  return (
    <>
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        {...swipeHandlers}
        className={cn(
          "fixed inset-y-0 left-0 flex flex-col z-[150] transition-all duration-300",
          "w-[280px] lg:w-[280px] lg:h-[calc(100vh-24px)] lg:my-3 lg:left-3 lg:rounded-[32px] overflow-hidden",
          "bg-white dark:bg-stone-900 border-r lg:border border-stone-200 dark:border-stone-800",
          "shadow-2xl",
          isCollapsed ? "lg:w-24" : "lg:w-[280px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>

        {/* Header Section */}
        <div className="flex flex-col border-b border-stone-100 dark:border-stone-800 pb-4 bg-white dark:bg-stone-900">
          {/* Top Status Bar - Slimmed */}
          <div className="px-6 py-3 flex items-center justify-between opacity-80 scale-90 origin-left">
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">LIVE</span>
                </div>

                <div className="px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">HKII-25</span>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </div>
              </div>
            )}
          </div>

          {/* Brand Logo & Name - Compact Horizontal */}
          <div className={cn(
            "px-6 flex items-center gap-3 transition-all",
            isCollapsed && "flex-col px-0"
          )}>
            <div className={cn(
              "shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-white to-stone-100 border border-stone-200 shadow-sm flex items-center justify-center p-1.5",
              isCollapsed && "w-8 h-8"
            )}>
              <div className="flex items-center justify-center w-full h-full text-amber-500 font-black text-sm">BH</div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 justify-center">
                <div className="flex items-center gap-2">
                  <h1
                    className="text-[14px] !text-[13px] font-black uppercase leading-none tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 dark:from-white dark:to-stone-400 opacity-90"
                    style={{ fontSize: '13px' }}
                  >
                    BÙI HOÀNG
                  </h1>
                </div>
                {/* Micro Greeting Pill - Integrated with subtext */}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[7px] font-bold text-amber-600 uppercase tracking-wider opacity-90">EDU</span>
                  <div className="h-2 w-px bg-stone-200 dark:bg-stone-700"></div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10">
                    <span className="text-[7px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-tight">{greeting},</span>
                    <span className="text-[8px] font-black text-stone-900 dark:text-white capitalize leading-none">{getDisplayName(profile as any).split(' ').pop() || "Viên"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-hide">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Title */}
              {!isCollapsed && (
                <div className="flex items-center gap-3 px-6 mb-2 mt-4 first:mt-0">
                  <div className="w-1 h-3 bg-amber-200 rounded-full"></div>
                  <h3
                    className="text-xs !text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider"
                    style={{ fontSize: '11px' }}
                  >
                    {section.title}
                  </h3>
                </div>
              )}

              {/* Direct Links */}
              {section.links?.map((link) => renderNavLink(link))}

              {/* Collapsible Groups */}
              {section.groups?.map((group) => renderNavGroup(group))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-0 py-2 group transition-all",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center text-red-500 group-hover:bg-red-50 group-hover:border-red-100 transition-all">
              <LogOut size={20} className="ml-0.5" />
            </div>
            {!isCollapsed && <span className="font-bold text-xs text-red-500 uppercase tracking-widest group-hover:text-red-600">Đăng xuất</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute bottom-8 -right-3 w-6 h-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer z-10"
        >
          <Menu size={12} className="text-stone-500" />
        </button>
      </aside>
    </>
  );
}

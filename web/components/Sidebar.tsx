"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { createClient } from "@/lib/supabase/client";
import { useState, useMemo } from "react";
import { getNavigationForPermissions, getNavLabel } from "@/lib/auth/navigation.config";
import type { PermissionCode, UserRole } from "@/lib/auth/permissions.config";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { profile } = useProfile();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get navigation items based on user's actual permissions
  const navSections = useMemo(() => {
    if (permissionsLoading || !profile) return [];
    return getNavigationForPermissions(permissions);
  }, [permissions, permissionsLoading, profile]);

  if (!profile) return null;

  const role = (profile.role ?? "student") as UserRole;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-primary text-white rounded-xl shadow-lg hover:bg-primary-hover transition-colors"
        aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed h-[96vh] my-[2vh] left-4 rounded-3xl z-40 transition-all duration-300 ease-out flex flex-col",
        "bg-surface/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl dark:shadow-black/40",
        isCollapsed ? "w-20" : "w-72",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                B
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight">BH-EDU</h1>
                <p className="text-xs text-muted-foreground font-medium capitalize">{role}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center text-white font-bold text-xl">B</div>
            </div>
          )}
        </div>

        {/* Navigation - Dynamic based on permissions */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 custom-scrollbar">
          {permissionsLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            navSections.map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                    const label = getNavLabel(link, role);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/25 font-medium"
                            : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground",
                          isCollapsed && "justify-center px-2"
                        )}
                        title={isCollapsed ? label : undefined}
                      >
                        <link.icon size={20} className={cn(
                          "transition-transform duration-200",
                          !isActive && "group-hover:scale-110"
                        )} />
                        {!isCollapsed && <span>{label}</span>}
                        {!isCollapsed && link.badge && (
                          <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors",
              isCollapsed && "justify-center px-2"
            )}
            title="Đăng xuất"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

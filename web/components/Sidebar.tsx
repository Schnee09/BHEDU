"use client";


import Image from "next/image";
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
        "fixed h-[96vh] my-[2vh] left-4 rounded-3xl z-40 transition-all duration-300 ease-out flex flex-col group/sidebar",
        "bg-[#1A1410] border border-[#2C2420] shadow-2xl shadow-amber-900/10", // Premium Dark Brown-Black
        // Decorative Top Shine
        "before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-amber-500/30 before:to-transparent before:w-3/4 before:mx-auto",
        isCollapsed ? "w-20" : "w-72",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="relative p-4 pl-6 flex items-center justify-between mx-2 mb-2">
          {/* Gradient Divider */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {!isCollapsed && (
            <div className="flex items-center gap-3 relative z-10">
              {/* Logo Glow */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-16 h-16 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />

              <div className="w-10 h-10 relative bg-white/5 p-1.5 rounded-xl border border-white/10 shadow-inner">
                <Image
                  src="/logo.png"
                  alt="Bùi Hoàng Logo"
                  fill
                  sizes="40px"
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex flex-col leading-none -space-y-0.5">
                  <span className="font-bold text-lg !text-white tracking-tight">BÙI</span>
                  <span className="font-black text-xl bg-gradient-to-r from-[#F5A623] to-[#FCD34D] bg-clip-text text-transparent tracking-tight">HOÀNG</span>
                </div>
                <p className="text-[9px] !text-amber-500/90 font-bold uppercase tracking-[0.25em] mt-1 pl-0.5">Education</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 relative">
                <Image
                  src="/logo.png"
                  alt="Bùi Hoàng Logo"
                  fill
                  sizes="32px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Dynamic based on permissions */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
          {permissionsLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-white/10 rounded w-20 animate-pulse" />
                  <div className="h-10 bg-white/5 rounded animate-pulse" />
                  <div className="h-10 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            navSections.map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="px-4 text-[11px] font-bold !text-gray-400 uppercase tracking-[0.2em] mb-3 opacity-90">
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
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 !text-white shadow-lg shadow-amber-900/20 font-medium"
                            : "!text-gray-400 hover:bg-white/5 hover:!text-white", // Force explicit text colors
                          isCollapsed && "justify-center px-2"
                        )}
                        title={isCollapsed ? label : undefined}
                      >
                        <link.icon size={20} className={cn(
                          "transition-transform duration-200",
                          !isActive && "group-hover:scale-110",
                          isActive && "!text-white"
                        )} />
                        {!isCollapsed && <span>{label}</span>}
                        {!isCollapsed && link.badge && (
                          <span className="ml-auto text-[10px] font-bold bg-white/10 text-amber-500 px-2 py-0.5 rounded-full border border-white/5">
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
        <div className="p-4 border-t border-white/5 mx-2 mt-2">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors",
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

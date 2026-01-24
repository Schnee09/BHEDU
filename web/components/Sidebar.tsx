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
import { LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity animate-fade-in"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      {/* Sidebar Container - Fixed for better contrast and z-index */}
      <aside className={cn(
        "fixed transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col group/sidebar z-[150]",
        // Position & Shape
        "inset-y-0 left-0 w-[280px] lg:w-72 lg:h-[calc(100vh-32px)] lg:my-3 lg:left-4 lg:rounded-[40px]",
        // Glassmorphism - Premium Styling
        "glass-premium backdrop-blur-3xl lg:border-2 border-white/20 shadow-2xl overflow-hidden pb-32 lg:pb-0",
        "dark:bg-[#1A1410]/95 bg-white/95", // More opaque for readability
        "shell-glow shell-border-gold",
        // Collapsible State (PC)
        isCollapsed ? "lg:w-24" : "lg:w-72",
        // Mobile State
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Background Decorative Blobs - Pro Max Detail */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-gradient-radial from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none opacity-50 dark:opacity-30 blur-3xl rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[30%] bg-gradient-radial from-amber-500/10 via-transparent to-transparent pointer-events-none opacity-40 blur-3xl rounded-full" />

        {/* Header - BH-EDU Brand - Pro Max Micro-Widgets Upgrade */}
        <div className="relative h-48 flex flex-col justify-end px-6 mb-4">
          {!isCollapsed && (
            <div className="relative z-10 animate-fade-in-up">
              {/* Top Row: System Status & Term */}
              <div className="flex items-center justify-between mb-4">
                {/* Live Pulse */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 dark:bg-stone-900/40 border border-white/10 backdrop-blur-md shadow-sm">
                   <div className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                   </div>
                   <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest opacity-80">System Live</span>
                </div>

                {/* Term Capsule */}
                <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                   <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">HKII · 2025</span>
                </div>
              </div>

              {/* Main Brand Block */}
              <div className="flex flex-col gap-3">
                {/* Semi-Transparent Logo Holder */}
                <div className="relative group/logo-compact w-20 h-20">
                  <div className="w-full h-full rounded-[24px] bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 flex items-center justify-center shadow-lg group-hover/sidebar:scale-105 transition-all duration-700 overflow-hidden group">
                     <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                       <Image
                          src="/logo-refined-h.png"
                          alt="BH"
                          fill
                          sizes="80px"
                          className="object-contain p-1 group-hover:scale-110 transition-transform duration-700"
                        />
                     </div>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-amber-500 rounded-full" />
                    <span className="font-black text-[24px] text-stone-950 dark:text-white tracking-tighter leading-none">
                      BÙI HOÀNG
                    </span>
                  </div>
                  <div className="pl-3.5">
                     <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] leading-none opacity-80">
                       Education System
                     </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center animate-fade-in group-hover/sidebar:scale-110 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-white/5 border border-white/20 rounded-2xl flex items-center justify-center shadow-xl p-1.5 overflow-hidden">
                 <Image src="/logo-refined-h.png" alt="BH" width={40} height={40} className="object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation - High Density Compact Layout */}
        <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-5 custom-scrollbar relative z-10">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-6 text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.35em] mb-1.5 mt-1 opacity-70 flex items-center gap-2">
                  <div className="w-1 h-3 bg-amber-500/40 rounded-full" />
                  {section.title}
                </h3>
              )}
              <div className="space-y-1.5">
                {section.links.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                  const label = getNavLabel(link, role);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen?.(false)}
                      className={cn(
                        "group flex items-center gap-4 px-6 py-3 rounded-[20px] transition-all duration-500 relative mx-3 mb-0.5",
                        isActive
                          ? "bg-gradient-to-r from-amber-500/10 to-transparent text-amber-600 dark:text-amber-500 font-extrabold translate-x-1"
                          : "text-stone-500 dark:text-stone-400 hover:bg-stone-100/50 dark:hover:bg-white/5 hover:text-stone-900 dark:hover:text-stone-100",
                        isCollapsed && "justify-center px-0 mx-2 translate-x-0"
                      )}
                    >
                      <link.icon size={22} className={cn(
                        "transition-all duration-500 shrink-0",
                        !isActive && "group-hover:scale-110 group-hover:rotate-6",
                        isActive && "scale-110 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,166,35,0.3)]"
                      )} />
                      {!isCollapsed && <span className="text-[15px] tracking-tight whitespace-nowrap">{label}</span>}
                      
                      {/* Sub-indicator for active state (PC only) - Floating Surgical Indicator */}
                      {isActive && !isCollapsed && (
                        <div className="hidden lg:block absolute left-[-4px] top-[20%] bottom-[20%] w-[3px] bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-[0_0_12px_rgba(245,166,35,0.6)]" />
                      )}

                      {/* Active Background Glow - Subtle */}
                      {isActive && (
                        <div className="absolute inset-0 bg-amber-500/5 rounded-[24px] pointer-events-none" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions - Refined Logout */}
        <div className="p-6 relative z-10 border-t border-stone-100 dark:border-white/5 mx-2 mt-4">
          <button
            onClick={handleLogout}
            className={cn(
              "group flex items-center gap-4 w-full px-5 py-4.5 rounded-[24px] text-[15px] font-black uppercase tracking-[0.1em] text-red-500 hover:bg-red-500/5 transition-all duration-500 active:scale-95 overflow-hidden relative",
              isCollapsed && "justify-center px-0 mx-0"
            )}
          >
            <LogOut size={22} className="transition-all duration-500 group-hover:scale-110 group-hover:-translate-x-1" />
            {!isCollapsed && <span className="relative z-10">Đăng xuất</span>}
          </button>
        </div>

        {/* Collapsible Trigger (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute bottom-24 -right-3 w-6 h-6 bg-white dark:bg-[#2C2420] border border-stone-200 dark:border-white/10 rounded-full items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer z-[80]"
        >
           <Menu size={12} className="text-stone-500" />
        </button>
      </aside>
    </>
  );
}

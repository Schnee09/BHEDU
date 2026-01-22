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

  // Calculate indicator position
  const activeIndex = useMemo(() => {
    let index = 0;
    for (const section of navSections) {
      for (const link of section.links) {
        if (pathname === link.href || pathname?.startsWith(link.href + '/')) {
          return index;
        }
        index++;
      }
    }
    return -1;
  }, [navSections, pathname]);

  return (
    <>
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity animate-fade-in"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      {/* Sidebar Container - Glass Float Pro Max */}
      <aside className={cn(
        "fixed transition-all duration-500 ease-out flex flex-col group/sidebar z-40",
        // Position & Shape
        "inset-y-0 left-0 w-[280px] lg:w-72 lg:h-[calc(100vh-32px)] lg:my-4 lg:left-4 lg:rounded-[32px]",
        // Glassmorphism - Premium Styling
        "glass-premium backdrop-blur-3xl lg:border border-white/10 shadow-2xl overflow-hidden",
        "dark:bg-[#1A1410]/80 bg-white/80",
        // Collapsible State (PC)
        isCollapsed ? "lg:w-20" : "lg:w-72",
        // Mobile State
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Dynamic Nav Indicator (Desktop Only) */}
        {!isCollapsed && activeIndex !== -1 && (
           <div 
             className="hidden lg:block sidebar-indicator z-0"
             style={{ 
               top: `${80 + (activeIndex * 52) + (activeIndex >= 1 ? 40 : 0)}px` 
             }}
           />
        )}

        {/* Header - BH-EDU Brand */}
        <div className="relative h-20 flex items-center px-6 mb-2">
          {!isCollapsed && (
            <div className="flex items-center gap-3 relative z-10 animate-fade-in">
              <div className="w-10 h-10 relative bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Image
                  src="/logo.png"
                  alt="Bùi Hoàng Logo"
                  fill
                  sizes="40px"
                  className="object-contain p-1.5 brightness-0 invert"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg text-stone-900 dark:text-stone-100 tracking-tight leading-none">BÙI HOÀNG</span>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mt-0.5">Education</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center animate-fade-in">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center">
                 <Image src="/logo.png" alt="L" width={24} height={24} className="brightness-0 invert" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar relative z-10">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.25em] mb-2 mt-4 opacity-70">
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
                      onClick={() => setIsMobileMenuOpen?.(false)}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative",
                        isActive
                          ? "bg-amber-500 text-white lg:bg-transparent lg:text-amber-500 lg:font-black"
                          : "text-stone-500 dark:text-stone-400 hover:bg-stone-500/5 dark:hover:bg-white/5 hover:text-stone-900 dark:hover:text-stone-100",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      <link.icon size={22} className={cn(
                        "transition-all duration-300",
                        !isActive && "group-hover:scale-110",
                        isActive && "scale-110"
                      )} />
                      {!isCollapsed && <span className="text-sm tracking-tight">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="p-4 relative z-10">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/5 rounded-2xl transition-all active:scale-95",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>

        {/* Collapsible Trigger (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute bottom-24 -right-3 w-6 h-6 bg-white dark:bg-[#2C2420] border border-white/10 rounded-full items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer z-50"
        >
           <Menu size={12} className="text-stone-500" />
        </button>
      </aside>
    </>
  );
}

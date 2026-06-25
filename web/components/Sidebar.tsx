'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { getNavigationForPermissions } from '@/lib/auth/navigation.config';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';

// Sub-components
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarNav } from './sidebar/SidebarNav';
import { SidebarFooter } from './sidebar/SidebarFooter';

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isCollapsed = false,
  setIsCollapsed,
}: {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}) {
  const { profile } = useProfile();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const router = useRouter();

  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!profile) return;

    const fetchBadgeCounts = async () => {
      const counts: Record<string, number> = {};
      const { apiFetch } = await import('@/lib/api/client');

      // 1. Fetch unread notifications
      try {
        const res = await apiFetch('/api/notifications/unread-count');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            counts.notifications = data.count;
          }
        }
      } catch (err) {
        console.error('Failed to fetch unread notification count:', err);
      }

      // 2. Fetch pending parent links for admin/owner/super_admin
      if (['admin', 'owner', 'super_admin'].includes(profile.role)) {
        try {
          const res = await apiFetch('/api/admin/parent-links?status=pending&limit=1');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.pagination) {
              counts.pendingParentLinks = data.pagination.total;
            }
          }
        } catch (err) {
          console.error('Failed to fetch pending parent links count:', err);
        }
      }

      // 3. Fetch classes count
      try {
        const res = await apiFetch('/api/classes?limit=1');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.pagination) {
            counts.classes = data.pagination.total;
          }
        }
      } catch (err) {
        console.error('Failed to fetch classes count:', err);
      }

      setBadgeCounts(counts);
    };

    fetchBadgeCounts();

    const interval = setInterval(fetchBadgeCounts, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  const navSectionsWithBadges = useMemo(() => {
    if (permissionsLoading || !profile) return [];
    const baseSections = getNavigationForPermissions(permissions, profile.role);

    return baseSections.map((section) => ({
      ...section,
      links: section.links?.map((link) => {
        let badge: string | undefined = undefined;
        if (link.href === '/dashboard/notifications' && badgeCounts.notifications) {
          badge = String(badgeCounts.notifications);
        } else if (
          link.href === '/dashboard/admin/students/parent-links' &&
          badgeCounts.pendingParentLinks
        ) {
          badge = String(badgeCounts.pendingParentLinks);
        } else if (
          (link.href === '/dashboard/classes' || link.href === '/dashboard/teacher/classes') &&
          badgeCounts.classes
        ) {
          badge = String(badgeCounts.classes);
        }
        return { ...link, badge };
      }),
      groups: section.groups?.map((group) => ({
        ...group,
        links: group.links.map((link) => {
          let badge: string | undefined = undefined;
          if (link.href === '/dashboard/notifications' && badgeCounts.notifications) {
            badge = String(badgeCounts.notifications);
          } else if (
            link.href === '/dashboard/admin/students/parent-links' &&
            badgeCounts.pendingParentLinks
          ) {
            badge = String(badgeCounts.pendingParentLinks);
          } else if (
            (link.href === '/dashboard/classes' || link.href === '/dashboard/teacher/classes') &&
            badgeCounts.classes
          ) {
            badge = String(badgeCounts.classes);
          }
          return { ...link, badge };
        }),
      })),
    }));
  }, [permissions, permissionsLoading, profile, badgeCounts]);

  const swipeHandlers = useSwipe({
    onSwipedLeft: () => setIsMobileMenuOpen?.(false),
  });

  if (!profile) return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen?.(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        {...swipeHandlers}
        className={cn(
          // Base
          'fixed inset-y-0 left-0 flex flex-col transition-all duration-300 ease-in-out',
          // Desktop: floating pill
          'lg:inset-y-auto lg:top-4 lg:bottom-4 lg:left-4 lg:rounded-3xl lg:h-[calc(100vh-32px)]',
          // Glass background
          'bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl',
          // Border & shadow
          'border-r lg:border border-stone-200/80 dark:border-white/10',
          'shadow-xl shadow-stone-900/8 dark:shadow-black/25',
          // Z-stack: above header on mobile and desktop
          'z-[1000]',
          // Width
          isCollapsed ? 'w-[72px]' : 'w-[280px]',
          // Mobile slide
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarHeader profile={profile} isCollapsed={isCollapsed} />
        <SidebarNav
          navSections={navSectionsWithBadges}
          role={profile.role}
          isCollapsed={isCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <SidebarFooter onLogout={handleLogout} isCollapsed={isCollapsed} />

        {/* Collapse Toggle (Desktop only) */}
        {!isMobileMenuOpen && (
          <button
            onClick={() => setIsCollapsed?.(!isCollapsed)}
            aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className="hidden lg:flex absolute bottom-20 -right-3 w-7 h-7 bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-full items-center justify-center shadow-md hover:scale-110 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200 cursor-pointer z-10 text-stone-500"
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}
      </aside>
    </>
  );
}

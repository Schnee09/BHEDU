'use client';

import { ProfileProvider, useProfileContext } from '@/contexts/ProfileContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import LoadingScreen from '@/components/LoadingScreen';
import AuthGuard from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkipToMainContent } from '@/lib/a11y';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ReactNode, useState } from 'react';
import { useSwipe } from '@/hooks/useSwipe';

function DashboardContent({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfileContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const swipeHandlers = useSwipe({
    onSwipedRight: () => setIsMobileMenuOpen(true),
  });

  if (loading) return <LoadingScreen />;
  if (!profile) return null;

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <SkipToMainContent />

      <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-stone-50 dark:bg-[#0e0c0a]">
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Content — margin driven by CSS vars on desktop, 0 on mobile */}
        <div
          className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-[margin] duration-300 ease-in-out ${isSidebarCollapsed ? 'content-area-collapsed' : 'content-area'}`}
        >
          <Header
            profile={profile}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMenuOpen={isMobileMenuOpen}
          />

          <main
            id="main-content"
            className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 lg:p-6 pb-20 lg:pb-6 pb-safe overscroll-y-contain w-full max-w-full min-w-0"
            role="main"
          >
            <div className="w-full mx-auto max-w-[1600px] min-w-0 overflow-x-hidden">
              <ErrorBoundary
                showDetails={process.env.NODE_ENV === 'development'}
                pageName="page content"
              >
                {children}
              </ErrorBoundary>

              {/* Physical Mobile Bottom Spacer so floating nav bar NEVER covers content */}
              <div className="h-20 lg:hidden pointer-events-none" aria-hidden="true" />
            </div>
          </main>

          {/* App-like Mobile Bottom Navigation Bar */}
          <MobileBottomNav />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <ProfileProvider>
        <DashboardContent>{children}</DashboardContent>
      </ProfileProvider>
    </AuthGuard>
  );
}

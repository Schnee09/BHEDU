"use client";

import { ProfileProvider, useProfileContext } from "@/contexts/ProfileContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import LoadingScreen from "@/components/LoadingScreen";
import AuthGuard from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipToMainContent } from "@/lib/a11y";
import { ReactNode, useState } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";

function DashboardContent({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfileContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return <LoadingScreen />;
  if (!profile) return <div className="flex items-center justify-center min-h-screen bg-background text-foreground font-semibold text-xl">Profile not found.</div>;

  return (
    <AuthGuard>
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        {/* Skip Navigation Link */}
        <SkipToMainContent />

        <div className="flex min-h-screen bg-gray-50/50 dark:bg-transparent">
          {/* Sidebar - Dual Theme */}
          <Sidebar 
            isMobileMenuOpen={isMobileMenuOpen} 
            setIsMobileMenuOpen={setIsMobileMenuOpen} 
          />

          {/* Main Content Area */}
          <div className="flex-1 ml-0 lg:ml-72 flex flex-col">
            {/* Header */}
            <Header 
              profile={profile} 
              onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              isMenuOpen={isMobileMenuOpen}
            />

            {/* Content */}
            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 pb-safe" // Added pb-20 and pb-safe for mobile nav
              role="main"
            >
              <div className="w-full mx-auto max-w-[1600px] px-0 sm:px-2 md:px-0">
                <ErrorBoundary
                  showDetails={process.env.NODE_ENV === 'development'}
                  pageName="page content"
                >
                  {children}
                </ErrorBoundary>
              </div>
            </main>
          </div>
          <MobileBottomNav />
        </div>
      </ErrorBoundary>
    </AuthGuard>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProfileProvider>
      <DashboardContent>{children}</DashboardContent>
    </ProfileProvider>
  );
}

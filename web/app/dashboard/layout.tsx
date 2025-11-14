// web/app/dashboard/layout.tsx
"use client";

import { useProfile } from "@/hooks/useProfile";
import Sidebar from "@/components/Sidebar";
import LoadingScreen from "@/components/LoadingScreen";
import AuthGuard from "@/components/AuthGuard";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile, loading } = useProfile();

  if (loading) return <LoadingScreen />;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-amber-50/30">
        {/* Unified Sidebar with role-based navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 ml-64">
          {/* Header */}
          <header className="bg-gradient-to-r from-amber-600 to-yellow-600 shadow-lg border-b-4 border-amber-700 sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Welcome back, {profile.full_name}
                  </h1>
                  <p className="text-sm text-amber-100 mt-1 capitalize">
                    {profile.role} Portal • Bethel Heights Educational Development
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                    <p className="text-sm font-medium text-white">{profile.full_name}</p>
                    <p className="text-xs text-amber-100 capitalize">{profile.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

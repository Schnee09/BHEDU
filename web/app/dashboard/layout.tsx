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
      <div className="flex min-h-screen bg-gray-50">
        {/* Unified Sidebar with role-based navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 ml-64">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {profile.full_name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1 capitalize">
                    {profile.role} Portal
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
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

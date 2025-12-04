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
      <div className="flex min-h-screen bg-stone-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area - Responsive margin for sidebar */}
        <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

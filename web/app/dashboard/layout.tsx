// web/app/dashboard/layout.tsx
"use client";

import { useProfile } from "@/hooks/useProfile";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import LoadingScreen from "@/components/LoadingScreen";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useProfile();

  if (loading) return <LoadingScreen />;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <AuthGuard>
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar automatically adapts to user role */}
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Header profile={profile} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
    </AuthGuard>
  );
}

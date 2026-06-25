'use client';

import dynamic from 'next/dynamic';
import { useProfile } from '@/hooks/useProfile';
import { SkeletonStatCard, SkeletonCard } from '@/components/ui/skeleton';

// Dashboard skeleton used as a fallback loading state for dynamically imported dashboards
function DashboardSkeleton() {
  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-stone-200 dark:bg-stone-800 rounded-3xl animate-pulse" />
          <div className="h-6 w-96 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8">
            <SkeletonCard />
          </div>
          <div className="xl:col-span-4">
            <SkeletonCard />
          </div>
        </div>
      </div>
    </main>
  );
}

// Dynamically import role dashboards to reduce main bundle weight
const AdminDashboard = dynamic(() => import('@/components/dashboard/portals/AdminDashboard'), {
  loading: () => <DashboardSkeleton />,
});
const OwnerDashboard = dynamic(() => import('@/components/dashboard/portals/OwnerDashboard'), {
  loading: () => <DashboardSkeleton />,
});
const TeacherDashboard = dynamic(() => import('@/components/dashboard/portals/TeacherDashboard'), {
  loading: () => <DashboardSkeleton />,
});
const StudentDashboard = dynamic(() => import('@/components/dashboard/portals/StudentDashboard'), {
  loading: () => <DashboardSkeleton />,
});
const ParentDashboard = dynamic(() => import('@/components/dashboard/portals/ParentDashboard'), {
  loading: () => <DashboardSkeleton />,
});
const TutorDashboard = dynamic(() => import('@/components/dashboard/portals/TutorDashboard'), {
  loading: () => <DashboardSkeleton />,
});

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();

  if (profileLoading || !profile) {
    return <DashboardSkeleton />;
  }

  // Exact role determines which portal to render
  switch (profile.role) {
    case 'super_admin':
      return <AdminDashboard />;
    case 'owner':
      return <OwnerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'tutor':
      return <TutorDashboard />;
    default:
      return <AdminDashboard />;
  }
}

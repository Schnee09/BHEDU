'use client';

import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import { Icons } from '@/components/ui/Icons';
import TodayScheduleWidget from '@/components/dashboard/widgets/TodayScheduleWidget';
import RecentTutoringStudentsWidget from '@/components/dashboard/widgets/RecentTutoringStudentsWidget';
import AnnouncementsFeedWidget from '@/components/dashboard/widgets/AnnouncementsFeedWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';

interface TutorStats {
  myStudentCount: number;
  todaySessionsCount: number;
  totalSessionsCount: number;
}

export default function TutorDashboard() {
  const { profile } = useProfile();

  const { data: stats, loading: statsLoading } = useFetch<TutorStats>(
    profile ? '/api/tutor/dashboard' : null
  );

  const displayStats = stats || {
    myStudentCount: 0,
    todaySessionsCount: 0,
    totalSessionsCount: 0,
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/50 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Dashboard <span className="text-amber-500">Gia sư</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                Chào mừng trở lại,{' '}
                <span className="text-stone-900 dark:text-stone-100 font-black">
                  {profile?.full_name ?? 'Gia sư'}
                </span>
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md px-4 py-2 rounded-xl border border-stone-200/50 dark:border-white/5 shadow-xs">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                Hôm nay
              </span>
              <span className="text-xs font-black text-stone-800 dark:text-white">
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in duration-500">
            <StatCard
              label="Học sinh kèm"
              value={displayStats.myStudentCount}
              color="blue"
              icon={<Icons.Students className="w-4 h-4 text-blue-500" />}
              subtitle="Số học sinh đang kèm"
            />
            <StatCard
              label="Lịch dạy hôm nay"
              value={displayStats.todaySessionsCount}
              color={displayStats.todaySessionsCount > 0 ? 'amber' : 'slate'}
              icon={<Icons.Attendance className="w-4 h-4" />}
              subtitle={
                displayStats.todaySessionsCount > 0
                  ? `Có ${displayStats.todaySessionsCount} ca kèm`
                  : 'Trống lịch dạy hôm nay'
              }
            />
            <StatCard
              label="Tổng ca dạy kèm"
              value={displayStats.totalSessionsCount}
              color="emerald"
              icon={<Icons.Classes className="w-4 h-4 text-emerald-500" />}
              subtitle="Tổng ca kèm trong tuần"
            />
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 pb-12">
          {/* Left Column */}
          <div className="xl:col-span-8 space-y-4 sm:space-y-6">
            {/* Today Schedule */}
            <TodayScheduleWidget role="tutor" />

            {/* Tutored Students */}
            <RecentTutoringStudentsWidget />

            {/* Quick Actions */}
            <QuickActionsWidget
              isAdmin={false}
              isTeacher={false}
              isStudent={false}
              isTutor={true}
            />
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-4 sm:space-y-6">
            {/* School Announcements */}
            <AnnouncementsFeedWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

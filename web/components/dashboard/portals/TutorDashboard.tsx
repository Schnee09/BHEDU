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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10 space-y-8 md:space-y-12 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-stone-200/50 dark:border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Dashboard <span className="text-amber-500">Gia sư</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em] break-words">
                Chào mừng trở lại,{' '}
                <span className="text-stone-900 dark:text-stone-100">
                  {profile?.full_name ?? 'Gia sư'}
                </span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-stone-200/50 dark:border-white/5 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Hôm nay
              </span>
              <span className="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatCard
              label="Học sinh kèm"
              value={displayStats.myStudentCount}
              color="blue"
              icon={<Icons.Students className="w-5 h-5 text-blue-500" />}
              subtitle="Số học sinh đang giảng dạy"
            />
            <StatCard
              label="Lịch dạy hôm nay"
              value={displayStats.todaySessionsCount}
              color={displayStats.todaySessionsCount > 0 ? 'amber' : 'slate'}
              icon={<Icons.Attendance className="w-5 h-5" />}
              subtitle={
                displayStats.todaySessionsCount > 0
                  ? `Hôm nay có ${displayStats.todaySessionsCount} ca kèm`
                  : 'Hôm nay trống lịch dạy'
              }
            />
            <StatCard
              label="Tổng ca dạy kèm"
              value={displayStats.totalSessionsCount}
              color="emerald"
              icon={<Icons.Classes className="w-5 h-5 text-emerald-500" />}
              subtitle="Tổng lịch học kèm trong tuần"
            />
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-32 md:pb-12">
          {/* Left Column */}
          <div className="xl:col-span-8 space-y-12">
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
          <div className="xl:col-span-4 space-y-12">
            {/* School Announcements */}
            <AnnouncementsFeedWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

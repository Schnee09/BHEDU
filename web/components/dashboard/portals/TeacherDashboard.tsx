'use client';

import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import { Icons } from '@/components/ui/Icons';
import TodayScheduleWidget from '@/components/dashboard/widgets/TodayScheduleWidget';
import RecentGradesWidget from '@/components/dashboard/widgets/RecentGradesWidget';
import AnnouncementsFeedWidget from '@/components/dashboard/widgets/AnnouncementsFeedWidget';
import RankingWidget from '@/components/dashboard/RankingWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';

interface TeacherStats {
  myClassCount: number;
  myStudentCount: number;
  myClassesAvgGPA: number;
  todayAttendanceMarked: boolean;
  todaySlotsCount: number;
}

export default function TeacherDashboard() {
  const { profile } = useProfile();

  const { data: stats, loading: statsLoading } = useFetch<TeacherStats>(
    profile ? '/api/teacher/dashboard' : null
  );

  const displayStats = stats || {
    myClassCount: 0,
    myStudentCount: 0,
    myClassesAvgGPA: 0,
    todayAttendanceMarked: false,
    todaySlotsCount: 0,
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
                Dashboard <span className="text-amber-500">Giáo viên</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                Chào mừng trở lại,{' '}
                <span className="text-stone-900 dark:text-stone-100 font-black">
                  {profile?.full_name ?? 'Giáo viên'}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-500">
            <StatCard
              label="Lớp giảng dạy"
              value={displayStats.myClassCount}
              color="blue"
              icon={<Icons.Classes className="w-4 h-4 text-blue-500" />}
              subtitle="Lớp đang quản lý"
            />
            <StatCard
              label="Học sinh"
              value={displayStats.myStudentCount}
              color="slate"
              icon={<Icons.Students className="w-4 h-4 text-stone-500" />}
              subtitle="Học sinh trong danh sách"
            />
            <StatCard
              label="Điểm TB lớp"
              value={
                displayStats.myClassesAvgGPA > 0 ? displayStats.myClassesAvgGPA.toFixed(1) : '—'
              }
              color="emerald"
              icon={<Icons.Grades className="w-4 h-4 text-emerald-500" />}
              subtitle="/10 (ĐTB toàn lớp)"
            />
            <StatCard
              label="Điểm danh hôm nay"
              value={displayStats.todayAttendanceMarked ? 'Đã điểm danh' : 'Chưa'}
              color={displayStats.todayAttendanceMarked ? 'green' : 'amber'}
              icon={<Icons.Attendance className="w-4 h-4" />}
              subtitle={
                displayStats.todaySlotsCount > 0
                  ? `${displayStats.todaySlotsCount} ca học`
                  : 'Không có ca dạy'
              }
            />
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 pb-12">
          {/* Left Column */}
          <div className="xl:col-span-8 space-y-4 sm:space-y-6">
            {/* Today Schedule */}
            <TodayScheduleWidget role="teacher" />

            {/* Recent Grades */}
            <RecentGradesWidget dataUrl="/api/teacher/grades/recent" title="Điểm số vừa nhập" />

            {/* Quick Actions */}
            <QuickActionsWidget isAdmin={false} isTeacher={true} isStudent={false} />
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-4 sm:space-y-6">
            {/* Class Rankings */}
            {profile?.id && <RankingWidget limit={5} showAtRisk={true} teacherId={profile.id} />}

            {/* Announcements */}
            <AnnouncementsFeedWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import { Icons } from '@/components/ui/Icons';
import TodayScheduleWidget from '@/components/dashboard/widgets/TodayScheduleWidget';
import AttendanceStatsWidget from '@/components/dashboard/widgets/AttendanceStatsWidget';
import GradeProgressWidget from '@/components/dashboard/widgets/GradeProgressWidget';
import UpcomingDeadlinesWidget from '@/components/dashboard/widgets/UpcomingDeadlinesWidget';
import AnnouncementsFeedWidget from '@/components/dashboard/widgets/AnnouncementsFeedWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';

interface StudentStats {
  gpa: number;
  rank: number;
  totalRanked: number;
  attendanceRate: number;
  totalClasses: number;
  upcomingAssignments: number;
  trend: 'up' | 'down' | 'stable';
}

export default function StudentDashboard() {
  const { profile } = useProfile();

  const { data: stats, loading: statsLoading } = useFetch<StudentStats>(
    profile ? '/api/student/dashboard' : null
  );

  const displayStats = stats || {
    gpa: 0,
    rank: 0,
    totalRanked: 0,
    attendanceRate: 100,
    totalClasses: 0,
    upcomingAssignments: 0,
    trend: 'stable',
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-emerald-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-stone-500';
  };

  const getTrendSubtitle = (trend: string) => {
    if (trend === 'up') return 'Đang cải thiện đi lên';
    if (trend === 'down') return 'Cần tập trung cải thiện';
    return 'Duy trì ổn định';
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
                Dashboard <span className="text-amber-500">Học sinh</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em] break-words">
                Chào mừng trở lại,{' '}
                <span className="text-stone-900 dark:text-stone-100">
                  {profile?.full_name ?? 'Học sinh'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatCard
              label="Điểm trung bình"
              value={displayStats.gpa > 0 ? displayStats.gpa.toFixed(1) : '—'}
              color="emerald"
              icon={<Icons.Grades className="w-5 h-5 text-emerald-500" />}
              subtitle={getTrendSubtitle(displayStats.trend)}
            />
            <StatCard
              label="Xếp hạng hiện tại"
              value={displayStats.rank > 0 ? `#${displayStats.rank}` : '—'}
              color="blue"
              icon={<Icons.Students className="w-5 h-5 text-blue-500" />}
              subtitle={
                displayStats.totalRanked > 0
                  ? `/${displayStats.totalRanked} học sinh khối`
                  : 'Đang cập nhật'
              }
            />
            <StatCard
              label="Lớp học tham gia"
              value={displayStats.totalClasses}
              color="blue"
              icon={<Icons.Classes className="w-5 h-5 text-blue-500" />}
              subtitle="Số lớp đã đăng ký học"
            />
            <StatCard
              label="Bài tập sắp hạn"
              value={displayStats.upcomingAssignments}
              color={displayStats.upcomingAssignments > 0 ? 'orange' : 'green'}
              icon={<Icons.Assignments className="w-5 h-5" />}
              subtitle={
                displayStats.upcomingAssignments > 0 ? 'Cần hoàn thành sớm' : 'Đã hoàn thành hết'
              }
            />
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-32 md:pb-12">
          {/* Left Column */}
          <div className="xl:col-span-8 space-y-12">
            {/* Today Schedule */}
            <TodayScheduleWidget role="student" />

            {/* GPA Progress over Time */}
            <GradeProgressWidget />

            {/* Quick Actions */}
            <QuickActionsWidget isAdmin={false} isTeacher={false} isStudent={true} />
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-12">
            {/* Attendance Circular progress */}
            <AttendanceStatsWidget />

            {/* Upcoming Deadlines list */}
            <UpcomingDeadlinesWidget />

            {/* Announcements */}
            <AnnouncementsFeedWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

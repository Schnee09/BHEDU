'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch } from '@/lib/api/client';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard, SkeletonCard } from '@/components/ui/skeleton';
import { Icons } from '@/components/ui/Icons';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { AnalyticsWidget } from '@/components/dashboard/AnalyticsWidget';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import RankingWidget from '@/components/dashboard/RankingWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { SystemStatusWidget } from '@/components/dashboard/SystemStatusWidget';
import { SchoolMetrics } from '@/components/dashboard/SchoolMetrics';
import dynamic from 'next/dynamic';

const ClassComparison = dynamic(
  () => import('@/components/dashboard/ClassComparison').then(mod => mod.ClassComparison),
  { ssr: false, loading: () => <SkeletonCard /> }
);
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  attendanceToday: number;
  averageGPA?: number;
  attendanceRate?: number;
  passRate?: number;
  recentActivity?: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export interface ClassComparisonItem {
  classId: string;
  className: string;
  teacherName: string;
  studentCount: number;
  averageGPA: number;
  attendanceRate: number;
  passRate: number;
}

export interface StudentRankItem {
  studentId: string;
  rank: number;
  average: number;
  className: string;
  recentTrend: 'up' | 'down' | 'stable';
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { isAdmin, isStaff, isTeacher, isStudent } = usePermissions();

  const { data: stats, loading: statsLoading } = useFetch<DashboardStats>(
    profile ? '/api/dashboard/stats' : null
  );

  const { data: classComparisonData, loading: classComparisonLoading } = useFetch<{
    classes: ClassComparisonItem[];
  }>((isAdmin || isTeacher) && profile ? '/api/classes/comparison' : null);

  // Real analytics data
  const { data: gradeDistData } = useFetch<{ distribution: { name: string; value: number }[] }>(
    (isAdmin || isTeacher) && profile ? '/api/dashboard/grade-distribution' : null
  );
  const { data: weeklyAttData } = useFetch<{ weeklyData: { name: string; present: number }[] }>(
    (isAdmin || isTeacher) && profile ? '/api/dashboard/weekly-attendance' : null
  );

  // Student personal stats
  const { data: studentRankData } = useFetch<{
    topStudents: StudentRankItem[];
    atRiskStudents: StudentRankItem[];
  }>(isStudent && profile ? '/api/grades/rankings?limit=100' : null);

  useEffect(() => {
    if (profile && !profileLoading && !statsLoading) {
      // Role-based landing logic
      switch (profile.role) {
        case 'owner':
          router.replace('/dashboard/admin/students');
          break;
        case 'tutor':
          router.replace('/dashboard/timetable');
          break;
        case 'parent':
          router.replace('/dashboard/parent');
          break;
      }
    }
  }, [profile, profileLoading, statsLoading, router]);

  if (profileLoading || (statsLoading && !stats)) {
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

  const getRoleTitle = () => {
    if (profile?.role === 'super_admin') return 'Siêu Quản Trị';
    if (isAdmin) return 'Quản trị viên';
    if (isTeacher) return 'Giáo viên';
    if (isStudent) return 'Học sinh';
    return 'Thành viên';
  };

  const displayStats = stats || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    attendanceToday: 0,
    averageGPA: 0,
    attendanceRate: 0,
    passRate: 0,
  };

  const classData = classComparisonData?.classes || [];

  // Real chart data with sensible fallbacks
  const gradeDistribution = gradeDistData?.distribution?.length
    ? gradeDistData.distribution
    : [{ name: 'Chưa có phân loại', value: 1 }];

  const weeklyAttendance = weeklyAttData?.weeklyData?.length
    ? weeklyAttData.weeklyData.map((d) => ({ ...d, 'Có mặt': d.present }))
    : [];

  // Find current student's own stats from rankings
  const myRanking =
    isStudent && studentRankData?.topStudents
      ? studentRankData.topStudents.find((s: any) => s.studentId === profile?.id)
      : null;
  const totalRankedStudents = studentRankData?.topStudents?.length || 0;

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10 space-y-8 md:space-y-12 relative z-10">
        {/* Page Header - Professional Refinement */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-stone-200/50 dark:border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Dashboard <span className="text-amber-500">{getRoleTitle()}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em] break-words">
                Chào mừng trở lại,{' '}
                <span className="text-stone-900 dark:text-stone-100">
                  {profile?.full_name ?? 'User'}
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

        {/* Top Stats Cards - Optimized for Cross-Device Density */}
        {isAdmin || isTeacher ? (
          <SchoolMetrics
            totalStudents={displayStats.totalStudents}
            totalTeachers={displayStats.totalTeachers}
            totalClasses={displayStats.totalClasses}
            averageGPA={displayStats.averageGPA ?? 0}
            attendanceRate={displayStats.attendanceRate ?? 0}
            passRate={displayStats.passRate ?? 0}
            loading={statsLoading}
          />
        ) : isStudent ? (
          /* Student: personal stat cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              label="Điểm trung bình"
              value={myRanking ? myRanking.average.toFixed(1) : '—'}
              color="emerald"
              icon={<Icons.Grades className="w-5 h-5 text-emerald-500" />}
              subtitle="/10 (Điểm TB tích lũy)"
            />
            <StatCard
              label="Xếp hạng hiện tại"
              value={myRanking ? `#${myRanking.rank}` : '—'}
              color="blue"
              icon={<Icons.Students className="w-5 h-5 text-blue-500" />}
              subtitle={`/${totalRankedStudents} học sinh khối`}
            />
            <StatCard
              label="Lớp sinh hoạt"
              value={myRanking?.className || '—'}
              color="blue"
              icon={<Icons.Classes className="w-5 h-5 text-blue-500" />}
              subtitle="Năm học 2024 - 2025"
            />
            <StatCard
              label="Điểm danh"
              value={displayStats.attendanceToday > 0 ? 'Hợp lệ' : 'Chưa có'}
              color="green"
              icon={<Icons.Attendance className="w-5 h-5 text-emerald-500" />}
              subtitle={displayStats.attendanceToday > 0 ? 'Đã ghi nhận hôm nay' : 'Cần điểm danh'}
            />
          </div>
        ) : (
          /* Fallback for other roles */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              label="Lớp học"
              value={displayStats.totalClasses}
              color="blue"
              icon={<Icons.Classes className="w-5 h-5" />}
            />
            <StatCard
              label="Bài tập"
              value={displayStats.totalAssignments}
              color="blue"
              icon={<Icons.Assignments className="w-5 h-5 text-blue-500" />}
            />
            <StatCard
              label="Điểm danh"
              value={displayStats.attendanceToday}
              color="amber"
              icon={<Icons.Attendance className="w-5 h-5" />}
            />
            <StatCard
              label="Học sinh"
              value={displayStats.totalStudents}
              color="slate"
              icon={<Icons.Students className="w-5 h-5" />}
            />
          </div>
        )}

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-32 md:pb-12">
          {/* Left Column - Analytics & Primary Stats */}
          <div className="xl:col-span-8 space-y-12">
            {/* Charts Section - Admin/Teacher only */}
            {(isAdmin || isTeacher) && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight pl-3 border-l-4 border-amber-500">
                    Thống kê đào tạo
                  </h2>
                  <Link
                    href="/dashboard/grades/analytics"
                    className="text-[10px] md:text-xs font-black text-amber-600 hover:text-amber-500 uppercase tracking-tighter flex items-center gap-1 transition-all group"
                  >
                    Xem báo cáo toàn diện{' '}
                    <Icons.ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <AnalyticsWidget
                    title="Phân bố năng lực"
                    subtitle="Dựa trên điểm trung bình"
                    chartType="pie"
                    data={gradeDistribution}
                    dataKey="value"
                    height={280}
                    loading={!gradeDistData}
                    colorPalette="gradeScale"
                    className="rounded-2xl"
                  />

                  <AnalyticsWidget
                    title="Tỷ lệ chuyên cần"
                    subtitle="Biến động trong tuần"
                    chartType="area"
                    data={weeklyAttendance}
                    dataKey="Có mặt"
                    height={280}
                    loading={!weeklyAttData}
                    emptyMessage="Chưa có dữ liệu chuyên cần tuần này"
                    className="rounded-2xl"
                  />
                </div>

                <div className="mt-8">
                  <ClassComparison classes={classData} loading={classComparisonLoading} />
                </div>
              </section>
            )}

            {/* Student Personal Stats - Only for students */}
            {isStudent && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight pl-3 border-l-4 border-amber-500">
                    Kết quả học tập
                  </h2>
                  <Link
                    href={routes.grades.list()}
                    className="text-[10px] md:text-xs font-black text-amber-600 hover:text-amber-500 uppercase tracking-tighter flex items-center gap-1 transition-all group"
                  >
                    Xem chi tiết{' '}
                    <Icons.ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-2xl p-8 border border-stone-200/50 dark:border-white/5 text-center shadow-sm">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">
                      Điểm TB
                    </p>
                    <p className="text-5xl font-black text-amber-500 tabular-nums">
                      {myRanking ? myRanking.average.toFixed(1) : '—'}
                    </p>
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 mt-2 uppercase tracking-tight">
                      Thang điểm 10
                    </p>
                  </div>
                  <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-2xl p-8 border border-stone-200/50 dark:border-white/5 text-center shadow-sm">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">
                      Xếp hạng
                    </p>
                    <p className="text-5xl font-black text-blue-500 tabular-nums">
                      #{myRanking ? myRanking.rank : '—'}
                    </p>
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 mt-2 uppercase tracking-tight">
                      /{totalRankedStudents} học sinh
                    </p>
                  </div>
                  <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-2xl p-8 border border-stone-200/50 dark:border-white/5 text-center shadow-sm">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">
                      Điểm danh
                    </p>
                    <p className="text-5xl font-black text-emerald-500">
                      {displayStats.attendanceToday > 0 ? '✓' : '—'}
                    </p>
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 mt-2 uppercase tracking-tight">
                      {displayStats.attendanceToday > 0 ? 'Hợp lệ hôm nay' : 'Chưa ghi nhận'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Actions - Academic Refinement */}
            <QuickActionsWidget isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
          </div>

          {/* Right Column - Activity & Secondary Info */}
          <div className="xl:col-span-4 space-y-12 animate-in fade-in slide-in-from-right-4 duration-700 delay-450">
            {/* Rankings: admin/teacher see full widget */}
            {(isAdmin || isTeacher) && (
              <RankingWidget limit={5} showAtRisk={isAdmin || isTeacher} />
            )}

            <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-3xl rounded-3xl border border-stone-200/50 dark:border-white/5 overflow-hidden shadow-sm">
              <div className="px-8 py-5 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
                <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
                  Hoạt động hệ thống
                </h3>
              </div>
              <ActivityFeed limit={8} />
            </div>

            {/* System Status Card - Admin & Staff */}
            {isStaff && <SystemStatusWidget />}
          </div>
        </div>
      </div>
    </div>
  );
}

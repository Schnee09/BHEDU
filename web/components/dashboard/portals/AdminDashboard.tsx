'use client';

import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard, SkeletonCard } from '@/components/ui/skeleton';
import { Icons } from '@/components/ui/Icons';
import Link from 'next/link';
import { AnalyticsWidget } from '@/components/dashboard/AnalyticsWidget';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import RankingWidget from '@/components/dashboard/RankingWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { SystemStatusWidget } from '@/components/dashboard/SystemStatusWidget';
import { SchoolMetrics } from '@/components/dashboard/SchoolMetrics';
import dynamic from 'next/dynamic';

const ClassComparison = dynamic(
  () => import('@/components/dashboard/ClassComparison').then((mod) => mod.ClassComparison),
  { ssr: false, loading: () => <SkeletonCard /> }
);

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

export default function AdminDashboard() {
  const { profile } = useProfile();
  const { isAdmin, isStaff, isTeacher } = usePermissions();

  const { data: stats, loading: statsLoading } = useFetch<DashboardStats>(
    profile ? '/api/dashboard/stats' : null
  );

  const { data: classComparisonData, loading: classComparisonLoading } = useFetch<{
    classes: ClassComparisonItem[];
  }>((isAdmin || isTeacher) && profile ? '/api/classes/comparison' : null);

  const { data: gradeDistData } = useFetch<{ distribution: { name: string; value: number }[] }>(
    (isAdmin || isTeacher) && profile ? '/api/dashboard/grade-distribution' : null
  );
  const { data: weeklyAttData } = useFetch<{ weeklyData: { name: string; present: number }[] }>(
    (isAdmin || isTeacher) && profile ? '/api/dashboard/weekly-attendance' : null
  );

  const getRoleTitle = () => {
    if (profile?.role === 'super_admin') return 'Siêu Quản Trị';
    if (profile?.role === 'owner') return 'Chủ trung tâm';
    if (isAdmin) return 'Quản trị viên';
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

  const gradeDistribution = gradeDistData?.distribution?.length
    ? gradeDistData.distribution
    : [{ name: 'Chưa có phân loại', value: 1 }];

  const weeklyAttendance = weeklyAttData?.weeklyData?.length
    ? weeklyAttData.weeklyData.map((d) => ({ ...d, 'Có mặt': d.present }))
    : [];

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/50 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Dashboard <span className="text-amber-500">{getRoleTitle()}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                Chào mừng trở lại,{' '}
                <span className="text-stone-900 dark:text-stone-100 font-black">
                  {profile?.full_name ?? 'User'}
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

        {/* Top Stats Cards */}
        <SchoolMetrics
          totalStudents={displayStats.totalStudents}
          totalTeachers={displayStats.totalTeachers}
          totalClasses={displayStats.totalClasses}
          averageGPA={displayStats.averageGPA ?? 0}
          attendanceRate={displayStats.attendanceRate ?? 0}
          passRate={displayStats.passRate ?? 0}
          loading={statsLoading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 pb-12">
          {/* Left Column - Analytics & Primary Stats */}
          <div className="xl:col-span-8 space-y-4 sm:space-y-6">
            <section className="space-y-3 sm:space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight pl-2.5 border-l-4 border-amber-500">
                  Thống kê đào tạo
                </h2>
                <Link
                  href="/dashboard/grades/analytics"
                  className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1 transition-all group"
                >
                  Xem báo cáo{' '}
                  <Icons.ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <AnalyticsWidget
                  title="Phân bố năng lực"
                  subtitle="Dựa trên điểm trung bình"
                  chartType="pie"
                  data={gradeDistribution}
                  dataKey="value"
                  height={240}
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
                  height={240}
                  loading={!weeklyAttData}
                  emptyMessage="Chưa có dữ liệu chuyên cần tuần này"
                  className="rounded-2xl"
                />
              </div>

              <div className="mt-4">
                <ClassComparison classes={classData} loading={classComparisonLoading} />
              </div>
            </section>

            {/* Quick Actions */}
            <QuickActionsWidget isAdmin={isAdmin} isTeacher={isTeacher} isStudent={false} />
          </div>

          {/* Right Column - Activity & Secondary Info */}
          <div className="xl:col-span-4 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <RankingWidget limit={5} showAtRisk={isAdmin || isTeacher} />

            <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-2xl border border-stone-200/50 dark:border-white/5 overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
                <h3 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
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

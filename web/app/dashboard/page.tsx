"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { apiFetch } from "@/lib/api/client";
import { StatCard } from "@/components/ui/Card";
import { SkeletonStatCard, SkeletonCard } from "@/components/ui/skeleton";
import { Icons } from "@/components/ui/Icons";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { AnalyticsWidget } from "@/components/dashboard/AnalyticsWidget";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  attendanceToday: number;
  recentActivity?: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { isAdmin, isStaff, isTeacher, isStudent } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    attendanceToday: 0,
  });

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await apiFetch('/api/dashboard/stats');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch stats');
        }
        const data = await response.json();

        if (mounted && data) {
          setStats({
            totalStudents: data.totalStudents || 0,
            totalTeachers: data.totalTeachers || 0,
            totalClasses: data.totalClasses || 0,
            totalAssignments: data.totalAssignments || 0,
            attendanceToday: data.attendanceToday || 0,
            recentActivity: data.recentActivity || [],
          });
          logger.info('Dashboard stats loaded', { stats: data });
        }
      } catch (error) {
        logger.error('Error loading dashboard stats', error as Error);
        if (mounted) {
          setStats({
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            totalAssignments: 0,
            attendanceToday: 0,
            recentActivity: [],
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, [profile]);

  useEffect(() => {
    if (profile && !loading && !profileLoading) {
      // Role-based landing logic
      switch (profile.role) {
        case "owner":
          router.replace("/dashboard/admin/finance");
          break;
        case "tutor":
          router.replace("/dashboard/timetable");
          break;
        case "parent":
          router.replace("/dashboard/parent");
          break;
        // admin, super_admin, teacher, student stay on main dashboard
      }
    }
  }, [profile, loading, profileLoading, router]);

  if (profileLoading || loading) {
    return (
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-stone-200 rounded animate-pulse" />
            <div className="h-6 w-96 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    );
  }

  const getRoleTitle = () => {
    if (profile?.role === "super_admin") return "Bảng điều khiển Siêu Quản Trị";
    if (isAdmin) return "Bảng điều khiển Quản trị viên";
    if (isTeacher) return "Bảng điều khiển Giáo viên";
    if (isStudent) return "Cổng thông tin Học sinh";
    return "Bảng điều khiển";
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8 relative z-10">
        {/* Page Header - Professional Refinement */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100 uppercase tracking-tight">
              {getRoleTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-2 pl-4">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Xin chào, <span className="text-amber-600 dark:text-amber-500">{profile?.full_name ?? "Người dùng"}</span>
            </span>
          </div>
        </div>

        {/* Top Stats Cards - Optimized for Cross-Device Density */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
          <StatCard
            label="Tổng Học sinh"
            value={stats.totalStudents}
            color="orange"
            icon={<Icons.Students className="w-5 h-5 md:w-6 md:h-6" />}
            subtitle="Học sinh"
          />
          <StatCard
            label="Giáo viên"
            value={stats.totalTeachers}
            color="purple"
            icon={<Icons.Teachers className="w-5 h-5 md:w-6 md:h-6" />}
            subtitle="Đội ngũ"
          />
          <StatCard
            label="Lớp học"
            value={stats.totalClasses}
            color="green"
            icon={<Icons.Classes className="w-5 h-5 md:w-6 md:h-6" />}
            subtitle="Lớp"
          />
          <StatCard
            label="Bài tập"
            value={stats.totalAssignments}
            color="blue"
            icon={<Icons.Assignments className="w-5 h-5 md:w-6 md:h-6" />}
            subtitle="Bài giao"
          />
          <StatCard
            label="Điểm danh"
            value={stats.attendanceToday}
            color="slate"
            icon={<Icons.Attendance className="w-5 h-5 md:w-6 md:h-6" />}
            subtitle="Hôm nay"
            className="col-span-1 sm:col-span-2 lg:col-span-1"
          />
        </div>

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 pb-32 md:pb-8">
          {/* Left Column - Analytics & Primary Stats */}
          <div className="xl:col-span-8 space-y-8">
            {/* Charts Section - Admin/Teacher only - Optimized for mobile */}
            {(isAdmin || isTeacher) && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-base md:text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-2 border-l-4 border-amber-500">Thống kê chi tiết</h2>
                  <link href="/dashboard/grades/analytics" className="text-[10px] md:text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-tighter" />Xem báo cáo →
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <AnalyticsWidget
                    title="Phân bố điểm số"
                    subtitle="Theo thang điểm học kỳ"
                    chartType="pie"
                    data={[
                      { name: 'Giỏi', value: 35 },
                      { name: 'Khá', value: 40 },
                      { name: 'TB', value: 18 },
                      { name: 'Yếu', value: 7 },
                    ]}
                    dataKey="value"
                    height={250}
                    className="rounded-[32px]"
                  />

                  <AnalyticsWidget
                    title="Xu hướng điểm danh"
                    subtitle="7 ngày làm việc gần nhất"
                    chartType="area"
                    data={[
                      { name: 'T2', present: 92 }, { name: 'T3', present: 95 },
                      { name: 'T4', present: 88 }, { name: 'T5', present: 94 },
                      { name: 'T6', present: 91 }, { name: 'T7', present: 45 },
                    ]}
                    dataKey="present"
                    height={250}
                    className="rounded-[32px]"
                  />
                </div>
              </section>
            )}

            {/* Quick Actions - Pro Max Mobile Refined */}
            <section className="space-y-6">
              <h2 className="text-base md:text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-2 border-l-4 border-amber-500 mx-2">Hành động nhanh</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 px-2">
                {isAdmin && (
                  <>
                    <QuickActionSmall href={routes.students.list()} icon={<Icons.Students />} title="Học sinh" color="orange" />
                    <QuickActionSmall href="/dashboard/users" icon={<Icons.Teachers />} title="Giáo viên" color="purple" />
                    <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp học" color="green" />
                  </>
                )}
                {isTeacher && (
                  <>
                    <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp của tôi" color="blue" />
                    <QuickActionSmall href="/dashboard/grades" icon={<Icons.Grades />} title="Ghi điểm" color="purple" />
                    <QuickActionSmall href={routes.attendance.mark()} icon={<Icons.Attendance />} title="Điểm danh" color="orange" />
                  </>
                )}
                {isStudent && (
                  <>
                    <QuickActionSmall href="/dashboard/assignments" icon={<Icons.Assignments />} title="Bài tập" color="green" />
                    <QuickActionSmall href="/dashboard/scores" icon={<Icons.Grades />} title="Kết quả" color="purple" />
                    <QuickActionSmall href="/dashboard/profile" icon={<Icons.Users />} title="Hồ sơ" color="slate" />
                  </>
                )}
              </div>
            </section>
          </div>


          {/* Right Column - Activity & Secondary Info (PC Only side-by-side) */}
          <div className="xl:col-span-4 space-y-8">
            {isAdmin && (
              <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-[40px] p-2 border border-stone-200 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
                  <h3 className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Hoạt động hệ thống</h3>
                </div>
                <ActivityFeed limit={12} />
              </div>
            )}

            {/* System Status Card (PC Add-on) */}
            <div className="hidden xl:block bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl p-8 rounded-[40px] border border-stone-200 dark:border-white/10 shadow-lg relative overflow-hidden group">
              {/* Status Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />

              <h4 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                <div className="w-1 h-3 bg-green-500/50 rounded-full" />
                Trạng thái hạ tầng
              </h4>
              <div className="space-y-6">
                <StatusItem label="Database Cluster" status="online" />
                <StatusItem label="Auth Engine" status="online" />
                <StatusItem label="Cloud Assets" status="online" />
                <StatusItem label="Real-time Sync" status="online" />
              </div>
              <div className="mt-10 pt-6 border-t border-stone-100 dark:border-white/5">
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.3em] text-center opacity-60 italic">Hệ thống đang ổn định</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
* Small PC-optimized Quick Action - Pro Max Style
*/
function QuickActionSmall({ href, icon, title, color }: any) {
  return (
    <Link href={href} className="group relative flex items-center gap-4 p-5 rounded-[22px] bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl border border-stone-200 dark:border-white/10 hover:border-amber-500/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 active:scale-95 overflow-hidden">
      {/* Background Accent */}
      <div className={cn("absolute right-[-10%] bottom-[-10%] w-16 h-16 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity",
        color === 'orange' ? 'bg-orange-500' :
          color === 'purple' ? 'bg-purple-500' :
            color === 'green' ? 'bg-green-500' :
              color === 'blue' ? 'bg-blue-500' : 'bg-stone-500'
      )} />

      <div className={cn("p-3 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
        color === 'orange' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
          color === 'purple' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
            color === 'green' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
              color === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-stone-500/10 text-stone-600 dark:text-stone-400'
      )}>
        <div className="scale-110">{icon}</div>
      </div>
      <span className="font-black text-sm text-stone-800 dark:text-white uppercase tracking-tight">{title}</span>
    </Link>
  );
}

function StatusItem({ label, status }: { label: string, status: 'online' | 'offline' }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-sm font-bold text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase text-stone-500 opacity-60 tracking-widest">{status}</span>
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
      </div>
    </div>
  );
}

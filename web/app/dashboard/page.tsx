"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
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

  const { data: stats, loading: statsLoading, error: statsError } = useFetch<DashboardStats>(
    profile ? '/api/dashboard/stats' : null
  );

  useEffect(() => {
    if (profile && !profileLoading && !statsLoading) {
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
    if (profile?.role === "super_admin") return "Siêu Quản Trị";
    if (isAdmin) return "Quản trị viên";
    if (isTeacher) return "Giáo viên";
    if (isStudent) return "Học sinh";
    return "Thành viên";
  };

  const displayStats = stats || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    attendanceToday: 0,
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8 md:space-y-12 relative z-10">
        {/* Page Header - Professional Refinement */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-stone-200/50 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
              <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Dashboard <span className="text-amber-500">{getRoleTitle()}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <span className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                Chào mừng trở lại, <span className="text-stone-900 dark:text-stone-100">{profile?.full_name ?? "User"}</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md px-6 py-3 rounded-[32px] border border-stone-200/50 dark:border-white/5 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Hôm nay</span>
              <span className="text-sm font-black text-stone-800 dark:text-white uppercase">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>

        {/* Top Stats Cards - Optimized for Cross-Device Density */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <StatCard
            label="Tổng Học sinh"
            value={displayStats.totalStudents}
            color="orange"
            icon={<Icons.Students className="w-6 h-6" />}
            subtitle="Thành viên"
          />
          <StatCard
            label="Giáo viên"
            value={displayStats.totalTeachers}
            color="purple"
            icon={<Icons.Teachers className="w-6 h-6" />}
            subtitle="Chuyên môn"
          />
          <StatCard
            label="Lớp học"
            value={displayStats.totalClasses}
            color="green"
            icon={<Icons.Classes className="w-6 h-6" />}
            subtitle="Đang chạy"
          />
          <StatCard
            label="Bài tập"
            value={displayStats.totalAssignments}
            color="blue"
            icon={<Icons.Assignments className="w-6 h-6" />}
            subtitle="Giao mới"
          />
          <StatCard
            label="Điểm danh"
            value={displayStats.attendanceToday}
            color="amber"
            icon={<Icons.Attendance className="w-6 h-6" />}
            subtitle="Hoàn tất"
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-32 md:pb-12">
          {/* Left Column - Analytics & Primary Stats */}
          <div className="xl:col-span-8 space-y-12">
            {/* Charts Section - Admin/Teacher only - Optimized for mobile */}
            {(isAdmin || isTeacher) && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-3 border-l-4 border-amber-500">Thống kê đào tạo</h2>
                  <Link href="/dashboard/grades/analytics" className="text-[10px] md:text-xs font-black text-amber-600 hover:text-amber-500 uppercase tracking-tighter flex items-center gap-1 transition-all group">
                    Xem báo cáo toàn diện <Icons.ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <AnalyticsWidget
                    title="Phân bố năng lực"
                    subtitle="Dựa trên điểm trung bình"
                    chartType="pie"
                    data={[
                      { name: 'Giỏi', value: 35 },
                      { name: 'Khá', value: 40 },
                      { name: 'TB', value: 18 },
                      { name: 'Yếu', value: 7 },
                    ]}
                    dataKey="value"
                    height={280}
                    className="rounded-[32px] overflow-hidden"
                  />

                  <AnalyticsWidget
                    title="Tỷ lệ chuyên cần"
                    subtitle="Biến động trong tuần"
                    chartType="area"
                    data={[
                      { name: 'T2', present: 92 }, { name: 'T3', present: 95 },
                      { name: 'T4', present: 88 }, { name: 'T5', present: 94 },
                      { name: 'T6', present: 91 }, { name: 'T7', present: 45 },
                    ]}
                    dataKey="present"
                    height={280}
                    className="rounded-[32px] overflow-hidden"
                  />
                </div>
              </section>
            )}

            {/* Quick Actions - Pro Max Mobile Refined */}
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <h2 className="text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-3 border-l-4 border-amber-500 mx-2">Tác vụ nhanh</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
                {isAdmin && (
                  <>
                    <QuickActionSmall href={routes.students.list()} icon={<Icons.Students />} title="Học sinh" color="orange" />
                    <QuickActionSmall href="/dashboard/users" icon={<Icons.Teachers />} title="Giảng viên" color="purple" />
                    <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp học" color="green" />
                    <QuickActionSmall href="/dashboard/settings" icon={<Icons.Settings />} title="Cài đặt" color="slate" />
                  </>
                )}
                {isTeacher && (
                  <>
                    <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp dạy" color="blue" />
                    <QuickActionSmall href="/dashboard/grades" icon={<Icons.Grades />} title="Nhập điểm" color="purple" />
                    <QuickActionSmall href={routes.attendance.mark()} icon={<Icons.Attendance />} title="Điểm danh" color="orange" />
                    <QuickActionSmall href="/dashboard/timetable" icon={<Icons.Calendar />} title="Lịch dạy" color="amber" />
                  </>
                )}
                {isStudent && (
                  <>
                    <QuickActionSmall href="/dashboard/assignments" icon={<Icons.Assignments />} title="Bài tập" color="green" />
                    <QuickActionSmall href="/dashboard/scores" icon={<Icons.Grades />} title="Kết quả" color="purple" />
                    <QuickActionSmall href="/dashboard/timetable" icon={<Icons.Calendar />} title="Thời khóa biểu" color="blue" />
                    <QuickActionSmall href="/dashboard/profile" icon={<Icons.Users />} title="Hồ sơ" color="slate" />
                  </>
                )}
              </div>
            </section>
          </div>


          {/* Right Column - Activity & Secondary Info (PC Only side-by-side) */}
          <div className="xl:col-span-4 space-y-12 animate-in fade-in slide-in-from-right-4 duration-700 delay-450">
            <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-3xl rounded-[40px] p-2 border border-stone-200/50 dark:border-white/5 overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-stone-100 dark:border-white/5 bg-white/40 dark:bg-white/5">
                <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">Hoạt động mới nhất</h3>
              </div>
              <ActivityFeed limit={10} />
            </div>

            {/* System Status Card (PC Add-on) */}
            <div className="hidden xl:block bg-stone-900 dark:bg-black p-10 rounded-[40px] border border-stone-800 shadow-2xl relative overflow-hidden group">
              {/* Status Glow */}
              <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-green-500/10 blur-[100px] rounded-full group-hover:bg-green-500/20 transition-all duration-700" />

              <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Infrastructure status
              </h4>
              <div className="space-y-8">
                <StatusItem label="Database Engine" status="online" />
                <StatusItem label="Authentication" status="online" />
                <StatusItem label="Storage Cluster" status="online" />
                <StatusItem label="Edge Functions" status="online" />
              </div>
              <div className="mt-12 pt-8 border-t border-stone-800">
                <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.3em] text-center italic opacity-60">System monitoring active</p>
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
    <Link href={href} className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl border border-stone-200/50 dark:border-white/5 hover:border-amber-500/50 hover:shadow-[0_25px_50px_-20px_rgba(245,158,11,0.15)] transition-all duration-500 active:scale-95 overflow-hidden">
      {/* Background Accent */}
      <div className={cn("absolute right-[-15%] top-[-15%] w-24 h-24 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700",
        color === 'orange' ? 'bg-orange-500' :
          color === 'purple' ? 'bg-purple-500' :
            color === 'green' ? 'bg-green-500' :
              color === 'blue' ? 'bg-blue-500' :
                color === 'amber' ? 'bg-amber-500' : 'bg-stone-500'
      )} />

      <div className={cn("p-4 rounded-2xl transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 shadow-sm relative z-10",
        color === 'orange' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
          color === 'purple' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
            color === 'green' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
              color === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                color === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-stone-500/10 text-stone-600 dark:text-stone-400'
      )}>
        <div className="scale-125">{icon}</div>
      </div>
      <span className="font-black text-xs text-stone-800 dark:text-white uppercase tracking-wider relative z-10">{title}</span>
    </Link>
  );
}

function StatusItem({ label, status }: { label: string, status: 'online' | 'offline' }) {
  return (
    <div className="flex items-center justify-between group cursor-default">
      <span className="text-xs font-bold text-stone-400 group-hover:text-white transition-colors tracking-tight">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black uppercase text-stone-600 opacity-60 tracking-widest">{status}</span>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] group-hover:scale-125 transition-transform" />
      </div>
    </div>
  );
}

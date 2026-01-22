"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
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
  const { profile, loading: profileLoading } = useProfile();
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
    switch (profile?.role) {
      case "admin": return "Bảng điều khiển Quản trị viên";
      case "teacher": return "Bảng điều khiển Giáo viên";
      case "student": return "Cổng thông tin Học sinh";
      default: return "Bảng điều khiển";
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-[1600px] mx-auto px-4 py-4 md:py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter">
            {getRoleTitle()}
          </h1>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Xin chào, <span className="font-bold text-amber-600 dark:text-amber-500">{profile?.full_name ?? "Người dùng"}</span>
          </p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
          <StatCard label="Học sinh" value={stats.totalStudents} color="orange" icon={<Icons.Students />} />
          <StatCard label="Giáo viên" value={stats.totalTeachers} color="purple" icon={<Icons.Teachers />} />
          <StatCard label="Lớp học" value={stats.totalClasses} color="green" icon={<Icons.Classes />} />
          <StatCard label="Bài tập" value={stats.totalAssignments} color="blue" icon={<Icons.Assignments />} />
          <StatCard label="Hôm nay" value={stats.attendanceToday} color="slate" icon={<Icons.Attendance />} />
        </div>

        {/* Main Content Grid - Responsive PC Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20 md:pb-8">
          {/* Left Column - Analytics & Primary Stats */}
          <div className="xl:col-span-8 space-y-8">
             {/* Charts Section - Admin/Teacher only */}
            {(profile?.role === "admin" || profile?.role === "teacher") && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-2 border-l-4 border-amber-500">Thống kê chi tiết</h2>
                  <Link href="/dashboard/grades/analytics" className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-tighter">Xem báo cáo →</Link>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    height={300}
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
                    height={300}
                  />
                </div>
              </section>
            )}

            {/* Quick Actions - Cross Platform Refined */}
            <section className="space-y-6">
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-2 border-l-4 border-amber-500">Hành động nhanh</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile?.role === "admin" && (
                  <>
                    <QuickActionSmall href={routes.students.list()} icon={<Icons.Students />} title="Học sinh" color="orange" />
                    <QuickActionSmall href="/dashboard/users" icon={<Icons.Teachers />} title="Giáo viên" color="purple" />
                    <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp học" color="green" />
                  </>
                )}
                {profile?.role === "teacher" && (
                  <>
                    <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp của tôi" color="blue" />
                    <QuickActionSmall href="/dashboard/grades" icon={<Icons.Grades />} title="Ghi điểm" color="purple" />
                    <QuickActionSmall href={routes.attendance.mark()} icon={<Icons.Attendance />} title="Điểm danh" color="orange" />
                  </>
                )}
                {profile?.role === "student" && (
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
             {profile?.role === "admin" && (
               <div className="glass-premium rounded-[32px] p-2 border border-white/10 overflow-hidden shadow-xl">
                 <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest">Hoạt động hệ thống</h3>
                 </div>
                 <ActivityFeed limit={12} />
               </div>
             )}

             {/* System Status Card (PC Add-on) */}
             <div className="hidden xl:block glass-premium p-6 rounded-[32px] border border-white/10 shadow-lg">
                <h4 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-6">Trạng thái hạ tầng</h4>
                <div className="space-y-5">
                   <StatusItem label="Database Cluster" status="online" />
                   <StatusItem label="Auth Engine" status="online" />
                   <StatusItem label="Cloud Assets" status="online" />
                   <StatusItem label="Real-time Sync" status="online" />
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                   <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest text-center">Tất cả hệ thống bình thường</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Small PC-optimized Quick Action
 */
function QuickActionSmall({ href, icon, title, color }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 p-4 rounded-2xl glass-premium border border-white/10 hover:border-amber-500/50 hover:shadow-lg transition-all active:scale-95 group">
       <div className={cn("p-2.5 rounded-xl transition-all group-hover:scale-110", 
         color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
         color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
         color === 'green' ? 'bg-green-500/10 text-green-500' :
         color === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-stone-500/10 text-stone-500'
       )}>
         {icon}
       </div>
       <span className="font-bold text-sm text-stone-900 dark:text-white">{title}</span>
    </Link>
  );
}

function StatusItem({ label, status }: { label: string, status: 'online' | 'offline' }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-sm font-bold text-stone-600 dark:text-stone-400">{label}</span>
       <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-stone-500 opacity-60">{status}</span>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
       </div>
    </div>
  );
}

function QuickActionCard({ href, icon, title, description, color }: any) {
  return (
    <Link href={href} className="flex flex-col gap-2 p-6 rounded-2xl glass-premium border border-white/10 hover:border-amber-500/50 transition-all">
       <div className={cn("p-3 rounded-xl w-fit", 
         color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
         color === 'purple' ? 'bg-purple-500/10 text-purple-500' : 'bg-stone-500/10 text-stone-500'
       )}>
         {icon}
       </div>
       <h3 className="font-bold text-lg text-stone-900 dark:text-white">{title}</h3>
       <p className="text-sm text-stone-500">{description}</p>
    </Link>
  );
}

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
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Immersive Background Blobs - Pro Max Detail */}
      <div className="absolute top-0 right-0 w-[50%] h-[40%] bg-gradient-radial from-amber-500/5 via-transparent to-transparent pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-radial from-purple-500/5 via-transparent to-transparent pointer-events-none blur-3xl opacity-50" />

      <div className="max-w-[1600px] mx-auto px-4 py-6 md:py-10 space-y-10 relative z-10">
        {/* Page Header - Modernized */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-amber-500 rounded-full shadow-[0_4px_12px_rgba(245,166,35,0.4)]" />
            <h1 className="text-3xl md:text-5xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter leading-none italic">
              {getRoleTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-2 pl-6">
             <span className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] opacity-80">Dashboard</span>
             <div className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-700" />
             <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.1em]">Xin chào,</span>
             <span className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md">{profile?.full_name ?? "Người dùng"}</span>
          </div>
        </div>

        {/* Top Stats Cards - Using Upgraded StatCard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <StatCard 
            label="Tổng Học sinh" 
            value={stats.totalStudents} 
            color="orange" 
            icon={<Icons.Students className="w-6 h-6" />} 
            subtitle="Học sinh đang theo học"
          />
          <StatCard 
            label="Giáo viên" 
            value={stats.totalTeachers} 
            color="purple" 
            icon={<Icons.Teachers className="w-6 h-6" />} 
            subtitle="Đội ngũ giảng dạy"
          />
          <StatCard 
            label="Lớp học" 
            value={stats.totalClasses} 
            color="green" 
            icon={<Icons.Classes className="w-6 h-6" />} 
            subtitle="Các lớp đang hoạt động"
          />
          <StatCard 
            label="Bài tập" 
            value={stats.totalAssignments} 
            color="blue" 
            icon={<Icons.Assignments className="w-6 h-6" />} 
            subtitle="Tổng số bài giao"
          />
          <StatCard 
            label="Điểm danh" 
            value={stats.attendanceToday} 
            color="slate" 
            icon={<Icons.Attendance className="w-6 h-6" />} 
            subtitle="Học sinh có mặt hôm nay"
          />
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

function QuickActionCard({ href, icon, title, description, color }: any) {
  return (
    <Link href={href} className="flex flex-col gap-4 p-8 rounded-[32px] bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl border border-stone-200 dark:border-white/10 hover:border-amber-500/50 hover:shadow-2xl transition-all duration-500 group">
       <div className={cn("p-4 rounded-2xl w-fit transition-all duration-500 group-hover:scale-110 shadow-sm", 
         color === 'orange' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
         color === 'purple' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-stone-500/10 text-stone-600 dark:text-stone-400'
       )}>
         <div className="scale-125">{icon}</div>
       </div>
       <div className="space-y-1">
         <h3 className="font-black text-xl text-stone-900 dark:text-white uppercase tracking-tight">{title}</h3>
         <p className="text-sm font-medium text-stone-500 line-clamp-2">{description}</p>
       </div>
    </Link>
  );
}

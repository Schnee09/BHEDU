'use client';

import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard, SkeletonCard } from '@/components/ui/skeleton';
import Link from 'next/link';
import { AnalyticsWidget } from '@/components/dashboard/AnalyticsWidget';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { Users, Building, Shield, Bell, UserPlus, ArrowUpRight } from 'lucide-react';

interface OwnerStats {
  studentsCount: number;
  studentGrowth: { name: string; count: number }[];
  classesCount: number;
  classUtilization: {
    classId: string;
    className: string;
    teacherName: string;
    subjectName: string;
    studentCount: number;
    maxCapacity: number;
    utilizationRate: number;
  }[];
  teachersCount: number;
  tutorsCount: number;
  announcements: {
    total: number;
    published: number;
    draft: number;
  };
}

export default function OwnerDashboard() {
  const { profile } = useProfile();
  const { data: stats, loading: statsLoading } = useFetch<OwnerStats>(
    profile ? '/api/owner/dashboard/stats' : null
  );

  // Calculate Average Class capacity utilization rate based on real data
  const averageUtilization = stats?.classUtilization?.length
    ? parseFloat(
        (
          stats.classUtilization.reduce((sum, c) => sum + c.utilizationRate, 0) /
          stats.classUtilization.length
        ).toFixed(1)
      )
    : 0;

  if (statsLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8 animate-pulse">
          <div className="space-y-4">
            <div className="h-10 w-80 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
            <div className="h-4 w-96 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="xl:col-span-4">
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStats = stats || {
    studentsCount: 0,
    studentGrowth: [],
    classesCount: 0,
    classUtilization: [],
    teachersCount: 0,
    tutorsCount: 0,
    announcements: { total: 0, published: 0, draft: 0 },
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60 dark:border-white/5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h1 className="text-lg sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex flex-wrap items-center gap-2">
                Dashboard <span className="text-amber-500">Chủ trung tâm</span>
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 pl-3">
              Chào mừng trở lại,{' '}
              <span className="text-stone-800 dark:text-stone-200 font-bold">
                {profile?.full_name ?? 'User'}
              </span>
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md px-4 py-2 rounded-xl border border-stone-200/50 dark:border-white/5 shadow-xs">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                Giám sát chiến lược
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
          <StatCard
            label="Học sinh hoạt động"
            value={String(currentStats.studentsCount)}
            icon={<Users className="w-4 h-4 text-blue-500" />}
            subtitle="Đang theo học"
            trend={{ value: 'Hoạt động', isPositive: true }}
            color="blue"
          />
          <StatCard
            label="Tổng số lớp học"
            value={String(currentStats.classesCount)}
            icon={<Building className="w-4 h-4 text-emerald-500" />}
            subtitle="Lớp đang mở"
            trend={{ value: 'Đang mở', isPositive: true }}
            color="emerald"
          />
          <StatCard
            label="Đội ngũ giáo viên"
            value={String(currentStats.teachersCount)}
            icon={<Users className="w-4 h-4 text-amber-500" />}
            subtitle="Đang giảng dạy"
            trend={{ value: 'Giảng dạy', isPositive: true }}
            color="amber"
          />
          <StatCard
            label="Đội ngũ gia sư"
            value={String(currentStats.tutorsCount)}
            icon={<Users className="w-4 h-4 text-orange-500" />}
            subtitle="Hỗ trợ kèm 1-1"
            trend={{ value: 'Hỗ trợ', isPositive: true }}
            color="orange"
          />
          <StatCard
            label="Tối ưu lớp học"
            value={`${averageUtilization}%`}
            icon={<Building className="w-4 h-4 text-stone-500" />}
            subtitle="Lấp đầy TB"
            trend={{
              value: averageUtilization >= 80 ? 'Cao' : 'Bình thường',
              isPositive: averageUtilization >= 80,
            }}
            color="slate"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 pb-12">
          {/* Left Column - Operational Charts */}
          <div className="xl:col-span-8 space-y-12">
            {/* Student Enrollment Growth */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight pl-3 border-l-4 border-blue-500">
                  Xu hướng Tuyển sinh
                </h2>
              </div>

              <AnalyticsWidget
                title="Quy mô học sinh luỹ kế"
                subtitle="Độ tăng trưởng số lượng học sinh trong 6 tháng"
                chartType="line"
                data={currentStats.studentGrowth}
                dataKey="count"
                height={280}
                loading={statsLoading}
                color="#3B82F6"
                emptyMessage="Chưa có dữ liệu tuyển sinh"
              />
            </section>

            {/* Class capacity utilization */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight pl-3 border-l-4 border-teal-500">
                  Công suất & Tối ưu hóa lớp học
                </h2>
              </div>

              <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl border border-stone-200/50 dark:border-white/5 overflow-hidden shadow-sm p-6 md:p-8">
                {currentStats.classUtilization?.length > 0 ? (
                  <div className="space-y-6">
                    {currentStats.classUtilization.map((cls) => (
                      <div key={cls.classId} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-black text-stone-900 dark:text-white uppercase tracking-tight">
                              {cls.className}
                            </span>
                            <span className="text-xs text-stone-400 dark:text-stone-500 pl-3">
                              GV: {cls.teacherName} | {cls.subjectName}
                            </span>
                          </div>
                          <span className="font-black text-stone-800 dark:text-white">
                            {cls.studentCount}/{cls.maxCapacity} ({cls.utilizationRate}%)
                          </span>
                        </div>

                        {/* Utilization bar */}
                        <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cls.utilizationRate >= 100
                                ? 'bg-red-500'
                                : cls.utilizationRate >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, cls.utilizationRate)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <Building className="w-10 h-10 text-stone-400 dark:text-stone-600" />
                    <p className="text-sm font-black text-stone-500 uppercase tracking-tight">
                      Chưa có dữ liệu lớp học
                    </p>
                    <p className="text-xs text-stone-400">
                      Các lớp học được tạo sẽ xuất hiện tại đây kèm theo hiệu suất lấp đầy.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Actions & Feeds */}
          <div className="xl:col-span-4 space-y-12">
            {/* Quick Actions Panel */}
            <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl border border-stone-200/50 dark:border-white/5 overflow-hidden shadow-sm p-6 md:p-8 space-y-6">
              <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
                Thao tác nhanh
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <Link
                  href="/dashboard/students"
                  className="flex items-center justify-between p-4 bg-white/60 dark:bg-stone-800/60 hover:bg-amber-500/10 rounded-2xl border border-stone-200/50 dark:border-white/5 transition-all group hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight">
                      Quản lý học sinh
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link
                  href="/dashboard/admin/permissions"
                  className="flex items-center justify-between p-4 bg-white/60 dark:bg-stone-800/60 hover:bg-blue-500/10 rounded-2xl border border-stone-200/50 dark:border-white/5 transition-all group hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight">
                      Quản lý phân quyền
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link
                  href="/dashboard/admin/announcements"
                  className="flex items-center justify-between p-4 bg-white/60 dark:bg-stone-800/60 hover:bg-teal-500/10 rounded-2xl border border-stone-200/50 dark:border-white/5 transition-all group hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight">
                      Đăng thông báo mới
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-teal-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link
                  href="/dashboard/admin/invitations"
                  className="flex items-center justify-between p-4 bg-white/60 dark:bg-stone-800/60 hover:bg-emerald-500/10 rounded-2xl border border-stone-200/50 dark:border-white/5 transition-all group hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight">
                      Mời nhân viên mới
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>
            </div>

            {/* Announcements oversight status */}
            <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl border border-stone-200/50 dark:border-white/5 overflow-hidden shadow-sm p-6 md:p-8 space-y-6">
              <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
                Trạng thái Bảng tin
              </h3>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-stone-50/50 dark:bg-white/5 rounded-2xl">
                  <span className="text-2xl font-black text-stone-800 dark:text-white block">
                    {currentStats.announcements.total}
                  </span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mt-1">
                    Tổng số
                  </span>
                </div>
                <div className="p-4 bg-emerald-500/5 rounded-2xl">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                    {currentStats.announcements.published}
                  </span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mt-1">
                    Đã đăng
                  </span>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-2xl">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block">
                    {currentStats.announcements.draft}
                  </span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mt-1">
                    Bản nháp
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard/admin/announcements"
                className="block text-center py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-amber-500/10"
              >
                Quản lý Bảng tin
              </Link>
            </div>

            {/* System logs feed */}
            <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl border border-stone-200/50 dark:border-white/5 overflow-hidden shadow-sm">
              <div className="px-8 py-5 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
                <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
                  Hoạt động hệ thống
                </h3>
              </div>
              <ActivityFeed limit={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

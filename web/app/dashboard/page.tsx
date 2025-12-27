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
        // Set default empty stats to prevent loading state
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
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-10 w-64 bg-stone-200 rounded animate-pulse" />
            <div className="h-6 w-96 bg-stone-200 rounded animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          {/* Quick actions skeleton */}
          <SkeletonCard />

          {/* Recent activity skeleton */}
          <SkeletonCard />
        </div>
      </main>
    );
  }

  const getRoleTitle = () => {
    switch (profile?.role) {
      case "admin":
        return "Bảng điều khiển Quản trị viên";
      case "teacher":
        return "Bảng điều khiển Giáo viên";
      case "student":
        return "Cổng thông tin Học sinh";
      default:
        return "Bảng điều khiển";
    }
  };

  const getRoleDescription = () => {
    switch (profile?.role) {
      case "admin":
        return "Tổng quan và quản lý hệ thống";
      case "teacher":
        return "Quản lý lớp học và học sinh";
      case "student":
        return "Theo dõi tiến độ và bài tập";
      default:
        return "Chào mừng đến bảng điều khiển";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getRoleTitle()}</h1>
              <p className="mt-2 text-gray-600">
                Chào mừng trở lại, <span className="font-semibold text-gray-900">{profile?.full_name ?? "Người dùng"}</span> • {getRoleDescription()}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <h2 className="sr-only">Thống kê tổng quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              label="Học sinh"
              value={stats.totalStudents}
              color="blue"
              icon={<Icons.Students className="w-6 h-6" />}
            />

            <StatCard
              label="Giáo viên"
              value={stats.totalTeachers}
              color="purple"
              icon={<Icons.Teachers className="w-6 h-6" />}
            />

            <StatCard
              label="Lớp học"
              value={stats.totalClasses}
              color="green"
              icon={<Icons.Classes className="w-6 h-6" />}
            />

            <StatCard
              label="Bài tập"
              value={stats.totalAssignments}
              color="orange"
              icon={<Icons.Assignments className="w-6 h-6" />}
            />

            <StatCard
              label="Điểm danh hôm nay"
              value={stats.attendanceToday}
              color="slate"
              icon={<Icons.Attendance className="w-6 h-6" />}
            />
          </div>
        </div>

        {/* Charts Section - Admin/Teacher only */}
        {(profile?.role === "admin" || profile?.role === "teacher") && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Thống kê chi tiết</h2>
              </div>
              <Link
                href="/dashboard/grades/analytics"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Distribution Pie Chart */}
              <AnalyticsWidget
                title="Phân bố điểm số"
                subtitle="Theo thang điểm"
                chartType="pie"
                data={[
                  { name: 'Giỏi (≥8)', value: 35 },
                  { name: 'Khá (6-8)', value: 40 },
                  { name: 'TB (5-6)', value: 18 },
                  { name: 'Yếu (<5)', value: 7 },
                ]}
                dataKey="value"
                height={280}
                color="gradient"
                icon={<Icons.Grades className="w-5 h-5" />}
              />

              {/* Attendance Trends Line Chart */}
              <AnalyticsWidget
                title="Xu hướng điểm danh"
                subtitle="7 ngày gần nhất"
                chartType="area"
                data={[
                  { name: 'T2', present: 92, absent: 8 },
                  { name: 'T3', present: 95, absent: 5 },
                  { name: 'T4', present: 88, absent: 12 },
                  { name: 'T5', present: 94, absent: 6 },
                  { name: 'T6', present: 91, absent: 9 },
                  { name: 'T7', present: 45, absent: 5 },
                  { name: 'CN', present: 0, absent: 0 },
                ]}
                dataKey="present"
                secondaryDataKey="absent"
                height={280}
                color="primary"
                secondaryColor="#ef4444"
                icon={<Icons.Attendance className="w-5 h-5" />}
                valueFormatter={(v) => `${v}%`}
              />

              {/* Class Performance Bar Chart */}
              <AnalyticsWidget
                title="Điểm trung bình theo lớp"
                subtitle="Học kỳ này"
                chartType="bar"
                data={[
                  { name: '10A', score: 7.8 },
                  { name: '10B', score: 7.2 },
                  { name: '11A', score: 8.1 },
                  { name: '11B', score: 7.5 },
                  { name: '12A', score: 8.3 },
                  { name: '12B', score: 7.9 },
                ]}
                dataKey="score"
                height={280}
                color="success"
                icon={<Icons.Classes className="w-5 h-5" />}
                valueFormatter={(v) => `${v.toFixed(1)}`}
              />

              {/* Subject Performance Radar */}
              <AnalyticsWidget
                title="Điểm theo môn học"
                subtitle="Trung bình toàn trường"
                chartType="radar"
                data={[
                  { subject: 'Toán', score: 7.5 },
                  { subject: 'Văn', score: 7.2 },
                  { subject: 'Anh', score: 7.8 },
                  { subject: 'Lý', score: 7.0 },
                  { subject: 'Hóa', score: 7.3 },
                  { subject: 'Sinh', score: 7.6 },
                ]}
                dataKey="score"
                xAxisKey="subject"
                height={280}
                color="info"
                icon={<Icons.Grades className="w-5 h-5" />}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Hành động nhanh</h2>
            </div>
            <p className="text-sm text-gray-500 hidden sm:block">Truy cập nhanh các chức năng chính</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profile?.role === "admin" && (
              <>
                <QuickActionCard
                  href={routes.students.list()}
                  icon={<Icons.Students className="w-6 h-6" />}
                  title="Quản lý Học sinh"
                  description="Xem và chỉnh sửa hồ sơ học sinh"
                  color="blue"
                />
                <QuickActionCard
                  href="/dashboard/users"
                  icon={<Icons.Teachers className="w-6 h-6" />}
                  title="Quản lý Giáo viên"
                  description="Xem và chỉnh sửa hồ sơ giáo viên"
                  color="purple"
                />
                <QuickActionCard
                  href={routes.classes.list()}
                  icon={<Icons.Classes className="w-6 h-6" />}
                  title="Quản lý Lớp học"
                  description="Xem và tổ chức lớp học"
                  color="green"
                />
                <QuickActionCard
                  href={routes.attendance.list()}
                  icon={<Icons.Attendance className="w-6 h-6" />}
                  title="Điểm danh"
                  description="Theo dõi điểm danh hàng ngày"
                  color="orange"
                />
              </>
            )}

            {profile?.role === "teacher" && (
              <>
                <QuickActionCard
                  href={routes.classes.list()}
                  icon={<Icons.Classes className="w-6 h-6" />}
                  title="Lớp học của tôi"
                  description="Xem lớp học của bạn"
                  color="blue"
                />
                <QuickActionCard
                  href="/dashboard/grades/assignments"
                  icon={<Icons.Assignments className="w-6 h-6" />}
                  title="Bài tập"
                  description="Quản lý bài tập"
                  color="green"
                />
                <QuickActionCard
                  href="/dashboard/grades"
                  icon={<Icons.Grades className="w-6 h-6" />}
                  title="Điểm số"
                  description="Ghi và xem điểm"
                  color="purple"
                />
                <QuickActionCard
                  href={routes.attendance.mark()}
                  icon={<Icons.Attendance className="w-6 h-6" />}
                  title="Đánh dấu Điểm danh"
                  description="Điểm danh lớp học"
                  color="orange"
                />
              </>
            )}

            {profile?.role === "student" && (
              <>
                <QuickActionCard
                  href={routes.classes.list()}
                  icon={<Icons.Classes className="w-6 h-6" />}
                  title="Lớp học của tôi"
                  description="Xem lớp học đã đăng ký"
                  color="blue"
                />
                <QuickActionCard
                  href="/dashboard/assignments"
                  icon={<Icons.Assignments className="w-6 h-6" />}
                  title="Bài tập"
                  description="Xem và nộp bài"
                  color="green"
                />
                <QuickActionCard
                  href="/dashboard/scores"
                  icon={<Icons.Grades className="w-6 h-6" />}
                  title="Điểm của tôi"
                  description="Xem điểm của bạn"
                  color="purple"
                />
                <QuickActionCard
                  href="/dashboard/profile"
                  icon={<Icons.Users className="w-6 h-6" />}
                  title="Hồ sơ"
                  description="Xem và chỉnh sửa hồ sơ"
                  color="slate"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Action Card Component
 */
interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'slate';
}

function QuickActionCard({ href, icon, title, description, color }: QuickActionCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      icon: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200 hover:border-blue-300',
      title: 'text-blue-900 group-hover:text-blue-800',
      desc: 'text-blue-700 group-hover:text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50 hover:bg-purple-100',
      icon: 'bg-purple-100 text-purple-600',
      border: 'border-purple-200 hover:border-purple-300',
      title: 'text-purple-900 group-hover:text-purple-800',
      desc: 'text-purple-700 group-hover:text-purple-600',
    },
    green: {
      bg: 'bg-green-50 hover:bg-green-100',
      icon: 'bg-green-100 text-green-600',
      border: 'border-green-200 hover:border-green-300',
      title: 'text-green-900 group-hover:text-green-800',
      desc: 'text-green-700 group-hover:text-green-600',
    },
    orange: {
      bg: 'bg-orange-50 hover:bg-orange-100',
      icon: 'bg-orange-100 text-orange-600',
      border: 'border-orange-200 hover:border-orange-300',
      title: 'text-orange-900 group-hover:text-orange-800',
      desc: 'text-orange-700 group-hover:text-orange-600',
    },
    slate: {
      bg: 'bg-gray-50 hover:bg-gray-100',
      icon: 'bg-gray-100 text-gray-600',
      border: 'border-gray-200 hover:border-gray-300',
      title: 'text-gray-900 group-hover:text-gray-800',
      desc: 'text-gray-700 group-hover:text-gray-600',
    },
  };

  const styles = colorClasses[color];

  return (
    <Link
      href={href}
      className={`group block p-6 rounded-xl transition-all duration-300 ease-in-out
        bg-white border shadow-sm hover:shadow-lg hover:-translate-y-1
        ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl transition-all duration-300 ${styles.icon} group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-lg mb-2 transition-colors duration-200 ${styles.title}`}>
            {title}
          </h3>
          <p className={`text-sm leading-relaxed transition-colors duration-200 ${styles.desc}`}>
            {description}
          </p>
          <div className="mt-3 flex items-center text-sm font-medium opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <span className={`${styles.title} mr-2`}>Xem chi tiết</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

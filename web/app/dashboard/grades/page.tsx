/**
 * Grades Navigation Page - Enhanced with Real Statistics
 * 
 * Features:
 * - Real statistics from API
 * - Recent activity feed
 * - Upcoming deadlines
 * - Role-based navigation cards
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/hooks";
import { apiFetch } from "@/lib/api/client";
import { LoadingState } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import {
  PencilSquareIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

interface NavCard {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  color: string;
}

interface GradeStats {
  totalStudents: number;
  totalGrades: number;
  averageScore: number;
  recentEntries: number;
  classCount: number;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  className?: string;
}

const navCards: NavCard[] = [
  {
    href: "/dashboard/grades/entry",
    title: "Nhập điểm",
    description: "Nhập điểm sử dụng thang điểm Việt Nam",
    icon: PencilSquareIcon,
    roles: ["teacher", "admin", "staff"],
    color: "indigo",
  },
  {
    href: "/dashboard/grades/analytics",
    title: "Phân tích điểm",
    description: "Xem hiệu suất lớp học và phân bố điểm",
    icon: DocumentChartBarIcon,
    roles: ["teacher", "admin", "staff"],
    color: "emerald",
  },
  {
    href: "/dashboard/grades/reports",
    title: "Báo cáo điểm",
    description: "Tạo và xuất báo cáo điểm chi tiết",
    icon: DocumentTextIcon,
    roles: ["teacher", "admin", "staff"],
    color: "amber",
  },
  {
    href: "/dashboard/scores",
    title: "Điểm của tôi",
    description: "Xem điểm và kết quả bài tập của bạn",
    icon: AcademicCapIcon,
    roles: ["student"],
    color: "blue",
  },
];

const colorClasses: Record<string, { bg: string; hover: string; text: string; icon: string }> = {
  indigo: { bg: "bg-indigo-50", hover: "group-hover:bg-indigo-100", text: "text-indigo-600", icon: "text-indigo-600" },
  emerald: { bg: "bg-emerald-50", hover: "group-hover:bg-emerald-100", text: "text-emerald-600", icon: "text-emerald-600" },
  amber: { bg: "bg-amber-50", hover: "group-hover:bg-amber-100", text: "text-amber-600", icon: "text-amber-600" },
  blue: { bg: "bg-blue-50", hover: "group-hover:bg-blue-100", text: "text-blue-600", icon: "text-blue-600" },
};

export default function GradesPageModern() {
  const { user, loading: userLoading } = useUser();
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user && (user.role === "teacher" || user.role === "admin" || user.role === "staff")) {
      fetchStats();
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch grade statistics
      const [gradesRes, classesRes] = await Promise.all([
        apiFetch("/api/grades?limit=100"),
        apiFetch("/api/classes"),
      ]);

      const gradesData = await gradesRes.json();
      const classesData = await classesRes.json();

      // Calculate stats from grades data
      const grades = gradesData.grades || gradesData.data || [];
      const classes = classesData.classes || classesData.data || [];

      // Get unique students with grades
      const studentIds = new Set(grades.map((g: any) => g.student_id));

      // Calculate average score
      const scores = grades.map((g: any) => g.score).filter((s: number) => s != null);
      const avgScore = scores.length > 0
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
        : 0;

      // Recent entries (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentGrades = grades.filter((g: any) =>
        new Date(g.created_at || g.graded_at) > oneWeekAgo
      );

      setStats({
        totalStudents: studentIds.size,
        totalGrades: grades.length,
        averageScore: Math.round(avgScore * 10) / 10,
        recentEntries: recentGrades.length,
        classCount: classes.length,
      });

      // Generate recent activity from grades
      const activities: RecentActivity[] = grades
        .slice(0, 5)
        .map((g: any) => ({
          id: g.id,
          action: "Nhập điểm",
          description: `${g.student?.full_name || 'Học sinh'} - ${g.score} điểm`,
          timestamp: g.created_at || g.graded_at,
          className: g.class?.name,
        }));

      setRecentActivity(activities);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({
        totalStudents: 0,
        totalGrades: 0,
        averageScore: 0,
        recentEntries: 0,
        classCount: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  if (userLoading) {
    return <LoadingState message="Đang tải..." />;
  }

  const userRole = user?.role || "";
  const availableCards = navCards.filter(card =>
    card.roles.includes(userRole)
  );
  const isTeacherOrAdmin = userRole === "teacher" || userRole === "admin" || userRole === "staff";

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Điểm & Bài tập</h1>
              <p className="mt-2 text-gray-600">
                {userRole === "student"
                  ? "Xem điểm và tiến độ học tập của bạn"
                  : "Quản lý điểm, bài tập và báo cáo"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards for Teachers/Admins */}
        {isTeacherOrAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? "-" : stats?.totalStudents || 0}
                  </p>
                  <p className="text-sm text-gray-500">Học sinh</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? "-" : stats?.totalGrades || 0}
                  </p>
                  <p className="text-sm text-gray-500">Điểm đã nhập</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? "-" : stats?.averageScore || 0}
                  </p>
                  <p className="text-sm text-gray-500">Điểm TB</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? "-" : stats?.recentEntries || 0}
                  </p>
                  <p className="text-sm text-gray-500">Tuần này</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        {availableCards.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chức năng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCards.map((card) => {
                const colors = colorClasses[card.color];
                return (
                  <Link key={card.href} href={card.href}>
                    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group cursor-pointer h-full">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 ${colors.bg} rounded-lg ${colors.hover} transition-colors duration-200`}>
                            <card.icon className={`w-6 h-6 ${colors.icon}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-xl font-semibold text-gray-900 mb-2 group-hover:${colors.text} transition-colors duration-200`}>
                              {card.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {card.description}
                            </p>
                            <div className={`mt-4 flex items-center text-sm font-medium ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                              <span>Mở chức năng</span>
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quyền truy cập bị hạn chế
            </h3>
            <p className="text-gray-600">
              Bạn không có quyền truy cập các tính năng điểm.
            </p>
          </div>
        )}

        {/* Additional Info Cards for Teachers/Admins */}
        {isTeacherOrAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                Hoạt động gần đây
              </h3>
              {loadingStats ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-1.5 bg-green-100 rounded-full">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.className && `${activity.className} • `}
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Icons.Grades className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p>Chưa có hoạt động gần đây</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icons.Grades className="w-5 h-5 text-gray-500" />
                Thao tác nhanh
              </h3>
              <div className="space-y-3">
                <Link href="/dashboard/grades/entry">
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer">
                    <PencilSquareIcon className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-indigo-700">Nhập điểm mới</span>
                  </div>
                </Link>
                <Link href="/dashboard/grades/reports">
                  <div className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer">
                    <DocumentTextIcon className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-700">Xuất báo cáo</span>
                  </div>
                </Link>
                <Link href="/dashboard/grades/analytics">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer">
                    <DocumentChartBarIcon className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">Xem phân tích</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Grades Navigation Page - Enhanced with Real Statistics
 *
 * Features:
 * - Real statistics from API
 * - Recent activity feed
 * - Upcoming deadlines
 * - Role-based navigation cards
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch, getGrades, getClasses } from '@/lib/api/client';
import { LoadingState } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import {
  PencilSquareIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface NavCard {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  permission?: string;
  isStudentOnly?: boolean;
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
    href: '/dashboard/grades/entry',
    title: 'Nhập điểm môn học',
    description: 'Nhập điểm giữa kỳ (50%) và cuối kỳ (50%)',
    icon: PencilSquareIcon,
    permission: 'grades.entry',
    color: 'amber',
  },
  {
    href: '/dashboard/grades/transcripts',
    title: 'Phiếu kết quả học tập',
    description: 'Tra cứu bảng điểm tổng hợp của học sinh',
    icon: AcademicCapIcon,
    permission: 'grades.view',
    color: 'amber',
  },
  {
    href: '/dashboard/grades/analytics',
    title: 'Phân tích học lực',
    description: 'Biểu đồ phân bố điểm số và GPA toàn trung tâm',
    icon: DocumentChartBarIcon,
    permission: 'grades.analytics',
    color: 'emerald',
  },
  {
    href: '/dashboard/grades/reports',
    title: 'Báo cáo & Xuất file',
    description: 'Tạo và xuất báo cáo điểm số chi tiết',
    icon: DocumentTextIcon,
    permission: 'reports.view',
    color: 'emerald',
  },
];

const colorClasses: Record<string, { bg: string; hover: string; text: string; icon: string }> = {
  amber: {
    bg: 'bg-amber-500/10',
    hover: 'group-hover:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    hover: 'group-hover:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
};

export default function GradesPageModern() {
  const { profile, loading: profileLoading } = useProfile();
  const { can, isTeacher, isAdmin, isStaff, isStudent } = usePermissions();
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const canSeeStats = isTeacher || isAdmin || isStaff;

  useEffect(() => {
    if (canSeeStats) {
      fetchStats();
    } else {
      setLoadingStats(false);
    }
  }, [canSeeStats]);

  const fetchStats = async () => {
    try {
      // Fetch grade statistics
      const [gradesRes, classesRes] = await Promise.all([getGrades({ limit: 100 }), getClasses()]);

      // Calculate stats from grades data
      const grades = gradesRes.data || [];
      const classes = classesRes.data || [];

      // Get unique students with grades
      const studentIds = new Set(grades.map((g: any) => g.student_id));

      // Calculate average score
      const scores = grades.map((g: any) => g.score).filter((s: number) => s != null);
      const avgScore =
        scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

      // Recent entries (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentGrades = grades.filter(
        (g: any) => new Date(g.created_at || g.graded_at || new Date().toISOString()) > oneWeekAgo
      );

      setStats({
        totalStudents: studentIds.size,
        totalGrades: grades.length,
        averageScore: Math.round(avgScore * 10) / 10,
        recentEntries: recentGrades.length,
        classCount: classes.length,
      });

      // Generate recent activity from grades
      const activities: RecentActivity[] = grades.slice(0, 5).map((g: any) => ({
        id: g.id,
        action: 'Nhập điểm',
        description: `${g.student?.full_name || 'Học sinh'} - ${g.score} điểm`,
        timestamp: g.created_at || g.graded_at || new Date().toISOString(),
        className: g.class?.name || classes.find((c: any) => c.id === g.class_id)?.name,
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  if (profileLoading) {
    return <LoadingState message="Đang tải..." />;
  }

  const availableCards = navCards
    .map((card) => {
      if (card.isStudentOnly && isStudent && profile?.id) {
        return { ...card, href: `/dashboard/students/${profile.id}/transcript` };
      }
      return card;
    })
    .filter((card) => {
      if (card.isStudentOnly) return isStudent;
      if (card.permission) return can(card.permission as any);
      return false;
    });

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
    <div className="min-h-screen bg-transparent">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
              Điểm <span className="text-amber-500">&amp; Bài tập</span>
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 pl-3">
            {isStudent ? 'Xem điểm và tiến độ học tập của bạn' : 'Quản lý điểm, bài tập và báo cáo'}
          </p>
        </div>

        {/* Quick Stats Cards for Teachers/Admins */}
        {canSeeStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <UsersIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 leading-none">
                    {loadingStats ? '-' : stats?.totalStudents || 0}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mt-1">
                    Học sinh
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-crystal rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    {loadingStats ? '-' : stats?.totalGrades || 0}
                  </p>
                  <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Điểm đã nhập
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-crystal rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    {loadingStats ? '-' : stats?.averageScore || 0}
                  </p>
                  <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Điểm TB
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-crystal rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <ClockIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    {loadingStats ? '-' : stats?.recentEntries || 0}
                  </p>
                  <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Tuần này
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        {availableCards.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] mb-4 pl-1">
              Chức năng
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {availableCards.map((card) => {
                const colors = colorClasses[card.color];
                return (
                  <Link key={card.href} href={card.href}>
                    <div className="glass-crystal rounded-2xl hover:shadow-lg transition-all duration-300 group cursor-pointer h-full border-none">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          {colors && (
                            <div
                              className={`p-3 ${colors.bg} rounded-xl ${colors.hover} transition-colors duration-200`}
                            >
                              <card.icon className={`w-6 h-6 ${colors.icon}`} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-lg font-black text-stone-900 dark:text-stone-100 mb-1.5 group-hover:${colors?.text ?? ''} transition-colors duration-200 uppercase tracking-tight`}
                            >
                              {card.title}
                            </h3>
                            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                              {card.description}
                            </p>
                            <div
                              className={`mt-4 flex items-center text-xs font-black ${colors?.text ?? ''} opacity-0 group-hover:opacity-100 transition-opacity duration-200 uppercase tracking-wider`}
                            >
                              <span>Mở chức năng</span>
                              <svg
                                className="w-4 h-4 ml-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M9 5l7 7-7 7"
                                />
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
          <div className="glass-crystal rounded-2xl p-12 text-center mb-8">
            <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight mb-2">
              Quyền truy cập bị hạn chế
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Bạn không có quyền truy cập các tính năng điểm.
            </p>
          </div>
        )}

        {/* Additional Info Cards for Teachers/Admins */}
        {canSeeStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="glass-crystal rounded-2xl p-6">
              <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Hoạt động gần đây
              </h3>
              {loadingStats ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-8 h-8 bg-stone-200 dark:bg-stone-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                        <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-stone-900/40 rounded-xl"
                    >
                      <div className="p-1.5 bg-emerald-500/10 rounded-full">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          {activity.className && `${activity.className} • `}
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icons.Grades className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-400 dark:text-stone-500 text-sm">
                    Chưa có hoạt động gần đây
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-crystal rounded-2xl p-6">
              <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Icons.Grades className="w-4 h-4" />
                Thao tác nhanh
              </h3>
              <div className="space-y-3">
                <Link href="/dashboard/grades/entry">
                  <div className="flex items-center gap-3 p-3 bg-blue-500/8 dark:bg-blue-500/10 hover:bg-blue-500/15 rounded-xl transition-colors cursor-pointer group">
                    <PencilSquareIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-blue-700 dark:text-blue-400 text-sm group-hover:text-blue-600">
                      Nhập điểm mới
                    </span>
                  </div>
                </Link>
                <Link href="/dashboard/grades/reports">
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/8 dark:bg-emerald-500/10 hover:bg-emerald-500/15 rounded-xl transition-colors cursor-pointer group">
                    <DocumentTextIcon className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm group-hover:text-emerald-600">
                      Xuất báo cáo
                    </span>
                  </div>
                </Link>
                <Link href="/dashboard/grades/analytics">
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/8 dark:bg-emerald-500/10 hover:bg-emerald-500/15 rounded-xl transition-colors cursor-pointer group">
                    <DocumentChartBarIcon className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm group-hover:text-emerald-600">
                      Xem phân tích
                    </span>
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

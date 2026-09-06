'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import { Icons } from '@/components/ui/Icons';
import ChildSwitcher from '@/components/dashboard/widgets/ChildSwitcher';
import ChildAttendanceTodayWidget from '@/components/dashboard/widgets/ChildAttendanceTodayWidget';
import TodayScheduleWidget from '@/components/dashboard/widgets/TodayScheduleWidget';
import RecentGradesWidget from '@/components/dashboard/widgets/RecentGradesWidget';
import AnnouncementsFeedWidget from '@/components/dashboard/widgets/AnnouncementsFeedWidget';
import StudentRequestWidget from '@/components/dashboard/widgets/StudentRequestWidget';
import Link from 'next/link';
import { UserPlus, Settings } from 'lucide-react';

interface LinkRecord {
  id: string;
  student_id: string;
  parent_id: string;
  status: string;
  student?: {
    full_name: string;
    student_code: string;
  };
}

interface ParentChildSummary {
  gpa: number;
  rank: number;
  totalRanked: number;
  attendanceRate: number;
  totalClasses: number;
  upcomingAssignments: number;
  trend: 'up' | 'down' | 'stable';
}

export default function ParentDashboard() {
  const { profile } = useProfile();

  // Fetch linked students (approved links only)
  const { data: linksData, loading: linksLoading } = useFetch<any>('/api/parent/links');

  const rawLinks = linksData?.data || linksData?.items || [];
  const links: LinkRecord[] = rawLinks
    .filter((link: any) => link.status === 'approved' || link.status === 'active' || !link.status)
    .map((link: any) => ({
      id: link.id,
      student_id: link.student?.id || link.student_id,
      parent_id: link.parent_id,
      status: link.status || 'approved',
      student: link.student || {
        full_name: link.student_name || 'Học sinh',
        student_code: link.student_code || 'N/A',
      },
    }));

  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    if (links.length > 0 && links[0] && !selectedChildId) {
      setSelectedChildId(links[0].student_id);
    }
  }, [links, selectedChildId]);

  // Fetch summary for selected child
  const { data: summary, loading: summaryLoading } = useFetch<ParentChildSummary>(
    selectedChildId ? `/api/parent/child/${selectedChildId}/summary` : null
  );

  const activeChild = links.find((l) => l.student_id === selectedChildId)?.student;

  const displayStats = summary || {
    gpa: 0,
    rank: 0,
    totalRanked: 0,
    attendanceRate: 100,
    totalClasses: 0,
    upcomingAssignments: 0,
    trend: 'stable',
  };

  const getTrendSubtitle = (trend: string) => {
    if (trend === 'up') return 'Kết quả học tập đang đi lên';
    if (trend === 'down') return 'Cần trao đổi thêm với giáo viên';
    return 'Duy trì kết quả ổn định';
  };

  if (linksLoading) {
    return (
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-10 w-64 bg-stone-200 dark:bg-stone-850 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        </div>
      </main>
    );
  }

  if (links.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-transparent">
        <div className="max-w-md w-full bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl border border-stone-200/50 dark:border-white/5 rounded-[32px] p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="font-serif font-black text-2xl text-stone-900 dark:text-white uppercase tracking-tight mb-3">
            Chưa liên kết học sinh
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-medium mb-8 leading-relaxed">
            Tài khoản phụ huynh của bạn hiện chưa được kết nối với học sinh nào. Vui lòng kết nối để
            bắt đầu theo dõi học tập của con.
          </p>
          <Link
            href="/dashboard/parent"
            className="inline-flex w-full py-4 bg-amber-500 hover:bg-amber-600 text-stone-900 text-sm font-black rounded-2xl items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-lg shadow-amber-500/10 active:scale-95"
          >
            Kết nối tài khoản con
          </Link>
        </div>
      </div>
    );
  }

  // Map to simple children list for the switcher
  const childrenList = links.map((l) => ({
    id: l.student_id,
    full_name: l.student?.full_name || '',
    student_code: l.student?.student_code || '',
  }));

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/50 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Dashboard <span className="text-amber-500">Phụ huynh</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                Chào phụ huynh{' '}
                <span className="text-stone-900 dark:text-stone-100 font-black">
                  {profile?.full_name ?? 'Phụ huynh'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/parent"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md border border-stone-200/50 dark:border-white/5 hover:border-amber-500/30 text-xs font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white rounded-xl transition-all shadow-xs"
            >
              <Settings className="w-3.5 h-3.5" /> Quản lý kết nối
            </Link>
          </div>
        </div>

        {/* Child Switcher (Only visible if > 1 child) */}
        <ChildSwitcher
          childrenList={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
        />

        {/* Stats Row for Selected Child */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-500">
            <StatCard
              label="Điểm trung bình"
              value={displayStats.gpa > 0 ? displayStats.gpa.toFixed(1) : '—'}
              color="emerald"
              icon={<Icons.Grades className="w-4 h-4 text-emerald-500" />}
              subtitle={getTrendSubtitle(displayStats.trend)}
            />
            <StatCard
              label="Xếp hạng của con"
              value={displayStats.rank > 0 ? `#${displayStats.rank}` : '—'}
              color="blue"
              icon={<Icons.Students className="w-4 h-4 text-blue-500" />}
              subtitle={
                displayStats.totalRanked > 0
                  ? `/${displayStats.totalRanked} học sinh khối`
                  : 'Đang cập nhật'
              }
            />
            <StatCard
              label="Lớp tham gia"
              value={displayStats.totalClasses}
              color="blue"
              icon={<Icons.Classes className="w-4 h-4 text-blue-500" />}
              subtitle="Lớp học của con"
            />
            <StatCard
              label="Bài tập chưa nộp"
              value={displayStats.upcomingAssignments}
              color={displayStats.upcomingAssignments > 0 ? 'orange' : 'green'}
              icon={<Icons.Assignments className="w-4 h-4" />}
              subtitle={
                displayStats.upcomingAssignments > 0 ? 'Cần nhắc nhở con' : 'Đã hoàn thành tốt'
              }
            />
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 pb-12">
          {/* Left Column */}
          <div className="xl:col-span-8 space-y-4 sm:space-y-6">
            {/* Child's Schedule Today */}
            {selectedChildId && <TodayScheduleWidget role="parent" studentId={selectedChildId} />}

            {/* Recent Grades */}
            {selectedChildId && (
              <RecentGradesWidget
                dataUrl={`/api/parent/child/${selectedChildId}/grades-recent`}
                title={`Điểm số gần đây của ${activeChild?.full_name ?? 'con'}`}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-4 sm:space-y-6">
            {/* Daily Attendance Card */}
            {selectedChildId && <ChildAttendanceTodayWidget childId={selectedChildId} />}

            {/* Parent Online Request Service */}
            {selectedChildId && <StudentRequestWidget role="parent" studentId={selectedChildId} />}

            {/* School Announcements */}
            <AnnouncementsFeedWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

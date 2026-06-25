'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import ChildSwitcher from '@/components/dashboard/widgets/ChildSwitcher';
import { AcademicMatrix } from '@/components/Academic/AcademicMatrix';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import { Loader2, TrendingUp, Award, Clock } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { Icons } from '@/components/ui/Icons';

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

export default function ParentGradesPage() {
  const { profile } = useProfile();

  // Fetch approved linked children
  const { data: linksData, loading: linksLoading } = useFetch<any>('/api/parent/links');

  const links: LinkRecord[] = (linksData?.items || []).filter(
    (link: any) => link.status === 'approved'
  );

  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    if (links.length > 0 && links[0] && !selectedChildId) {
      setSelectedChildId(links[0].student_id);
    }
  }, [links, selectedChildId]);

  // Fetch summary stats for child
  const { data: summary, loading: summaryLoading } = useFetch<ParentChildSummary>(
    selectedChildId ? `/api/parent/child/${selectedChildId}/summary` : null
  );

  // Fetch grades for child
  const { data: gradesData, loading: gradesLoading } = useFetch<any>(
    selectedChildId ? `/api/grades?student_id=${selectedChildId}` : null
  );

  const activeChild = links.find((l) => l.student_id === selectedChildId)?.student;
  const grades = gradesData?.data || [];

  if (linksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
        <EmptyState
          title="Chưa có học sinh liên kết"
          description="Tài khoản phụ huynh của bạn hiện chưa được kết nối với học sinh nào. Vui lòng kết nối để bắt đầu theo dõi học tập của con."
          action={{
            label: 'Kết nối học sinh ngay',
            href: '/dashboard/parent/link-student',
          }}
        />
      </div>
    );
  }

  const childrenList = links.map((l) => ({
    id: l.student_id,
    full_name: l.student?.full_name || '',
    student_code: l.student?.student_code || '',
  }));

  const getTrendSubtitle = (trend: string) => {
    if (trend === 'up') return 'Kết quả học tập đang đi lên';
    if (trend === 'down') return 'Cần trao đổi thêm với giáo viên';
    return 'Duy trì kết quả ổn định';
  };

  return (
    <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/50 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-500" />
            Bảng điểm của con
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Theo dõi kết quả học tập chi tiết và học bạ điện tử của các con
          </p>
        </div>
      </div>

      {/* Switcher */}
      <ChildSwitcher
        childrenList={childrenList}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {/* Summary Stats */}
      {selectedChildId && (
        <>
          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                label="Điểm trung bình"
                value={summary?.gpa && summary.gpa > 0 ? summary.gpa.toFixed(1) : '—'}
                color="emerald"
                icon={<Icons.Grades className="w-5 h-5 text-emerald-500" />}
                subtitle={getTrendSubtitle(summary?.trend || 'stable')}
              />
              <StatCard
                label="Xếp hạng học tập"
                value={summary?.rank && summary.rank > 0 ? `#${summary.rank}` : '—'}
                color="blue"
                icon={<Icons.Students className="w-5 h-5 text-blue-500" />}
                subtitle={
                  summary?.totalRanked && summary.totalRanked > 0
                    ? `/${summary.totalRanked} học sinh khối`
                    : 'Đang cập nhật'
                }
              />
              <StatCard
                label="Số lớp tham gia"
                value={summary?.totalClasses ?? 0}
                color="blue"
                icon={<Icons.Classes className="w-5 h-5 text-blue-500" />}
                subtitle="Số lượng lớp học con đang theo học"
              />
            </div>
          )}

          {/* Grades Transcript Matrix */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black uppercase tracking-widest text-stone-850 dark:text-white flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                Học bạ điện tử: {activeChild?.full_name}
              </h2>
              {gradesLoading && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
            </div>

            {gradesLoading && !summaryLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <AcademicMatrix grades={grades} />
            )}
          </div>
        </>
      )}
    </main>
  );
}

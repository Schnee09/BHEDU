'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import ChildSwitcher from '@/components/dashboard/widgets/ChildSwitcher';
import { StatCard } from '@/components/ui/Card';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import Badge from '@/components/ui/badge';
import Empty from '@/components/ui/empty';
import { Card } from '@/components/ui';
import { Loader2, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

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

export default function ParentAttendancePage() {
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

  // Fetch summary stats (contains attendanceRate)
  const { data: summary, loading: summaryLoading } = useFetch<ParentChildSummary>(
    selectedChildId ? `/api/parent/child/${selectedChildId}/summary` : null
  );

  // Fetch full attendance history
  const { data: attendanceData, loading: attendanceLoading } = useFetch<any>(
    selectedChildId ? `/api/attendance?student_id=${selectedChildId}&limit=100` : null
  );

  const activeChild = links.find((l) => l.student_id === selectedChildId)?.student;
  const attendance = attendanceData?.data || [];

  // Calculate detailed counts from attendance history
  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a: any) => a.status === 'present').length;
    const late = attendance.filter((a: any) => a.status === 'late').length;
    const absent = attendance.filter((a: any) => a.status === 'absent').length;
    const excused = attendance.filter((a: any) => a.status === 'excused').length;
    return { total, present, late, absent, excused };
  }, [attendance]);

  const calculatedRate = useMemo(() => {
    if (attendanceStats.total === 0) return 100;
    // (Present + Late + Excused) / Total
    const positiveDays = attendanceStats.present + attendanceStats.late + attendanceStats.excused;
    return Math.round((positiveDays / attendanceStats.total) * 100);
  }, [attendanceStats]);

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

  return (
    <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/50 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-amber-500" />
            Điểm danh của con
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Theo dõi chuyên cần, nghỉ học và đi muộn hàng ngày của các con
          </p>
        </div>
      </div>

      {/* Switcher */}
      <ChildSwitcher
        childrenList={childrenList}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChildId && (
        <>
          {/* Summary Stats */}
          {summaryLoading || attendanceLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Tỷ lệ chuyên cần"
                value={`${calculatedRate}%`}
                color={calculatedRate >= 90 ? 'emerald' : calculatedRate >= 75 ? 'orange' : 'slate'}
                icon={<CheckCircle className="w-5 h-5" />}
                subtitle={`Tính trên ${attendanceStats.total} buổi học`}
              />
              <StatCard
                label="Có mặt"
                value={attendanceStats.present}
                color="emerald"
                icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
                subtitle="Số buổi tham gia đầy đủ"
              />
              <StatCard
                label="Đi muộn"
                value={attendanceStats.late}
                color="orange"
                icon={<Clock className="w-5 h-5 text-amber-500" />}
                subtitle="Số buổi đi học muộn"
              />
              <StatCard
                label="Vắng mặt"
                value={attendanceStats.absent}
                color="slate"
                icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
                subtitle={`${attendanceStats.excused} buổi nghỉ có phép`}
              />
            </div>
          )}

          {/* Detailed Logs */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black uppercase tracking-widest text-stone-850 dark:text-white flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                Lịch sử chuyên cần: {activeChild?.full_name}
              </h2>
              {attendanceLoading && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
            </div>

            {attendanceLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : attendance.length === 0 ? (
              <Card className="overflow-hidden border-stone-200 dark:border-white/5 bg-white dark:bg-stone-900/50 shadow-xl p-12 text-center">
                <Empty
                  title="Không có dữ liệu điểm danh"
                  description="Chưa tìm thấy bản ghi chuyên cần nào cho học sinh này."
                />
              </Card>
            ) : (
              <Card
                padding="none"
                className="overflow-hidden border-stone-200 dark:border-white/5 bg-white dark:bg-stone-900/50 shadow-xl"
              >
                <div className="p-2">
                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3 p-2">
                    {attendance.map((a: any) => (
                      <div
                        key={a.id}
                        className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-serif italic font-black text-stone-900 dark:text-white capitalize text-sm">
                            {new Date(a.date).toLocaleDateString('vi-VN', {
                              weekday: 'long',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </div>
                          <Badge
                            variant={
                              a.status === 'present'
                                ? 'success'
                                : a.status === 'absent'
                                  ? 'danger'
                                  : 'warning'
                            }
                            className="font-black text-[9px] uppercase tracking-widest px-3"
                          >
                            {a.status === 'present'
                              ? 'Có mặt'
                              : a.status === 'absent'
                                ? 'Vắng mặt'
                                : a.status === 'late'
                                  ? 'Đi muộn'
                                  : 'Có phép'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-stone-400">
                          <span>Lớp học</span>
                          <span className="text-stone-700 dark:text-stone-300">
                            {a.class?.name ?? a.class_id}
                          </span>
                        </div>
                        {(a.notes || a.remarks) && (
                          <div className="pt-2 border-t border-stone-50 dark:border-white/5">
                            <p className="text-[10px] text-stone-500 leading-relaxed italic">
                              &quot;{a.notes ?? a.remarks}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-stone-100 dark:border-white/5 shadow-inner m-4">
                    <table className="min-w-full text-sm font-sans">
                      <thead className="bg-stone-50/50 dark:bg-white/[0.02]">
                        <tr>
                          <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                            Thời gian
                          </th>
                          <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                            Lớp học
                          </th>
                          <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                            Trạng thái
                          </th>
                          <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                            Ghi chú
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                        {attendance.map((a: any) => (
                          <tr
                            key={a.id}
                            className="hover:bg-amber-500/[0.02] transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-serif italic font-black text-stone-900 dark:text-white capitalize">
                                  {new Date(a.date).toLocaleDateString('vi-VN', {
                                    weekday: 'long',
                                  })}
                                </span>
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                  {new Date(a.date).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-stone-600 dark:text-stone-300">
                              {a.class?.name ?? a.class_id}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant={
                                  a.status === 'present'
                                    ? 'success'
                                    : a.status === 'absent'
                                      ? 'danger'
                                      : 'warning'
                                }
                                className="font-black text-[9px] uppercase tracking-widest px-3"
                              >
                                {a.status === 'present'
                                  ? 'Có mặt'
                                  : a.status === 'absent'
                                    ? 'Vắng mặt'
                                    : a.status === 'late'
                                      ? 'Đi muộn'
                                      : 'Có phép'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-stone-500 italic text-xs group-hover:text-stone-900 dark:group-hover:text-stone-300 transition-colors">
                              {a.notes ?? a.remarks ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </main>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import { Plus, Clock, Check, X, FileText, RefreshCw } from 'lucide-react';
import { StatCard } from '@/components/ui/Card';
import { StudentRequest } from '@/lib/repositories/StudentRequestRepository';
import { RequestListTable } from '@/components/requests/RequestListTable';
import { CreateRequestModal } from '@/components/requests/CreateRequestModal';
import ChildSwitcher from '@/components/dashboard/widgets/ChildSwitcher';

interface ParentLink {
  id: string;
  student_id: string;
  status: string;
  student?: { full_name: string; student_code: string };
}

export default function RequestsPage() {
  const { profile } = useProfile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState('');

  const { data, loading, refetch } = useFetch<{
    data: StudentRequest[];
    total: number;
  }>('/api/requests?limit=100');

  const requests = data?.data || [];
  const { data: linksData, loading: linksLoading } = useFetch<{ data: ParentLink[] }>(
    profile?.role === 'parent' ? '/api/parent/links' : null
  );
  const approvedLinks = (linksData?.data || []).filter((link) => link.status === 'approved');
  const childrenList = approvedLinks.map((link) => ({
    id: link.student_id,
    full_name: link.student?.full_name || 'Học sinh',
    student_code: link.student?.student_code || 'N/A',
  }));

  useEffect(() => {
    if (profile?.role === 'parent' && childrenList.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenList[0]?.id || '');
    }
  }, [childrenList, profile?.role, selectedChildId]);

  const isStaff =
    profile?.role === 'admin' ||
    profile?.role === 'teacher' ||
    profile?.role === 'staff' ||
    profile?.role === 'super_admin';
  const canCreateRequest = profile?.role === 'student' || profile?.role === 'parent';
  const requestStudent =
    profile?.role === 'parent'
      ? childrenList.find((child) => child.id === selectedChildId)
      : profile?.id
        ? {
            id: profile.id,
            full_name: profile.full_name || 'Học sinh',
            student_code: '',
          }
        : null;

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden pb-32 sm:pb-16">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/50 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                <span className="text-amber-500">Yêu cầu học tập</span>
              </h1>
            </div>
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400 pl-4">
              Gửi và theo dõi yêu cầu nghỉ học, học bù hoặc đổi ca
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canCreateRequest && requestStudent && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Gửi đơn mới</span>
              </button>
            )}

            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {profile?.role === 'parent' && !linksLoading && childrenList.length > 1 && (
          <ChildSwitcher
            childrenList={childrenList}
            selectedChildId={selectedChildId}
            onSelectChild={setSelectedChildId}
          />
        )}

        {profile?.role === 'parent' && !linksLoading && childrenList.length === 0 && (
          <div
            role="status"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
          >
            Bạn cần có ít nhất một liên kết học sinh đã được duyệt trước khi gửi đơn.
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Chờ xét duyệt"
            value={pendingCount}
            color="orange"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
            subtitle="Đơn đang chờ xử lý"
          />
          <StatCard
            label="Đã phê duyệt"
            value={approvedCount}
            color="emerald"
            icon={<Check className="w-4 h-4 text-emerald-500" />}
            subtitle="Đơn đã được chấp thuận"
          />
          <StatCard
            label="Đã từ chối"
            value={rejectedCount}
            color="orange"
            icon={<X className="w-4 h-4 text-rose-500" />}
            subtitle="Đơn không hợp lệ"
          />
          <StatCard
            label="Tổng số đơn"
            value={requests.length}
            color="blue"
            icon={<FileText className="w-4 h-4 text-blue-500" />}
            subtitle="Toàn bộ lịch sử yêu cầu"
          />
        </div>

        {/* Request List Table */}
        <RequestListTable
          requests={requests}
          loading={loading}
          isStaff={isStaff}
          onRefresh={() => refetch()}
        />

        {/* Create Modal */}
        {requestStudent && (
          <CreateRequestModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={() => refetch()}
            studentId={requestStudent.id}
            studentName={requestStudent.full_name}
          />
        )}
      </div>
    </div>
  );
}

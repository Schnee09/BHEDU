'use client';

import React, { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFetch } from '@/hooks/useFetch';
import { Plus, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  StudentRequest,
  RequestType,
  RequestStatus,
} from '@/lib/repositories/StudentRequestRepository';
import { RequestTypeBadge, RequestStatusBadge } from '@/components/requests/RequestStatusBadge';
import { CreateRequestModal } from '@/components/requests/CreateRequestModal';

interface StudentRequestWidgetProps {
  role?: 'student' | 'parent' | 'teacher' | 'admin';
  studentId?: string;
}

export default function StudentRequestWidget({
  role = 'student',
  studentId,
}: StudentRequestWidgetProps) {
  const { profile } = useProfile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const targetStudentId = studentId || profile?.id;

  const { data, loading, refetch } = useFetch<{
    data: StudentRequest[];
    total: number;
  }>('/api/requests?limit=4');

  const requests = data?.data || [];
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const isStaff =
    profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'staff';

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
            📝
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              Dịch vụ đơn từ
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-black">
                  {pendingCount} chờ duyệt
                </span>
              )}
            </h2>
            <p className="text-[11px] text-stone-400">Nghỉ phép, học bù & thủ tục trực tuyến</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isStaff && targetStudentId && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-[11px] font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gửi đơn</span>
            </button>
          )}

          <Link
            href="/dashboard/requests"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Xem tất cả đơn"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-6 text-center text-xs font-bold text-stone-400 space-y-2">
          <Loader2 className="w-4 h-4 animate-spin mx-auto text-amber-500" />
          <span>Đang tải đơn từ...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-6 text-center rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-100 dark:border-white/5 space-y-1.5">
          <p className="text-xs font-bold text-stone-500">Chưa có đơn từ nào cần xử lý</p>
          {!isStaff && (
            <p className="text-[11px] text-stone-400">
              Bạn có thể gửi đơn xin nghỉ hoặc học bù bất kỳ lúc nào
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.slice(0, 3).map((req) => (
            <Link
              key={req.id}
              href="/dashboard/requests"
              className="block p-3 rounded-xl border border-stone-200/60 dark:border-white/5 bg-stone-50/50 dark:bg-stone-800/40 hover:border-amber-500/30 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <RequestTypeBadge type={req.request_type} size="sm" />
                <RequestStatusBadge status={req.status} size="sm" />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-stone-700 dark:text-stone-300 truncate max-w-[180px]">
                  {req.student?.full_name} {req.class ? `· ${req.class.name}` : ''}
                </span>
                {req.request_date && (
                  <span className="font-semibold text-stone-400 shrink-0">
                    {new Date(req.request_date).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                {req.reason}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {targetStudentId && (
        <CreateRequestModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => refetch()}
          studentId={targetStudentId}
          studentName={profile?.full_name || undefined}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, Check, X, Loader2 } from 'lucide-react';
import {
  StudentRequest,
  RequestType,
  RequestStatus,
} from '@/lib/repositories/StudentRequestRepository';
import { RequestTypeBadge, RequestStatusBadge } from './RequestStatusBadge';
import { apiFetch } from '@/lib/api/client';

interface RequestListTableProps {
  requests: StudentRequest[];
  loading?: boolean;
  isStaff?: boolean;
  onRefresh: () => void;
}

export function RequestListTable({
  requests,
  loading = false,
  isStaff = false,
  onRefresh,
}: RequestListTableProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Review dialog state
  const [reviewingRequest, setReviewingRequest] = useState<StudentRequest | null>(null);
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Filter requests
  const filtered = requests.filter((req) => {
    if (selectedType !== 'all' && req.request_type !== selectedType) return false;
    if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const studentName = req.student?.full_name?.toLowerCase() || '';
      const studentCode = req.student?.student_code?.toLowerCase() || '';
      const className = req.class?.name?.toLowerCase() || '';
      const reason = req.reason?.toLowerCase() || '';
      return (
        studentName.includes(q) ||
        studentCode.includes(q) ||
        className.includes(q) ||
        reason.includes(q)
      );
    }
    return true;
  });

  const handleReviewAction = async (status: 'approved' | 'rejected' | 'cancelled') => {
    if (!reviewingRequest) return;
    setActionLoading(true);
    setReviewError(null);

    try {
      const res = await apiFetch(`/api/requests/${reviewingRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewer_note: reviewerNote.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Cập nhật trạng thái thất bại');
      }

      setReviewingRequest(null);
      setReviewerNote('');
      onRefresh();
    } catch (err: any) {
      setReviewError(err.message || 'Lỗi khi duyệt đơn');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học sinh, mã HS, lớp, lý do..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="all">Tất cả loại đơn</option>
            <option value="leave_absence">📄 Nghỉ phép</option>
            <option value="makeup_class">🔄 Học bù</option>
            <option value="class_transfer">🔀 Chuyển lớp</option>
            <option value="deferral">⏸️ Bảo lưu</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">⏳ Đang chờ duyệt</option>
            <option value="approved">✅ Đã phê duyệt</option>
            <option value="rejected">❌ Đã từ chối</option>
            <option value="cancelled">⚪ Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Content List / Table */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
          <p className="text-xs font-bold text-stone-400">Đang tải danh sách đơn trực tuyến...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 space-y-3">
          <div className="p-3 w-fit mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 text-xl font-bold">
            📝
          </div>
          <p className="text-xs font-bold text-stone-500">Chưa có đơn từ trực tuyến nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-900 shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RequestTypeBadge type={req.request_type} size="sm" />
                  <RequestStatusBadge status={req.status} size="sm" />
                  <span className="text-[11px] font-bold text-stone-400">
                    Gửi lúc: {formatDate(req.created_at)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-400">Học sinh:</span>
                    <span className="font-black text-stone-900 dark:text-white">
                      {req.student?.full_name || 'Học sinh'}
                    </span>
                    {req.student?.student_code && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md bg-amber-500/10">
                        {req.student.student_code}
                      </span>
                    )}
                  </div>

                  {req.class && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-400">Lớp:</span>
                      <span className="font-black text-stone-700 dark:text-stone-300">
                        {req.class.name}
                      </span>
                    </div>
                  )}

                  {req.request_date && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-400">Ngày hiệu lực:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">
                        {formatDate(req.request_date)}
                        {req.end_date ? ` → ${formatDate(req.end_date)}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl border border-stone-200/60 dark:border-white/5">
                  <span className="font-bold text-stone-400 mr-1.5">Lý do:</span>
                  {req.reason}
                </p>

                {req.reviewer_note && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="font-bold mr-1">
                      Phản hồi từ {req.reviewer?.full_name || 'Giáo viên'}:
                    </span>
                    {req.reviewer_note}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {isStaff && req.status === 'pending' && (
                  <button
                    onClick={() => {
                      setReviewingRequest(req);
                      setReviewerNote('');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Xét duyệt</span>
                  </button>
                )}

                {!isStaff && req.status === 'pending' && (
                  <button
                    onClick={() => {
                      setReviewingRequest(req);
                      setReviewerNote('');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog Modal */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-white/10 bg-stone-50/50 dark:bg-stone-800/30">
              <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                {isStaff ? 'Xét duyệt đơn trực tuyến' : 'Xác nhận hủy đơn'}
              </h3>
              <button
                onClick={() => setReviewingRequest(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {reviewError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-xs font-bold text-rose-600">
                  {reviewError}
                </div>
              )}

              <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 text-xs">
                <div>
                  <span className="font-bold text-stone-400">Học sinh:</span>{' '}
                  <span className="font-black text-stone-900 dark:text-white">
                    {reviewingRequest.student?.full_name}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-stone-400">Loại đơn:</span>{' '}
                  <RequestTypeBadge type={reviewingRequest.request_type} size="sm" />
                </div>
                <div>
                  <span className="font-bold text-stone-400">Lý do:</span>{' '}
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {reviewingRequest.reason}
                  </span>
                </div>
              </div>

              {isStaff ? (
                <div>
                  <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Ghi chú / Phản hồi cho học sinh
                  </label>
                  <textarea
                    rows={2}
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    placeholder="Ví dụ: Đã duyệt đơn nghỉ phép / Đã đồng ý học bù ca tối..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 placeholder:text-stone-400"
                  />
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  Bạn có chắc chắn muốn hủy đơn này không? Hành động này không thể hoàn tác.
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200/80 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100"
                >
                  Đóng
                </button>

                {isStaff ? (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReviewAction('rejected')}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReviewAction('approved')}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all"
                    >
                      Phê duyệt
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleReviewAction('cancelled')}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider"
                  >
                    Xác nhận hủy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

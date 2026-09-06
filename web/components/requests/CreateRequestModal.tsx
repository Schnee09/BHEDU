'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { RequestType } from '@/lib/repositories/StudentRequestRepository';
import { apiFetch } from '@/lib/api/client';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
  studentName?: string;
}

export function CreateRequestModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  studentName,
}: CreateRequestModalProps) {
  const [requestType, setRequestType] = useState<RequestType>('leave_absence');
  const [classId, setClassId] = useState<string>('');
  const [requestDate, setRequestDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0] || '';
  });
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load student's enrolled classes
  useEffect(() => {
    if (!isOpen || !studentId) return;

    async function loadStudentClasses() {
      try {
        const res = await apiFetch(`/api/students/${studentId}`);
        if (res.ok) {
          const json = await res.json();
          const enrollments = json.data?.enrollments || [];
          const clsList = enrollments
            .filter((e: any) => e.classes)
            .map((e: any) => ({
              id: e.classes.id,
              name: e.classes.name,
            }));
          setClasses(clsList);
          if (clsList.length > 0 && !classId) {
            setClassId(clsList[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load student classes:', err);
      }
    }

    loadStudentClasses();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg('Vui lòng nhập lý do cụ thể (ít nhất 5 ký tự)');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          request_type: requestType,
          class_id: classId || null,
          request_date: requestDate || null,
          end_date: requestType === 'leave_absence' && endDate ? endDate : null,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Gửi đơn thất bại');
      }

      setReason('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi gửi đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const requestTypeOptions: Array<{
    type: RequestType;
    title: string;
    desc: string;
    icon: string;
  }> = [
    {
      type: 'leave_absence',
      title: 'Đơn xin nghỉ phép',
      desc: 'Báo vắng buổi học (ốm đau, bận việc, trùng lịch thi)',
      icon: '📄',
    },
    {
      type: 'makeup_class',
      title: 'Đơn xin học bù',
      desc: 'Xin tham gia học bù vào ca học/lớp khác',
      icon: '🔄',
    },
    {
      type: 'class_transfer',
      title: 'Đơn xin chuyển lớp',
      desc: 'Đề xuất đổi sang lớp học khác cùng khối',
      icon: '🔀',
    },
    {
      type: 'deferral',
      title: 'Đơn xin bảo lưu',
      desc: 'Tạm dừng học kỳ vì lý do cá nhân',
      icon: '⏸️',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-white/10 bg-stone-50/50 dark:bg-stone-800/30">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              📝
            </span>
            <div>
              <h2 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Gửi đơn trực tuyến
              </h2>
              <p className="text-xs text-stone-400">
                {studentName ? `Học sinh: ${studentName}` : 'Dịch vụ một cửa học viên'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Request Type Selector */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Loại đơn <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {requestTypeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setRequestType(opt.type)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    requestType === opt.type
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100 shadow-xs'
                      : 'border-stone-200/80 dark:border-white/10 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <span>{opt.icon}</span>
                    <span>{opt.title}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Lớp học liên quan
            </label>
            {classes.length > 0 ? (
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Tất cả các lớp học"
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-100 dark:bg-stone-800/50 text-stone-400 text-xs font-bold"
              />
            )}
          </div>

          {/* Date Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                {requestType === 'leave_absence'
                  ? 'Ngày xin nghỉ'
                  : requestType === 'makeup_class'
                    ? 'Ngày học bù'
                    : 'Ngày hiệu lực'}
              </label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {requestType === 'leave_absence' && (
              <div>
                <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Đến ngày (tuỳ chọn)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Lý do chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do xin nghỉ phép, đổi ca hoặc học bù..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 placeholder:text-stone-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi đơn...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi đơn duyệt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

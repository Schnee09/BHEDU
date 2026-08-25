'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, deleteStudent } from '@/lib/api/client';
import { showToast } from '@/components/ToastProvider';
import {
  PencilSquareIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  KeyIcon,
  ArchiveBoxIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface StudentActionsProps {
  studentId: string;
  studentName: string;
  isAdmin: boolean;
}

export default function StudentActions({ studentId, studentName, isAdmin }: StudentActionsProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleArchive = async () => {
    setDeleting(true);
    const loadingToast = showToast.loading('Đang lưu trữ hồ sơ...');

    try {
      await deleteStudent(studentId);

      showToast.dismiss(loadingToast);
      showToast.success('Hồ sơ đã được lưu trữ thành công!');
      setShowDeleteModal(false);
      setTimeout(() => {
        router.push('/dashboard/students');
      }, 1500);
    } catch (error) {
      showToast.dismiss(loadingToast);
      console.error('Failed to archive student:', error);
      showToast.error('Không thể lưu trữ hồ sơ. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const loading = showToast.loading('Đang đặt lại mật mã...');
      const res = await apiFetch(`/api/admin/users/${studentId}/reset-password`, {
        method: 'POST',
      });
      const json = await res.json();
      showToast.dismiss(loading);
      if (res.ok) {
        showToast.success(json.message || 'Email khôi phục đã được gửi');
      } else {
        showToast.error(json.error || 'Đặt lại mật mã thất bại');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Lỗi hệ thống khi đặt lại mật mã');
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2" ref={menuRef}>
      {/* Primary Edit Button (Always visible) */}
      <Link href={`/dashboard/students/${studentId}/edit`}>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 shadow-2xs"
        >
          <PencilSquareIcon className="w-4 h-4 text-amber-500" />
          <span>Chỉnh sửa</span>
        </Button>
      </Link>

      {/* Desktop Inline Actions (hidden on mobile, visible on sm+) */}
      <div className="hidden lg:flex items-center gap-2">
        <Link href={`/dashboard/grades/transcripts?student_id=${studentId}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 border-stone-200 dark:border-white/10"
          >
            <AcademicCapIcon className="w-4 h-4 text-emerald-500" />
            <span>Kết quả học tập</span>
          </Button>
        </Link>

        <Link href={`/dashboard/admin/finance/invoices?student_id=${studentId}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 border-stone-200 dark:border-white/10"
          >
            <BanknotesIcon className="w-4 h-4 text-blue-500" />
            <span>Học phí</span>
          </Button>
        </Link>

        <Link href={`/dashboard/admin/finance/payments?student_id=${studentId}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 border-stone-200 dark:border-white/10"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-stone-500" />
            <span>Thu phí</span>
          </Button>
        </Link>

        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetPassword}
            className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 border-stone-200 dark:border-white/10"
          >
            <KeyIcon className="w-4 h-4 text-amber-500" />
            <span>Mật mã</span>
          </Button>
        )}

        {isAdmin && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5"
          >
            <ArchiveBoxIcon className="w-4 h-4" />
            <span>Lưu trữ</span>
          </Button>
        )}
      </div>

      {/* Mobile More Actions Trigger Button (visible on mobile / tablet) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={cn(
            'h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer',
            showMoreMenu
              ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm'
              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
          )}
          title="Tùy chọn khác"
        >
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>

        {/* Dropdown Menu Popup */}
        {showMoreMenu && (
          <div className="absolute right-0 top-11 w-56 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-stone-100 dark:divide-white/5">
            <div className="p-1 space-y-0.5">
              <Link
                href={`/dashboard/grades/transcripts?student_id=${studentId}`}
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <AcademicCapIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Phiếu kết quả học tập</span>
              </Link>

              <Link
                href={`/dashboard/admin/finance/invoices?student_id=${studentId}`}
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <BanknotesIcon className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Hóa đơn học phí</span>
              </Link>

              <Link
                href={`/dashboard/admin/finance/payments?student_id=${studentId}`}
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-stone-500 shrink-0" />
                <span>Lịch sử đóng phí</span>
              </Link>
            </div>

            {isAdmin && (
              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleResetPassword();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <KeyIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Đặt lại mật mã</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left"
                >
                  <ArchiveBoxIcon className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Lưu trữ hồ sơ</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Archive / Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000] backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-white/10 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArchiveBoxIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  Lưu trữ học sinh?
                </h2>
                <p className="text-xs text-stone-500">
                  Học sinh:{' '}
                  <strong className="text-stone-900 dark:text-white">{studentName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Thao tác này sẽ chuyển trạng thái học sinh sang &quot;Lưu trữ&quot; (Ngưng học) và ẩn
              khỏi danh sách lớp hiện tại. Toàn bộ điểm số, điểm danh và dữ liệu tài chính vẫn được
              lưu giữ an toàn.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="h-11 rounded-xl text-xs font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleArchive}
                isLoading={deleting}
                className="h-11 rounded-xl text-xs font-bold shadow-md shadow-rose-500/20"
              >
                Xác nhận lưu trữ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

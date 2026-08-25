'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Trash,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { Button, Card, Badge, Modal, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  type: 'info' | 'event' | 'holiday' | 'urgent';
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AnnouncementsManagementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isStaff } = usePermissions();
  const toast = useToast();

  const canManage = isStaff;

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data || []);
      } else {
        toast.error('Lỗi', 'Không thể tải danh sách bảng tin');
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Lỗi', 'Đã xảy ra lỗi khi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;

    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/admin/announcements/${announcementToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Thành công', 'Đã xóa bản tin');
        setShowDeleteModal(false);
        fetchAnnouncements();
      } else {
        toast.error('Lỗi', 'Không thể xóa bản tin');
      }
    } catch (error) {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi xóa');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
            Thông tin
          </span>
        );
      case 'event':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
            Sự kiện
          </span>
        );
      case 'holiday':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
            Nghỉ lễ
          </span>
        );
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
            Khẩn cấp
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase tracking-wider">
            Thông tin
          </span>
        );
    }
  };

  if (!canManage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl text-center p-6 space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
          <h1 className="text-lg font-bold text-stone-900 dark:text-white">
            Không có quyền truy cập
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Bạn không có quyền quản lý bảng tin. Vui lòng liên hệ quản trị viên.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Bảng tin Trung tâm
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 pl-3.5">
              Quản lý các thông báo, sự kiện và tin tức hiển thị cho toàn trường
            </p>
          </div>

          <Link href="/dashboard/admin/announcements/create" className="self-start sm:self-auto">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              className="rounded-xl text-xs font-bold shadow-sm"
            >
              Thêm bản tin mới
            </Button>
          </Link>
        </div>

        {/* List Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 bg-white dark:bg-stone-900 rounded-2xl animate-pulse border border-stone-200/80 dark:border-white/5"
              />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState
            title="Chưa có bản tin nào"
            description="Bắt đầu bằng cách thêm bản tin đầu tiên cho trung tâm."
            icon={<Megaphone className="w-12 h-12" />}
            action={
              <Link href="/dashboard/admin/announcements/create">
                <Button variant="gold" size="sm">
                  Thêm bản tin
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {announcements.map((announcement) => {
              return (
                <div
                  key={announcement.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-3.5 sm:p-4.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs hover:border-amber-500/40 transition-all group"
                >
                  <div className="space-y-2">
                    {/* Badges Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {getTypeBadge(announcement.type)}
                      </div>
                      {announcement.is_published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> Đã đăng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> Bản nháp
                        </span>
                      )}
                    </div>

                    {/* Title with multi-line wrap */}
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                      {announcement.title}
                    </h3>

                    {/* Date subtitle */}
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium pt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {announcement.published_at
                          ? new Date(announcement.published_at).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : 'Chưa xuất bản'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
                    <Link
                      href={`/dashboard/admin/announcements/${announcement.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full h-8 rounded-xl text-xs font-bold justify-center"
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Chỉnh sửa
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => {
                        setAnnouncementToDelete(announcement);
                        setShowDeleteModal(true);
                      }}
                      title="Xóa bản tin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa bản tin"
        size="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Bạn có chắc chắn muốn xóa bản tin{' '}
            <strong>&quot;{announcementToDelete?.title}&quot;</strong>? Hành động này không thể hoàn
            tác.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={submitting}
              onClick={handleDelete}
              leftIcon={<Trash className="w-3.5 h-3.5" />}
            >
              Xóa ngay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'info':
        return { label: 'Thông tin', variant: 'info' as const };
      case 'event':
        return { label: 'Sự kiện', variant: 'warning' as const };
      case 'holiday':
        return { label: 'Nghỉ lễ', variant: 'success' as const };
      case 'urgent':
        return { label: 'Khẩn cấp', variant: 'danger' as const };
      default:
        return { label: 'Thông tin', variant: 'default' as const };
    }
  };

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card variant="glass" className="max-w-md text-center p-8">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-6 opacity-80" />
          <h1 className="text-2xl font-bold mb-2">Không có quyền truy cập</h1>
          <p className="text-muted mb-6">
            Bạn không có quyền quản lý bảng tin. Vui lòng liên hệ quản trị viên.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-gray-800/80 p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-premium backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="info">Hệ thống</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Bảng tin Trung tâm</h1>
            <p className="text-muted mt-2 max-w-lg">
              Quản lý các thông báo, sự kiện và tin tức hiển thị trên Cổng Thông Tin.
            </p>
          </div>
          <Link href="/dashboard/admin/announcements/create">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-5 h-5" />}
              className="rounded-2xl"
            >
              Thêm bản tin mới
            </Button>
          </Link>
        </div>

        {/* List Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-white/50 dark:bg-white/5 rounded-3xl animate-pulse border border-gray-100 dark:border-white/5"
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
                <Button>Thêm bản tin</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((announcement) => {
              const typeInfo = getTypeLabel(announcement.type);
              return (
                <Card
                  key={announcement.id}
                  variant="glass"
                  className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant={typeInfo.variant} className="mb-2">
                          {typeInfo.label}
                        </Badge>
                        <h3 className="text-xl font-bold line-clamp-1">{announcement.title}</h3>
                      </div>
                      <div>
                        {announcement.is_published ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Đã đăng
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Bản nháp
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-muted bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                      Đã đăng lúc:{' '}
                      {announcement.published_at
                        ? new Date(announcement.published_at).toLocaleString('vi-VN')
                        : 'Chưa đăng'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-6 pb-6 mt-auto">
                    <Link
                      href={`/dashboard/admin/announcements/${announcement.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full rounded-xl"
                        leftIcon={<Edit className="w-4 h-4" />}
                      >
                        Chỉnh sửa
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      className="px-3 rounded-xl"
                      onClick={() => {
                        setAnnouncementToDelete(announcement);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={submitting}
              onClick={handleDelete}
              leftIcon={<Trash className="w-4 h-4" />}
            >
              Xóa ngay
            </Button>
          </>
        }
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">Bạn có chắc chắn?</h3>
          <p className="text-muted">
            Hành động này không thể hoàn tác. Bản tin <strong>{announcementToDelete?.title}</strong>{' '}
            sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </p>
        </div>
      </Modal>
    </div>
  );
}

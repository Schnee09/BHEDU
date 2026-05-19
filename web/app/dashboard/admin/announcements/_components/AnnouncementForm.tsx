'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import { Button, Card, Input } from '@/components/ui';
import { ArrowLeft, Save, Megaphone } from 'lucide-react';
import Link from 'next/link';

interface AnnouncementFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string | null;
    type: 'info' | 'event' | 'holiday' | 'urgent';
    is_published: boolean;
  };
}

export function AnnouncementForm({ initialData }: AnnouncementFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    type: initialData?.type || 'info',
    is_published: initialData?.is_published ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = isEditing
        ? `/api/admin/announcements/${initialData.id}`
        : '/api/admin/announcements';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Thành công', isEditing ? 'Đã cập nhật bản tin' : 'Đã lưu bản tin mới');
        router.push('/dashboard/admin/announcements');
        router.refresh();
      } else {
        const data = await response.json();
        toast.error('Lỗi', data.error || 'Thao tác thất bại');
      }
    } catch (error) {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi lưu bản tin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/announcements">
            <Button variant="secondary" size="sm" className="rounded-xl p-2.5 h-10 w-10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Chỉnh sửa bản tin' : 'Thêm bản tin mới'}
            </h1>
            <p className="text-muted text-sm">
              Nội dung sẽ hiển thị công khai trên Cổng Thông Tin.
            </p>
          </div>
        </div>

        <Card
          variant="glass"
          className="p-8 border border-gray-100 dark:border-white/5 shadow-premium"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Tiêu đề"
              placeholder="Nhập tiêu đề bản tin..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              leftIcon={<Megaphone className="w-5 h-5" />}
            />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Nội dung
              </label>
              <textarea
                className="w-full min-h-[150px] p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y"
                placeholder="Nhập nội dung chi tiết..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Phân loại
                </label>
                <select
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="info">Thông tin chung</option>
                  <option value="event">Sự kiện</option>
                  <option value="holiday">Nghỉ lễ</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 mt-7">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="is_published"
                  className="text-sm font-semibold select-none cursor-pointer"
                >
                  Đăng tải ngay lập tức
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
              <Link href="/dashboard/admin/announcements">
                <Button variant="ghost" type="button">
                  Hủy bỏ
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                leftIcon={<Save className="w-5 h-5" />}
              >
                {isEditing ? 'Lưu thay đổi' : 'Tạo bản tin'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

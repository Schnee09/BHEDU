'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Calendar, CheckCircle2, AlertTriangle, Clock, Layers } from 'lucide-react';
import { AcademicYear } from '@/lib/settings/types';
import { cn } from '@/lib/utils';

interface AcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  year?: AcademicYear;
  onSave: (year: Partial<AcademicYear>) => Promise<void>;
}

export function AcademicYearModal({
  isOpen,
  onClose,
  year,
  onSave,
}: AcademicYearModalProps) {
  const [formData, setFormData] = useState<Partial<AcademicYear>>({
    name: '',
    start_date: '',
    end_date: '',
    is_active: true,
    is_current: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (year) {
      setFormData({
        name: year.name || '',
        start_date: year.start_date ? year.start_date.split('T')[0] : '',
        end_date: year.end_date ? year.end_date.split('T')[0] : '',
        is_active: year.is_active ?? true,
        is_current: year.is_current ?? false,
      });
    } else {
      const currentYear = new Date().getFullYear();
      setFormData({
        name: `${currentYear} - ${currentYear + 1}`,
        start_date: `${currentYear}-09-01`,
        end_date: `${currentYear + 1}-06-30`,
        is_active: true,
        is_current: false,
      });
    }
  }, [year, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('[AcademicYearModal] Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] rounded-[36px] border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                  {year ? 'Chỉnh sửa năm học' : 'Thêm năm học mới'}
                </DialogTitle>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Cấu hình khung thời gian và trạng thái kích hoạt của năm học.
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Tên năm học *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: 2025 - 2026"
                required
                className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Ngày bắt đầu *
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                  }
                  required
                  className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Ngày kết thúc *
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                  }
                  required
                  className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/5 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm text-stone-900 dark:text-white block">
                    Đặt làm năm học hiện tại
                  </span>
                  <span className="text-xs text-stone-500">
                    Tất cả lớp học và lịch học mới sẽ tự động gắn với năm học này.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_current: e.target.checked,
                      is_active: e.target.checked ? true : prev.is_active,
                    }))
                  }
                  className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500/20"
                />
              </label>

              <div className="h-px bg-stone-200/60 dark:bg-white/5" />

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm text-stone-900 dark:text-white block">
                    Trạng thái hoạt động
                  </span>
                  <span className="text-xs text-stone-500">
                    Cho phép chọn năm học này trong các bộ lọc báo cáo và học vụ.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500/20"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl h-11 px-5 font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-2xl h-11 px-6 font-black uppercase text-xs tracking-wider bg-stone-900 dark:bg-amber-600 text-white"
            >
              {loading ? 'Đang lưu...' : year ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import Icons from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current?: boolean;
}

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
  onSave
}: AcademicYearModalProps) {
  const [formData, setFormData] = useState<Partial<AcademicYear>>({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
    is_current: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (year) {
      setFormData({
        name: year.name,
        start_date: year.start_date.split('T')[0],
        end_date: year.end_date.split('T')[0],
        is_active: year.is_active,
        is_current: year.is_current
      });
    } else {
      setFormData({
        name: "",
        start_date: "",
        end_date: "",
        is_active: false,
        is_current: false
      });
    }
  }, [year, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("[AcademicYearModal] Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[40px] border-stone-100 dark:border-white/5 glass-premium shadow-2xl p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black tracking-tight">
              {year ? "Chỉnh sửa năm học" : "Thêm năm học mới"}
            </DialogTitle>
            <p className="text-sm text-stone-500 font-medium">
              Cấu hình thông tin thời gian và trạng thái hoạt động của năm học.
            </p>
          </DialogHeader>

          <div className="p-8 pt-4 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Tên năm học</label>
              <Input 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: 2024 - 2025"
                required
                className="rounded-2xl border-stone-100 dark:border-white/10 bg-stone-50/50 dark:bg-white/5 font-bold h-14"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Ngày bắt đầu</label>
                <input 
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                  className="w-full px-4 h-14 rounded-2xl border border-stone-100 dark:border-white/10 bg-stone-50/50 dark:bg-white/5 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Ngày kết thúc</label>
                <input 
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                  className="w-full px-4 h-14 rounded-2xl border border-stone-100 dark:border-white/10 bg-stone-50/50 dark:bg-white/5 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_current: !prev.is_current }))}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  formData.is_current 
                    ? "border-amber-500/50 bg-amber-500/10" 
                    : "border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5"
                )}
              >
                <div className="text-left">
                  <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">Đặt làm năm học hiện tại</span>
                  <p className="text-[10px] text-stone-500 font-medium">Năm học này sẽ được chọn làm mặc định cho toàn hệ thống.</p>
                </div>
                <div className={cn(
                  "w-10 h-5 rounded-full p-1 transition-all",
                  formData.is_current ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                )}>
                  <div className={cn("w-3 h-3 bg-white rounded-full transition-all", formData.is_current ? "translate-x-5" : "translate-x-0")} />
                </div>
              </button>
            </div>
          </div>

          <DialogFooter className="p-8 border-t border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-white/2 rounded-b-[40px] gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20"
            >
              {loading ? <Icons.Progress className="w-4 h-4 animate-spin mr-2" /> : <Icons.Save className="w-4 h-4 mr-2" />}
              {year ? "Cập nhật" : "Lưu năm học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

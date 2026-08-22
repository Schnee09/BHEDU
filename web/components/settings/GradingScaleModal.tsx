'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Award, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { GradingScale, GradingScaleLevel } from '@/lib/settings/types';
import { cn } from '@/lib/utils';

interface GradingScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scale?: GradingScale;
  onSave: (data: Partial<GradingScale>) => Promise<void>;
}

const DEFAULT_LEVELS: GradingScaleLevel[] = [
  { letter: 'A', min: 8.5, max: 10.0, description: 'Xuất sắc / Giỏi', gpa: 4.0, color: '#10B981' },
  { letter: 'B', min: 7.0, max: 8.4, description: 'Khá', gpa: 3.0, color: '#3B82F6' },
  { letter: 'C', min: 5.5, max: 6.9, description: 'Trung bình khá', gpa: 2.0, color: '#F59E0B' },
  { letter: 'D', min: 4.0, max: 5.4, description: 'Trung bình', gpa: 1.0, color: '#EA580C' },
  { letter: 'F', min: 0.0, max: 3.9, description: 'Yếu / Kém (Không đạt)', gpa: 0.0, color: '#EF4444' },
];

export function GradingScaleModal({
  isOpen,
  onClose,
  scale,
  onSave,
}: GradingScaleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [levels, setLevels] = useState<GradingScaleLevel[]>(DEFAULT_LEVELS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scale) {
      setName(scale.name || '');
      setDescription(scale.description || '');
      setIsDefault(scale.is_default || false);
      setLevels(scale.scale && scale.scale.length > 0 ? scale.scale : DEFAULT_LEVELS);
    } else {
      setName('Thang điểm 10 chuẩn');
      setDescription('Thang điểm 10 quy đổi học lực và điểm chữ A-B-C-D');
      setIsDefault(false);
      setLevels(DEFAULT_LEVELS);
    }
  }, [scale, isOpen]);

  const handleAddLevel = () => {
    setLevels((prev) => [
      ...prev,
      { letter: 'Mới', min: 0, max: 10, description: 'Mức điểm', gpa: 0, color: '#F59E0B' },
    ]);
  };

  const handleRemoveLevel = (index: number) => {
    setLevels((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLevel = (index: number, field: keyof GradingScaleLevel, val: any) => {
    setLevels((prev) =>
      prev.map((lvl, i) => (i === index ? { ...lvl, [field]: val } : lvl))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        name,
        description,
        is_default: isDefault,
        scale: levels,
      });
      onClose();
    } catch (err) {
      console.error('[GradingScaleModal] Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] rounded-[36px] border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                  {scale ? 'Chỉnh sửa thang điểm' : 'Thiết lập thang điểm mới'}
                </DialogTitle>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Quy định các khoảng điểm số, điểm chữ và GPA tương ứng.
                </p>
              </div>
            </div>
          </div>

          {/* Body Scrollable */}
          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Tên thang điểm *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Thang điểm 10 Việt Nam"
                  required
                  className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Mô tả / Ghi chú
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Áp dụng cho học sinh khối THCS và THPT"
                  className="h-12 rounded-2xl bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                />
              </div>
            </div>

            {/* Default Switch */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm text-stone-900 dark:text-white block">
                    Thang điểm mặc định của trung tâm
                  </span>
                  <span className="text-xs text-stone-500">
                    Hệ thống sẽ tự động tính xếp loại và thống kê theo thang điểm này.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500/20"
                />
              </label>
            </div>

            {/* Scale Levels Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Các bậc xếp loại ({levels.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm bậc
                </button>
              </div>

              <div className="space-y-2">
                {levels.map((lvl, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/5 flex items-center gap-3"
                  >
                    <div className="w-16 shrink-0">
                      <Input
                        value={lvl.letter}
                        onChange={(e) => handleUpdateLevel(index, 'letter', e.target.value)}
                        placeholder="Chữ"
                        className="h-10 text-center font-black rounded-xl bg-white dark:bg-stone-800"
                      />
                    </div>
                    <div className="w-20 shrink-0">
                      <Input
                        type="number"
                        step="0.1"
                        value={lvl.min}
                        onChange={(e) =>
                          handleUpdateLevel(index, 'min', parseFloat(e.target.value) || 0)
                        }
                        placeholder="Min"
                        className="h-10 text-center font-mono font-bold rounded-xl bg-white dark:bg-stone-800"
                      />
                    </div>
                    <span className="text-stone-400 font-bold">&mdash;</span>
                    <div className="w-20 shrink-0">
                      <Input
                        type="number"
                        step="0.1"
                        value={lvl.max}
                        onChange={(e) =>
                          handleUpdateLevel(index, 'max', parseFloat(e.target.value) || 0)
                        }
                        placeholder="Max"
                        className="h-10 text-center font-mono font-bold rounded-xl bg-white dark:bg-stone-800"
                      />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Input
                        value={lvl.description || ''}
                        onChange={(e) => handleUpdateLevel(index, 'description', e.target.value)}
                        placeholder="Mô tả xếp loại (Giỏi, Khá...)"
                        className="h-10 text-xs font-medium rounded-xl bg-white dark:bg-stone-800"
                      />
                    </div>
                    {levels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLevel(index)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] flex justify-end gap-3 shrink-0">
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
              {loading ? 'Đang lưu...' : scale ? 'Cập nhật' : 'Tạo thang điểm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

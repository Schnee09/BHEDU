'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import { AcademicBackground } from '@/components/Academic/AcademicBackground';
import {
  Award,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Search,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GradeEntry {
  letter: string;
  min: number;
  max: number;
  description?: string;
  gpa?: number;
}

interface GradingScale {
  id: string;
  name: string;
  description: string;
  scale: GradeEntry[];
  is_default: boolean;
}

const DEFAULT_SCALE: GradeEntry[] = [
  { letter: 'A', min: 8.5, max: 10.0, description: 'Xuất sắc / Giỏi', gpa: 4.0 },
  { letter: 'B', min: 7.0, max: 8.4, description: 'Khá', gpa: 3.0 },
  { letter: 'C', min: 5.5, max: 6.9, description: 'Trung bình khá', gpa: 2.0 },
  { letter: 'D', min: 4.0, max: 5.4, description: 'Trung bình', gpa: 1.0 },
  { letter: 'F', min: 0.0, max: 3.9, description: 'Yếu / Kém (Không đạt)', gpa: 0.0 },
];

export default function GradingScalesPage() {
  const toast = useToast();
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingScale, setEditingScale] = useState<GradingScale | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    scale: DEFAULT_SCALE,
  });

  useEffect(() => {
    fetchScales();
  }, []);

  const fetchScales = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/grading-scales');
      const data = await response.json();
      setScales(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching grading scales:', error);
      toast.error('Lỗi', 'Không thể tải danh sách thang điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingScale(null);
    setFormData({
      name: 'Thang điểm chuẩn',
      description: 'Quy đổi điểm thi số sang điểm chữ và GPA',
      is_default: false,
      scale: DEFAULT_SCALE,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (scale: GradingScale) => {
    setEditingScale(scale);
    setFormData({
      name: scale.name,
      description: scale.description || '',
      is_default: scale.is_default,
      scale: scale.scale && scale.scale.length > 0 ? scale.scale : DEFAULT_SCALE,
    });
    setShowModal(true);
  };

  const handleAddLevel = () => {
    setFormData((prev) => ({
      ...prev,
      scale: [
        ...prev.scale,
        { letter: 'Mới', min: 0, max: 10, description: 'Mức điểm', gpa: 0 },
      ],
    }));
  };

  const handleRemoveLevel = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      scale: prev.scale.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateLevel = (index: number, field: keyof GradeEntry, val: any) => {
    setFormData((prev) => ({
      ...prev,
      scale: prev.scale.map((lvl, i) => (i === index ? { ...lvl, [field]: val } : lvl)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingScale) {
        const response = await apiFetch(`/api/admin/grading-scales/${editingScale.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to update');
        toast.success('Thành công', 'Đã cập nhật thang điểm');
      } else {
        const response = await apiFetch('/api/admin/grading-scales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to create');
        toast.success('Thành công', 'Đã tạo thang điểm mới');
      }

      setShowModal(false);
      fetchScales();
    } catch (error) {
      toast.error('Thất bại', 'Lỗi khi lưu thang điểm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thang điểm "${name}"?`)) return;

    try {
      const response = await apiFetch(`/api/admin/grading-scales/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Đã xóa', `Đã xóa thang điểm "${name}"`);
      fetchScales();
    } catch (error) {
      toast.error('Lỗi', 'Không thể xóa thang điểm này');
    }
  };

  const handleSetDefault = async (scale: GradingScale) => {
    try {
      const response = await apiFetch(`/api/admin/grading-scales/${scale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      if (!response.ok) throw new Error('Failed to set default');
      toast.success('Thành công', `Đã đặt "${scale.name}" làm thang điểm mặc định`);
      fetchScales();
    } catch (error) {
      toast.error('Lỗi', 'Không thể đặt làm mặc định');
    }
  };

  const filteredScales = scales.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] text-stone-900 dark:text-stone-100 p-4 md:p-10 lg:p-12">
      <AcademicBackground />
      <div className="max-w-[1500px] mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
              <span>CẤU HÌNH HỌC VỤ • GRADING SCALES</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-950 dark:text-white">
              Thang điểm & <span className="text-amber-500">Xếp loại</span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Thiết lập quy chuẩn tính điểm thi, điểm chữ và phân loại học lực toàn diện
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Tìm thang điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none w-full md:w-64 shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            </div>

            <button
              onClick={handleOpenAdd}
              className="h-11 px-6 bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Thêm thang điểm
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs font-mono text-stone-400">Đang tải danh sách thang điểm...</p>
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScales.map((scale) => {
              const levels = scale.scale || [];
              const isDefault = scale.is_default;

              return (
                <div
                  key={scale.id}
                  className={cn(
                    'group p-8 rounded-[32px] border transition-all duration-500 relative overflow-hidden flex flex-col justify-between space-y-6',
                    isDefault
                      ? 'bg-white dark:bg-stone-900/90 border-blue-500/40 shadow-xl shadow-blue-500/5 ring-2 ring-blue-500/10'
                      : 'bg-white dark:bg-stone-900/50 border-stone-100 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/20 shadow-sm'
                  )}
                >
                  <div className="space-y-4">
                    {/* Top */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            'p-3.5 rounded-2xl transition-colors',
                            isDefault
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                              : 'bg-stone-100 dark:bg-white/5 text-stone-500 group-hover:text-blue-500 group-hover:bg-blue-500/10'
                          )}
                        >
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                            {scale.name}
                          </h3>
                          {scale.description && (
                            <p className="text-xs text-stone-500 font-medium mt-0.5">
                              {scale.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isDefault ? (
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mặc định
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(scale)}
                            className="px-3 py-1 bg-stone-100 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors"
                          >
                            Đặt mặc định
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scale tiers */}
                    {levels.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        {levels.map((lvl, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-white/10 flex items-center justify-center font-black text-stone-800 dark:text-stone-100 text-xs">
                                {lvl.letter}
                              </span>
                              <span className="font-bold text-stone-700 dark:text-stone-300">
                                {lvl.description || 'Mức điểm'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-stone-500 text-[11px]">
                                {lvl.min} &mdash; {lvl.max}
                              </span>
                              {lvl.gpa !== undefined && (
                                <span className="px-2 py-0.5 rounded-md bg-stone-200/50 dark:bg-white/5 font-mono text-[10px] font-bold text-stone-600 dark:text-stone-400">
                                  GPA {lvl.gpa.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-white/5 text-xs">
                    <span className="text-[11px] font-mono text-stone-400">
                      {levels.length} bậc xếp loại
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(scale)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 text-stone-600 dark:text-stone-300 font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Sửa
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => handleDelete(scale.id, scale.name)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 text-stone-600 dark:text-stone-300 font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredScales.length === 0 && (
              <div className="col-span-full p-16 text-center space-y-4 rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-white/10">
                <Award className="w-12 h-12 text-stone-400 mx-auto opacity-40" />
                <p className="text-stone-500 font-bold text-sm">
                  Chưa có thang điểm nào khớp với từ khóa tìm kiếm.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal Form */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[640px] rounded-[36px] border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <div className="p-8 pb-6 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                      {editingScale ? 'Chỉnh sửa thang điểm' : 'Tạo thang điểm mới'}
                    </DialogTitle>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Quy định các bậc xếp loại và khoảng điểm min-max.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Tên thang điểm *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ví dụ: Thang điểm 10 chuẩn"
                    required
                    className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Mô tả
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Mô tả mục đích sử dụng..."
                    className="h-12 rounded-2xl bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-sm text-stone-900 dark:text-white block">
                        Thang điểm mặc định của hệ thống
                      </span>
                      <span className="text-xs text-stone-500">
                        Áp dụng tự động cho bảng điểm và phân loại học lực.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, is_default: e.target.checked }))
                      }
                      className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500/20"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Các bậc xếp loại ({formData.scale.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLevel}
                      className="flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm bậc
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.scale.map((lvl, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/5 flex items-center gap-2.5"
                      >
                        <div className="w-16 shrink-0">
                          <Input
                            value={lvl.letter}
                            onChange={(e) => handleUpdateLevel(index, 'letter', e.target.value)}
                            placeholder="Chữ"
                            className="h-10 text-center font-black rounded-xl bg-white dark:bg-stone-800"
                          />
                        </div>
                        <div className="w-18 shrink-0">
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
                        <div className="w-18 shrink-0">
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
                        <div className="flex-1 min-w-[80px]">
                          <Input
                            value={lvl.description || ''}
                            onChange={(e) =>
                              handleUpdateLevel(index, 'description', e.target.value)
                            }
                            placeholder="Mô tả xếp loại..."
                            className="h-10 text-xs font-medium rounded-xl bg-white dark:bg-stone-800"
                          />
                        </div>
                        {formData.scale.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLevel(index)}
                            className="p-2 text-stone-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] flex justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl h-11 px-5 font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl h-11 px-6 font-black uppercase text-xs tracking-wider bg-stone-900 dark:bg-amber-600 text-white"
                >
                  {submitting ? 'Đang lưu...' : editingScale ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

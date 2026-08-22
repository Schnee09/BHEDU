'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Shield, Sparkles, Check, CheckSquare, Square, Palette, Layers, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { apiFetch } from '@/lib/api/client';

interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
}

interface RoleInfo {
  code: string;
  name: string;
  description: string;
  color: string;
  is_system: boolean;
  user_count: number;
  permission_count: number;
}

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRole?: RoleInfo | null;
  allPermissions: Permission[];
}

const COLOR_PRESETS = [
  { label: 'Vàng Cam', value: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  { label: 'Hồng Đào', value: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { label: 'Xanh Lam', value: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { label: 'Xanh Ngọc', value: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800' },
  { label: 'Hổ Phách', value: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { label: 'Lục Bảo', value: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { label: 'Xám Đá', value: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-700' },
];

const CATEGORY_LABELS: Record<string, string> = {
  system: 'Hệ Thống',
  users: 'Người Dùng',
  students: 'Học Sinh',
  classes: 'Lớp Học',
  timetable: 'Thời Khóa Biểu',
  grades: 'Điểm Số & Đánh Giá',
  attendance: 'Điểm Danh',
  curriculum: 'Giáo Trình',
  subjects: 'Môn Học',
  parent: 'Phụ Huynh & Liên Kết',
  reports: 'Báo Cáo Thống Kê',
  finance: 'Tài Chính & Học Phí',
  tutoring: 'Gia Sư & Kèm 1-1',
  announcements: 'Thông Báo & Bảng Tin',
};

export function CreateRoleModal({
  isOpen,
  onClose,
  onSuccess,
  editingRole,
  allPermissions,
}: CreateRoleModalProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const defaultColor = COLOR_PRESETS[0]?.value || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: defaultColor,
  });

  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  // Group permissions by category
  const groupedPerms = allPermissions.reduce((acc, perm) => {
    const cat = perm.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  useEffect(() => {
    if (editingRole) {
      setFormData({
        code: editingRole.code,
        name: editingRole.name,
        description: editingRole.description || '',
        color: editingRole.color || defaultColor,
      });
      fetchRoleCurrentPermissions(editingRole.code);
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        color: defaultColor,
      });
      setSelectedPerms(new Set());
    }
  }, [editingRole, isOpen]);

  const fetchRoleCurrentPermissions = async (roleCode: string) => {
    setLoadingPerms(true);
    try {
      const res = await apiFetch(`/api/admin/permissions/roles/${roleCode}`);
      if (res.ok) {
        const data = await res.json();
        const activePerms = new Set<string>();
        (data.basePermissions || []).forEach((p: string) => activePerms.add(p));
        (data.overrides || []).forEach((o: any) => {
          if (o.is_denied) {
            activePerms.delete(o.permission_code);
          } else {
            activePerms.add(o.permission_code);
          }
        });
        setSelectedPerms(activePerms);
      }
    } catch (err) {
      console.error('Failed to fetch role permissions:', err);
    } finally {
      setLoadingPerms(false);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    const catPerms = groupedPerms[category] || [];
    const allSelected = catPerms.every((p) => selectedPerms.has(p.code));

    setSelectedPerms((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => {
        if (allSelected) {
          next.delete(p.code);
        } else {
          next.add(p.code);
        }
      });
      return next;
    });
  };

  const handleAutoSlug = (nameValue: string) => {
    if (!editingRole) {
      const slug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      setFormData((prev) => ({ ...prev, name: nameValue, code: slug }));
    } else {
      setFormData((prev) => ({ ...prev, name: nameValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Lỗi', 'Vui lòng nhập đầy đủ Tên vai trò và Mã định danh');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        permissions: Array.from(selectedPerms),
      };

      const url = editingRole
        ? `/api/admin/roles/${editingRole.code}`
        : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && (data.success || !data.error)) {
        toast.success(
          'Thành công',
          editingRole ? 'Đã cập nhật vai trò' : 'Đã tạo vai trò mới'
        );
        onSuccess();
        onClose();
      } else {
        toast.error('Lỗi', data.error || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi lưu vai trò');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col rounded-[36px] border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="p-7 pb-5 border-b border-stone-100 dark:border-white/5 bg-stone-50/60 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-stone-950 dark:text-white flex items-center gap-2">
                  {editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò tùy biến mới'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                    Custom RBAC
                  </span>
                </DialogTitle>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Thiết lập thông tin định danh và chọn ma trận quyền hạn chi tiết cho vai trò này.
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-7 space-y-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Tên hiển thị vai trò *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleAutoSlug(e.target.value)}
                  placeholder="Ví dụ: Kế toán viên, Giáo vụ..."
                  required
                  className="h-11 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Mã định danh (Code) *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
                    }))
                  }
                  disabled={!!editingRole}
                  placeholder="accountant"
                  required
                  className="h-11 rounded-2xl font-mono font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Mô tả nhiệm vụ & phạm vi
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Ví dụ: Quản lý các khoản thu chi, báo cáo tài chính và hoàn phí..."
                className="h-11 rounded-2xl bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10 text-xs"
              />
            </div>

            {/* Color Preset Selector */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                Màu sắc huy hiệu đại diện
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color: preset.value }))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5',
                      preset.value,
                      formData.color === preset.value
                        ? 'ring-2 ring-amber-500 shadow-md scale-105'
                        : 'opacity-80 hover:opacity-100'
                    )}
                  >
                    {formData.color === preset.value && <Check className="w-3.5 h-3.5" />}
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Permission Matrix Header */}
            <div className="pt-2 border-t border-stone-100 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Ma trận quyền hạn ({selectedPerms.size} quyền đã chọn)
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Tích chọn các quyền mà vai trò này được phép thực thi.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPerms(new Set(allPermissions.map((p) => p.code)))
                    }
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-stone-300 dark:text-stone-700">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPerms(new Set())}
                    className="text-[11px] font-bold text-stone-400 hover:underline"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              {/* Permission Groups */}
              <div className="space-y-4">
                {Object.entries(groupedPerms).map(([category, perms]) => {
                  const catSelectedCount = perms.filter((p) =>
                    selectedPerms.has(p.code)
                  ).length;
                  const isAllCatSelected = catSelectedCount === perms.length;

                  return (
                    <div
                      key={category}
                      className="p-4 rounded-2xl bg-stone-50/70 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="flex items-center gap-2 text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider hover:text-amber-500 transition-colors"
                        >
                          {isAllCatSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400" />
                          )}
                          <span>
                            {CATEGORY_LABELS[category] || category} ({catSelectedCount}/{perms.length})
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p) => {
                          const isChecked = selectedPerms.has(p.code);

                          return (
                            <label
                              key={p.code}
                              className={cn(
                                'p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs transition-all select-none',
                                isChecked
                                  ? 'bg-amber-500/10 border-amber-500/30 text-stone-900 dark:text-white font-bold'
                                  : 'bg-white dark:bg-stone-800/60 border-stone-200/60 dark:border-white/5 text-stone-500 hover:border-stone-300'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(p.code)}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                              />
                              <div className="min-w-0">
                                <p className="truncate">{p.name || p.code}</p>
                                <p className="text-[10px] font-mono text-stone-400 truncate opacity-70">
                                  {p.code}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/60 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <Info className="w-4 h-4 text-amber-500" />
              <span>
                {selectedPerms.size} quyền sẽ được cấp cho vai trò này.
              </span>
            </div>

            <div className="flex gap-3">
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
                disabled={submitting}
                className="rounded-2xl h-11 px-6 font-black uppercase text-xs tracking-wider bg-stone-900 dark:bg-amber-600 text-white shadow-lg"
              >
                {submitting ? 'Đang lưu...' : editingRole ? 'Cập nhật' : 'Tạo vai trò'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

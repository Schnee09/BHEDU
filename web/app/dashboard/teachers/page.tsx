'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import PageGuard from '@/components/PageGuard';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Award,
  Phone,
  Mail,
  BookOpen,
  Building2,
  Clock,
  LayoutGrid,
  List,
  Users,
  Calendar,
  X,
} from 'lucide-react';

import UserFormModal from '@/components/users/UserFormModal';

interface AssignedClass {
  id: string;
  name: string;
  status: string;
  room?: string | null;
  schedule?: string | null;
  capacity?: number | null;
  sessions_per_week?: number;
  student_count?: number;
}

interface Teacher {
  id: string;
  user_id?: string | null;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  phone: string | null;
  role?: string;
  teacher_code?: string | null;
  photo_url: string | null;
  department: string | null;
  specialization: string | null;
  bio: string | null;
  classes: AssignedClass[];
  class_count: number;
  total_students: number;
  weekly_sessions: number;
  is_active: boolean;
  created_at: string;
}

const DEPARTMENTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Tin học',
  'Khoa học Tự nhiên',
];

export default function TeachersPage() {
  return (
    <PageGuard permissions="users.view">
      <TeachersContent />
    </PageGuard>
  );
}

function TeachersContent() {
  const toast = useToast();
  const { profile } = useProfile();
  const { isAdmin: isSystemAdmin, isStaff } = usePermissions();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // User Form Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const canManage = isSystemAdmin || isStaff;

  const fetchTeachers = useCallback(async (showFullSpinner = false) => {
    if (showFullSpinner) setLoading(true);
    try {
      const response = await apiFetch('/api/teachers');
      const data = await response.json();
      if (data && Array.isArray(data.teachers)) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      toast.error('Lỗi', 'Không thể tải danh sách giáo viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers(true);
  }, [fetchTeachers]);

  const openCreateModal = () => {
    setEditingTeacher(null);
    setShowUserModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setShowUserModal(true);
  };

  const deleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa giáo viên "${name}" khỏi hệ thống?`)) return;

    try {
      const response = await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok && result.success !== false) {
        toast.success('Đã xóa', `Đã xóa giáo viên ${name}`);
        await fetchTeachers();
      } else {
        toast.error('Thất bại', result.error || 'Không thể xóa giáo viên này');
      }
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      toast.error('Lỗi', 'Có lỗi xảy ra khi xóa');
    }
  };

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    return teachers.filter((teacher) => {
      const q = (searchQuery || '').trim().toLowerCase();
      const matchSearch =
        !q ||
        (teacher.full_name || '').toLowerCase().includes(q) ||
        (teacher.email || '').toLowerCase().includes(q) ||
        (teacher.teacher_code || '').toLowerCase().includes(q) ||
        (teacher.phone || '').toLowerCase().includes(q) ||
        (teacher.department || '').toLowerCase().includes(q) ||
        (teacher.specialization || '').toLowerCase().includes(q);

      const matchDept =
        selectedDept === 'all' ||
        (teacher.department || '').toLowerCase() === selectedDept.toLowerCase();

      return matchSearch && matchDept;
    });
  }, [teachers, searchQuery, selectedDept]);

  // Statistics tailored for Tuition / Education Center
  const stats = useMemo(() => {
    const total = teachers.length;
    const totalClasses = teachers.reduce((sum, t) => sum + (t.class_count || 0), 0);
    const totalStudents = teachers.reduce((sum, t) => sum + (t.total_students || 0), 0);
    const totalWeeklySessions = teachers.reduce((sum, t) => sum + (t.weekly_sessions || 0), 0);

    return { total, totalClasses, totalStudents, totalWeeklySessions };
  }, [teachers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Học vụ & Giảng dạy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Đội ngũ Giáo viên
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Quản lý giáo viên đứng lớp, số học sinh phụ trách và số ca dạy/tuần
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm giáo viên</span>
            </button>
          </div>
        )}
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Tổng giáo viên
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.total}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Giáo viên giảng dạy
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Tổng học sinh
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.totalStudents}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Học sinh trong các lớp
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Lớp học chính khóa
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.totalClasses}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Lớp đang hoạt động
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Tổng ca dạy / tuần
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.totalWeeklySessions}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Ca học trong tuần</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã GV, email, SĐT..."
            className="w-full pl-10 pr-10 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả tổ bộ môn</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden p-0.5 bg-stone-100 dark:bg-stone-800">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              )}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'table'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              )}
              title="Xem dạng bảng"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs text-stone-400 font-medium">Đang tải danh sách giáo viên...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-8">
          <Award className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Không tìm thấy giáo viên nào
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedDept !== 'all'
              ? 'Thử thay đổi từ khóa hoặc bộ lọc để xem kết quả'
              : 'Chưa có giáo viên nào trong hệ thống. Nhấn nút bên dưới để thêm mới.'}
          </p>
          {canManage && !searchQuery && selectedDept === 'all' && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm giáo viên đầu tiên</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((t) => {
            const initials = (t.full_name || '?')
              .split(' ')
              .slice(-2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();

            return (
              <div
                key={t.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-stone-900 dark:text-white text-sm truncate">
                          {t.full_name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
                          {t.department || 'Giáo viên'}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {t.teacher_code || 'GV---'}
                      </p>
                    </div>
                  </div>

                  {/* Metrics & Classes */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-2.5">
                    {/* Workload metrics */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
                      <div className="text-left">
                        <span className="text-[10px] font-semibold text-stone-400 block flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-500" /> Sĩ số học sinh:
                        </span>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">
                          {t.total_students} HS
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-semibold text-stone-400 block flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-500" /> Ca dạy / tuần:
                        </span>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">
                          {t.weekly_sessions} ca/tuần
                        </span>
                      </div>
                    </div>

                    {t.specialization && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-400 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Chuyên môn:
                        </span>
                        <span className="font-medium text-stone-600 dark:text-stone-400 truncate max-w-[160px]">
                          {t.specialization}
                        </span>
                      </div>
                    )}

                    {/* Assigned Classes */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-stone-400 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Lớp đang dạy ({t.class_count}):
                        </span>
                      </div>
                      {t.classes && t.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {t.classes.map((c) => (
                            <Link
                              key={c.id}
                              href="/dashboard/classes"
                              className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                            >
                              <span>{c.name}</span>
                              <span className="text-stone-400 font-normal">
                                ({c.student_count || 0} HS)
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic">
                          Chưa được phân công lớp nào
                        </p>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="pt-1 space-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                      {t.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 shrink-0 text-stone-400" />
                          <span className="truncate">{t.email}</span>
                        </div>
                      )}
                      {t.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0 text-stone-400" />
                          <span>{t.phone}</span>
                        </div>
                      )}
                    </div>

                    {t.bio && (
                      <p className="text-[11px] text-stone-400 italic line-clamp-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                        {t.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                {canManage && (
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                      title="Chỉnh sửa giáo viên"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTeacher(t.id, t.full_name)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa giáo viên"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Giáo viên</th>
                  <th className="px-4 py-3.5">Tổ bộ môn</th>
                  <th className="px-4 py-3.5">Tổng học sinh</th>
                  <th className="px-4 py-3.5">Ca dạy / tuần</th>
                  <th className="px-4 py-3.5">Lớp phụ trách</th>
                  <th className="px-4 py-3.5">Liên hệ</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredTeachers.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {t.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                            {t.full_name}
                          </p>
                          <p className="font-mono text-[10px] text-stone-400">
                            {t.teacher_code || 'GV---'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-stone-700 dark:text-stone-300">
                      {t.department || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                      {t.total_students} HS
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-purple-600 dark:text-purple-400">
                      {t.weekly_sessions} ca
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {t.classes && t.classes.length > 0 ? (
                          t.classes.map((c) => (
                            <span
                              key={c.id}
                              className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300"
                            >
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-stone-400 text-[11px] italic">0 lớp</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500">
                      <p>{t.phone || '—'}</p>
                      <p className="text-[10px] text-stone-400">{t.email || ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-amber-600 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTeacher(t.id, t.full_name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-stone-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal configured for Teacher */}
      {showUserModal && (
        <UserFormModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setEditingTeacher(null);
          }}
          onSuccess={() => {
            fetchTeachers();
            setShowUserModal(false);
            setEditingTeacher(null);
          }}
          user={editingTeacher}
          initialRole="teacher"
        />
      )}
    </div>
  );
}

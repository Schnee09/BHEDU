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
  GraduationCap,
  Phone,
  Mail,
  BookOpen,
  DollarSign,
  X,
  Users,
  Clock,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';

import UserFormModal from '@/components/users/UserFormModal';

interface Tutor {
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
  teacher_type: string;
  specialization: string | null;
  teaching_subjects: string[];
  hourly_rate: number | null;
  bio: string | null;
  tutoring_slots_count?: number;
  tutoring_student_count?: number;
}

export default function TutorsPage() {
  return (
    <PageGuard permissions="users.view">
      <TutorsContent />
    </PageGuard>
  );
}

function TutorsContent() {
  const toast = useToast();
  const { profile } = useProfile();
  const { isAdmin: isSystemAdmin, isStaff } = usePermissions();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // User Form Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);

  const canManage = isSystemAdmin || isStaff;

  const fetchTutors = useCallback(async (showFullSpinner = false) => {
    if (showFullSpinner) setLoading(true);
    try {
      const response = await apiFetch('/api/tutors');
      const data = await response.json();
      if (data && Array.isArray(data.tutors)) {
        setTutors(data.tutors);
      }
    } catch (error) {
      console.error('Failed to fetch tutors:', error);
      toast.error('Lỗi', 'Không thể tải danh sách gia sư');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutors(true);
  }, [fetchTutors]);

  const openCreateModal = () => {
    setEditingTutor(null);
    setShowUserModal(true);
  };

  const openEditModal = (tutor: Tutor) => {
    setEditingTutor(tutor);
    setShowUserModal(true);
  };

  const deleteTutor = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa gia sư "${name}" khỏi hệ thống?`)) return;

    try {
      const response = await apiFetch(`/api/tutors/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok && result.success !== false) {
        toast.success('Đã xóa', `Đã xóa gia sư ${name}`);
        await fetchTutors();
      } else {
        toast.error('Thất bại', result.error || 'Không thể xóa gia sư này');
      }
    } catch (error) {
      console.error('Failed to delete tutor:', error);
      toast.error('Lỗi', 'Có lỗi xảy ra khi xóa');
    }
  };

  const filteredTutors = useMemo(() => {
    if (!Array.isArray(tutors)) return [];
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return tutors;
    return tutors.filter((tutor) => {
      const name = (tutor.full_name || '').toLowerCase();
      const email = (tutor.email || '').toLowerCase();
      const code = (tutor.teacher_code || '').toLowerCase();
      const spec = (tutor.specialization || '').toLowerCase();
      const phone = (tutor.phone || '').toLowerCase();
      const subjects = Array.isArray(tutor.teaching_subjects)
        ? tutor.teaching_subjects.join(' ').toLowerCase()
        : '';
      return (
        name.includes(q) ||
        email.includes(q) ||
        code.includes(q) ||
        spec.includes(q) ||
        phone.includes(q) ||
        subjects.includes(q)
      );
    });
  }, [tutors, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = tutors.length;
    const totalStudents = tutors.reduce((sum, t) => sum + (t.tutoring_student_count || 0), 0);
    const withHourlyRate = tutors.filter((t) => !!t.hourly_rate).length;
    const withSubjects = tutors.filter(
      (t) => t.teaching_subjects && t.teaching_subjects.length > 0
    ).length;

    return { total, totalStudents, withHourlyRate, withSubjects };
  }, [tutors]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Kèm 1-1 & Nhóm nhỏ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Đội ngũ Gia sư
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Quản lý danh sách sinh viên dạy kèm, học phí theo giờ và môn kèm 1-1
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm gia sư</span>
            </button>
          </div>
        )}
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Tổng số gia sư
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.total}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Gia sư hoạt động</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Học sinh đang kèm
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.totalStudents}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Học sinh nhận kèm</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Có mức lương / giờ
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.withHourlyRate}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Đã thiết lập thù lao
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Môn dạy kèm
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-2 font-mono">
            {stats.withSubjects}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Đã đăng ký môn</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên gia sư, mã GS, email, môn dạy..."
            className="w-full pl-10 pr-10 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
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
      </div>

      {/* Tutor Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-stone-400 font-medium">Đang tải danh sách gia sư...</p>
        </div>
      ) : filteredTutors.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-8">
          <GraduationCap className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Không tìm thấy gia sư nào
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Không tìm thấy kết quả nào khớp với từ khóa "${searchQuery}"`
              : 'Chưa có gia sư nào trong hệ thống. Nhấn nút bên dưới để thêm mới.'}
          </p>
          {canManage && !searchQuery && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm gia sư đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTutors.map((tutor) => {
            const initials = (tutor.full_name || '?')
              .split(' ')
              .slice(-2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();

            return (
              <div
                key={tutor.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-stone-900 dark:text-white text-sm truncate">
                          {tutor.full_name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                          Gia sư
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {tutor.teacher_code || 'GS---'}
                      </p>
                    </div>
                  </div>

                  {/* Hourly Rate & Subjects */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-2.5">
                    {/* Hourly rate */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Thù lao theo giờ:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                        {tutor.hourly_rate
                          ? `${tutor.hourly_rate.toLocaleString('vi-VN')} đ/giờ`
                          : 'Chưa đặt'}
                      </span>
                    </div>

                    {/* Teaching subjects */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-stone-400 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Môn dạy kèm:
                        </span>
                      </div>
                      {tutor.teaching_subjects && tutor.teaching_subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tutor.teaching_subjects.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic">Chưa đăng ký môn kèm</p>
                      )}
                    </div>

                    {/* Tutoring students */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Học sinh đang kèm:
                      </span>
                      <span className="font-bold text-stone-700 dark:text-stone-300 font-mono text-[11px]">
                        {tutor.tutoring_student_count || 0} học sinh
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="pt-2 space-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                      {tutor.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 shrink-0 text-stone-400" />
                          <span className="truncate">{tutor.email}</span>
                        </div>
                      )}
                      {tutor.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0 text-stone-400" />
                          <span>{tutor.phone}</span>
                        </div>
                      )}
                    </div>

                    {tutor.bio && (
                      <p className="text-[11px] text-stone-400 italic line-clamp-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                        {tutor.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                {canManage && (
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditModal(tutor)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Chỉnh sửa gia sư"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTutor(tutor.id, tutor.full_name)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa gia sư"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* User Form Modal configured for Tutor */}
      {showUserModal && (
        <UserFormModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setEditingTutor(null);
          }}
          onSuccess={() => {
            fetchTutors();
            setShowUserModal(false);
            setEditingTutor(null);
          }}
          user={editingTutor}
          initialRole="tutor"
        />
      )}
    </div>
  );
}

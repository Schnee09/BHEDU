/**
 * Students Page - Refactored with Modern Hooks and Components
 *
 * Features:
 * - Uses custom hooks (useFetch, usePagination, useDebounce, useToast)
 * - New UI component library
 * - Statistics dashboard
 * - Better loading states
 * - Audit logging
 * - Export functionality
 * - Bulk operations
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useFetch, useMutation, usePagination, useDebounce, useToast, useUser } from '@/hooks';
import { apiFetch, bulkArchiveStudents, deleteStudent } from '@/lib/api/client';
import {
  Button,
  Card,
  CardHeader,
  Badge,
  EmptyState,
  Input,
  Table,
  SkeletonStatCard,
  SkeletonTable,
  Modal,
} from '@/components/ui';
import { PermissionGuard } from '@/hooks/usePermissions';
import PageGuard from '@/components/PageGuard';
import { StatCard } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { PageHeader } from '@/components/Breadcrumb';
import { ToastContainer } from '@/components/ui/Toast';
import { logger } from '@/lib/logger';
import { createAuditLog, AuditActions } from '@/lib/audit';
import { routes } from '@/lib/routes';
import {
  Copy,
  Check,
  ChevronDown,
  Plus,
  LayoutGrid,
  List,
  MessageSquare,
  Award,
  Phone,
} from 'lucide-react';
import MobileStudentList from '@/components/students/MobileStudentList';
import StudentGridView from '@/components/students/StudentGridView';
import StudentQuickActions from '@/components/students/StudentQuickActions';
import { cn } from '@/lib/utils';
import { showToast } from '@/components/ToastProvider';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';

import UserFormModal from '@/components/users/UserFormModal';

export interface Student {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  role: string;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  student_code?: string;
  student_id?: string;
  grade_level?: string;
  status?: string;
  gender?: string;
  created_at: string;
}

export function getStudentDisplayName(
  student?: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null
): string {
  if (!student) return 'Học sinh';
  const name = student.full_name?.trim();
  if (
    name &&
    name !== 'undefined undefined' &&
    name !== 'null null' &&
    name !== 'undefined' &&
    name !== 'null'
  ) {
    return name;
  }
  const parts = [student.last_name, student.first_name].filter(
    (p) => p && p !== 'undefined' && p !== 'null'
  );
  if (parts.length > 0) {
    return parts.join(' ');
  }
  if (student.email) {
    return student.email.split('@')[0] || 'Học sinh';
  }
  return 'Học sinh chưa đặt tên';
}

interface StudentStats {
  total_students: number;
  active_students: number;
  inactive_students: number;
  by_grade: Record<string, number>;
}

export default function StudentsPageGuarded() {
  return (
    <PageGuard permissions="students.view">
      <StudentsPage />
    </PageGuard>
  );
}

function StudentsPage() {
  const toast = useToast();
  const { user, hasAdminAccess, isTeacher: _isTeacher } = useUser();

  // View mode (Desktop table vs Grid cards)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Search with debounce
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Filters
  const [filters, setFilters] = useState({
    gradeLevel: '',
    status: '',
    gender: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Pagination
  const pagination = usePagination({ initialPage: 1, initialLimit: 50 });

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawer states
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast.success(`Đã sao chép ${label}: ${text}`);
  };

  // Fetch students with pagination and search
  const queryParams = new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    search: debouncedSearch,
    ...(filters.gradeLevel && { grade_level: filters.gradeLevel }),
    ...(filters.status && { status: filters.status }),
    ...(filters.gender && { gender: filters.gender }),
  });

  // Option A routing model: /dashboard/* pages are role-aware.
  // Fetch from the role-aware route; server will return the right scope
  // (admin: all students, others: permitted subset).
  const { data, loading, error, refetch } = useFetch<{
    students: Student[];
    total: number;
    statistics?: StudentStats;
  }>(`/api/students?${queryParams.toString()}`);

  // Handle successful fetch
  const { setTotalItems } = pagination;
  useEffect(() => {
    if (data) {
      const studentsData = data.students || (data as any).data || [];
      const totalCount =
        data.total !== undefined ? data.total : (data as any).pagination?.total || 0;

      setTotalItems(totalCount);
      // Guard against unexpected response shapes to avoid runtime errors
      const count = Array.isArray((data as any).students)
        ? (data as any).students.length
        : Array.isArray((data as any).data)
          ? (data as any).data.length
          : 0;
      logger.info('Students loaded', { count });
    }
  }, [data, setTotalItems]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Không thể tải danh sách học sinh', error);
      logger.error('Error loading students', new Error(error));
    }
  }, [error]);

  // Bulk archive mutation (admin/staff only)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutate: archiveStudent, loading: archiving } = useMutation('/api/students', 'DELETE');

  const students = (data?.students || (data as any)?.data || []) as Student[];
  const statistics = data?.statistics;

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Bulk archive
  const handleBulkArchive = async () => {
    if (!hasAdminAccess) {
      toast.warning('Not Allowed', 'Only admins and staff can archive students');
      return;
    }
    if (selectedIds.size === 0) {
      toast.warning('Chưa chọn', 'Vui lòng chọn học sinh để lưu trữ');
      return;
    }

    if (
      !confirm(`Archive ${selectedIds.size} student(s)? This will set their status to inactive.`)
    ) {
      return;
    }

    try {
      logger.info('Bulk archiving students', { count: selectedIds.size });

      await bulkArchiveStudents(Array.from(selectedIds));

      toast.success('Students archived', `Successfully archived ${selectedIds.size} student(s)`);

      // Audit log
      await createAuditLog({
        userId: user?.id || 'unknown',
        userEmail: user?.email || 'unknown',
        userRole: user?.role || 'admin',
        action: AuditActions.STUDENT_DELETED,
        resourceType: 'student',
        resourceId: 'bulk',
        metadata: { count: selectedIds.size, studentIds: Array.from(selectedIds) },
      });

      setSelectedIds(new Set());
      refetch();
    } catch (error) {
      logger.error(
        'Bulk archive error',
        error instanceof Error ? error : new Error(String(error)),
        { originalError: String(error) }
      );
      toast.error('Lưu trữ thất bại', 'Không thể lưu trữ học sinh');
    }
  };

  // Single student archive
  const handleArchiveOne = async (student: Student) => {
    if (!hasAdminAccess) {
      toast.warning('Not Allowed', 'Only admins and staff can archive students');
      return;
    }

    if (!confirm(`Archive ${student.full_name}? This will set their status to inactive.`)) {
      return;
    }

    try {
      logger.info('Archiving student', { studentId: student.id });

      await deleteStudent(student.id);

      await createAuditLog({
        userId: user?.id || 'unknown',
        userEmail: user?.email || 'unknown',
        userRole: user?.role || 'admin',
        action: AuditActions.STUDENT_DELETED,
        resourceType: 'student',
        resourceId: student.id,
        metadata: { studentId: student.id },
      });

      toast.success('Student archived', `${student.full_name} has been archived`);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Archive failed';
      toast.error('Archive failed', message);
      logger.error('Archive student error', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleInlineStatusToggle = async (student: Student) => {
    const nextStatus = student.status === 'active' ? 'inactive' : 'active';
    const toastId = showToast.loading(`Đang cập nhật trạng thái cho ${student.full_name}...`);
    try {
      const payload = {
        full_name: student.full_name,
        email: student.email || undefined,
        phone: student.phone || null,
        address: student.address || null,
        date_of_birth: student.date_of_birth || null,
        student_code: student.student_code || undefined,
        student_id: student.student_id || null,
        grade_level: student.grade_level || null,
        gender: student.gender || null,
        status: nextStatus,
      };
      const response = await apiFetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Không thể cập nhật trạng thái');
      }
      showToast.dismiss(toastId);
      showToast.success(`Đã cập nhật trạng thái của ${student.full_name} thành công!`);
      refetch();
    } catch (err: any) {
      showToast.dismiss(toastId);
      showToast.error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleInlineGradeUpdate = async (student: Student, newGrade: string) => {
    const toastId = showToast.loading(`Đang cập nhật khối lớp cho ${student.full_name}...`);
    try {
      const payload = {
        full_name: student.full_name,
        email: student.email || undefined,
        phone: student.phone || null,
        address: student.address || null,
        date_of_birth: student.date_of_birth || null,
        student_code: student.student_code || undefined,
        student_id: student.student_id || null,
        gender: student.gender || null,
        grade_level: newGrade,
        status: student.status || 'active',
      };
      const response = await apiFetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Không thể cập nhật khối lớp');
      }
      showToast.dismiss(toastId);
      showToast.success(`Đã cập nhật khối lớp của ${student.full_name} thành công!`);
      refetch();
    } catch (err: any) {
      showToast.dismiss(toastId);
      showToast.error(err.message || 'Không thể cập nhật khối lớp');
    }
  };

  const handleBulkGradeUpdate = async (newGrade: string) => {
    const ids = Array.from(selectedIds);
    const toastId = showToast.loading(`Đang cập nhật khối lớp cho ${ids.length} học sinh...`);
    try {
      await Promise.all(
        ids.map(async (id) => {
          const student = students.find((s) => s.id === id);
          if (!student) return;
          const payload = {
            full_name: student.full_name,
            email: student.email || undefined,
            phone: student.phone || null,
            address: student.address || null,
            date_of_birth: student.date_of_birth || null,
            student_code: student.student_code || undefined,
            student_id: student.student_id || null,
            gender: student.gender || null,
            grade_level: newGrade,
            status: student.status || 'active',
          };
          const response = await apiFetch(`/api/students/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error('Failed to update student');
          }
        })
      );
      showToast.dismiss(toastId);
      showToast.success(`Đã cập nhật khối lớp cho ${ids.length} học sinh thành công!`);
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('Không thể cập nhật khối lớp của một số học sinh');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.warning('No data', 'No students to export');
      return;
    }

    const studentsToExport =
      selectedIds.size > 0 ? students.filter((s) => selectedIds.has(s.id)) : students;

    // Create CSV content
    const headers = [
      'Họ và tên',
      'UID (Mã truy cập)',
      'CID (Mã định danh)',
      'Email',
      'Số điện thoại',
      'Ngày sinh',
      'Khối lớp',
      'Trạng thái',
      'Ngày tham gia',
    ];
    const rows = studentsToExport.map((s) => [
      s.full_name,
      s.student_code || '',
      s.student_id || '',
      s.email || '',
      s.phone || '',
      s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('vi-VN') : '',
      s.grade_level || '',
      s.status || 'active',
      new Date(s.created_at).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export complete', `Exported ${studentsToExport.length} student(s)`);
    logger.info('Students exported', { count: studentsToExport.length });
  };

  // Render statistics
  const renderStatistics = () => {
    if (loading && !statistics) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 sm:h-28 bg-stone-100 dark:bg-stone-800 rounded-2xl skeleton-shimmer"
            />
          ))}
        </div>
      );
    }

    if (!statistics) return null;

    return (
      <div className="mb-4">
        {/* Mobile Mini Stats Pill Bar */}
        <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 text-xs font-black">
          <div className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0">
            <span>
              👥 Tổng:{' '}
              <strong className="font-mono text-stone-900 dark:text-white">
                {statistics.total_students}
              </strong>
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-1.5 shrink-0">
            <span>
              ✓ Đang học:{' '}
              <strong className="font-mono text-emerald-800 dark:text-emerald-200">
                {statistics.active_students}
              </strong>
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center gap-1.5 shrink-0">
            <span>
              ⏸ Lưu trữ: <strong className="font-mono">{statistics.inactive_students}</strong>
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-1.5 shrink-0">
            <span>📚 {Object.keys(statistics.by_grade || {}).length} khối</span>
          </div>
        </div>

        {/* Desktop & Tablet Full Stat Cards */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
          <StatCard
            label="Tổng học sinh"
            value={statistics.total_students}
            icon={<Icons.Students className="w-4 h-4" />}
            trend={{ value: 0, isPositive: true }}
            subtitle="Hồ sơ toàn hệ thống"
            color="blue"
            className="shadow-xs"
          />

          <StatCard
            label="Đang học"
            value={statistics.active_students}
            icon={<Icons.Success className="w-4 h-4" />}
            trend={{
              value: Math.round((statistics.active_students / statistics.total_students) * 100),
              isPositive: true,
            }}
            subtitle="Tỉ lệ hiện diện"
            color="emerald"
            className="shadow-xs"
          />

          <StatCard
            label="Lưu trữ"
            value={statistics.inactive_students}
            icon={<Icons.Error className="w-4 h-4" />}
            trend={{ value: 0, isPositive: false }}
            subtitle="Hồ sơ tạm ngưng"
            color="slate"
            className="shadow-xs"
          />

          <StatCard
            label="Khối đào tạo"
            value={Object.keys(statistics.by_grade || {}).length}
            icon={<Icons.Classes className="w-4 h-4" />}
            trend={{ value: 0, isPositive: true }}
            subtitle="Các cấp độ học thuật"
            color="amber"
            className="shadow-xs"
          />
        </div>
      </div>
    );
  };

  if (loading && students.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 relative z-10">
        <div className="mb-6">
          <div className="h-10 w-48 bg-muted/20 dark:bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-6 w-96 bg-muted/20 dark:bg-white/10 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        <Card className="mb-6">
          <div className="h-12 bg-muted/20 dark:bg-white/10 rounded animate-pulse" />
        </Card>

        <Card>
          <SkeletonTable rows={10} columns={6} />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-3 sm:py-6 px-2.5 sm:px-6 lg:px-8 relative overflow-x-hidden animate-in fade-in duration-700">
      <div className="max-w-[1600px] mx-auto space-y-3 sm:space-y-4">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* ── ULTRA-COMPACT UNIFIED CONTROL HEADER ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-3 sm:p-4 shadow-xs space-y-3">
          {/* Row 1: Title + Counter + Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Title & Count */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                <Icons.Students className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white leading-none whitespace-nowrap">
                  Quản lý Học sinh
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold whitespace-nowrap">
                  {data?.total !== undefined ? data.total : students.length} hồ sơ
                </span>
                {loading && (
                  <span className="text-[10px] font-bold text-amber-500 animate-pulse uppercase ml-1 hidden sm:inline-block">
                    ● Đang tải
                  </span>
                )}
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* View Mode Toggle (Table / Grid) */}
              <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                    viewMode === 'table'
                      ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  )}
                  title="Chế độ xem bảng chi tiết"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  )}
                  title="Chế độ xem thẻ học sinh"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Thẻ</span>
                </button>
              </div>

              <PermissionGuard permissions="students.create">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold shadow-xs cursor-pointer whitespace-nowrap"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Thêm học sinh
                </Button>
              </PermissionGuard>

              <PermissionGuard permissions="students.import">
                <Link href="/dashboard/students/bulk" className="hidden sm:inline-block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl px-2.5 py-1.5 text-xs font-semibold border-stone-200 dark:border-white/10"
                  >
                    Tạo hàng loạt
                  </Button>
                </Link>
              </PermissionGuard>

              {/* Filter Toggle */}
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={cn(
                  'p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                  showFilters || filters.gradeLevel || filters.status || filters.gender
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-amber-400'
                )}
                title="Lọc nâng cao"
              >
                <Icons.Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bộ lọc</span>
                {(filters.gradeLevel || filters.status || filters.gender) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>

              <PermissionGuard permissions="reports.export">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={students.length === 0}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-semibold border border-stone-200 dark:border-white/10 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Trích xuất file CSV"
                >
                  <Icons.Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Xuất CSV</span>
                </button>
              </PermissionGuard>

              {/* Bulk Archive button */}
              {selectedIds.size > 0 && (
                <PermissionGuard permissions="students.delete">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleBulkArchive}
                    isLoading={archiving}
                    className="rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <Icons.Archive className="w-3.5 h-3.5 mr-1" />
                    <span>({selectedIds.size})</span>
                  </Button>
                </PermissionGuard>
              )}
            </div>
          </div>

          {/* Row 2: Search Bar + Refresh */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
            <div className="relative flex-1">
              <Icons.Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã UID/CID hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-semibold border border-stone-200 dark:border-white/10 flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Làm mới dữ liệu"
            >
              <Icons.Refresh className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>

          {/* Row 3: Swipeable Quick Chips for Grade Level & Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, gradeLevel: '' })}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer whitespace-nowrap shrink-0',
                !filters.gradeLevel
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-amber-400'
              )}
            >
              Tất cả khối
            </button>
            {[6, 7, 8, 9, 10, 11, 12].map((g) => {
              const grade = `Lớp ${g}`;
              const isSelected = filters.gradeLevel === grade;
              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setFilters({ ...filters, gradeLevel: isSelected ? '' : grade })}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer whitespace-nowrap shrink-0',
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-amber-400'
                  )}
                >
                  {grade}
                </button>
              );
            })}
          </div>

          {/* Row 4 (Collapsible): Advanced Status & Gender filter panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-white/5 animate-fade-in">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Trạng thái: Tất cả</option>
                <option value="active">Đang học tập</option>
                <option value="inactive">Đã nghỉ học</option>
                <option value="graduated">Đã tốt nghiệp</option>
                <option value="suspended">Đang đình chỉ</option>
              </select>

              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Giới tính: Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>

              {(filters.gradeLevel || filters.status || filters.gender) && (
                <button
                  type="button"
                  onClick={() => setFilters({ gradeLevel: '', status: '', gender: '' })}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Statistics */}
        {renderStatistics()}

        {/* Error State */}
        {error && (
          <Card className="mb-4 border-red-500">
            <div className="text-red-600">
              <p className="font-semibold">Lỗi khi tải danh sách học sinh</p>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" onClick={refetch} className="mt-3">
                Thử lại
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && students.length === 0 && !error && (
          <EmptyState
            icon={<Icons.Students className="w-12 h-12 text-gray-400" />}
            title="Không tìm thấy học sinh nào"
            description={
              debouncedSearch
                ? 'Hãy thử điều chỉnh từ khóa tìm kiếm'
                : 'Bắt đầu bằng cách nhập hoặc thêm học sinh'
            }
            action={
              <div className="flex gap-2">
                <Link href={routes.students.import()}>
                  <Button variant="primary">Nhập học sinh</Button>
                </Link>
                {debouncedSearch && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>
            }
          />
        )}

        {/* Students List (Mobile Cards & Desktop Table) */}
        {students.length > 0 && (
          <>
            <MobileStudentList
              students={students}
              onEdit={setEditingStudent}
              onArchive={handleArchiveOne}
              selectedIds={selectedIds}
              onSelect={handleSelectOne}
              hasAdminAccess={hasAdminAccess}
              onViewDetails={(student) => {
                setSelectedStudentForDrawer(student);
                setShowDrawer(true);
              }}
            />
            {/* Desktop & Tablet: Grid Cards or Table View */}
            <div className="hidden md:block">
              {viewMode === 'grid' ? (
                <StudentGridView
                  students={students}
                  onEdit={setEditingStudent}
                  onArchive={handleArchiveOne}
                  selectedIds={selectedIds}
                  onSelect={handleSelectOne}
                  hasAdminAccess={hasAdminAccess}
                  onViewDetails={(student) => {
                    setSelectedStudentForDrawer(student);
                    setShowDrawer(true);
                  }}
                  onToggleStatus={handleInlineStatusToggle}
                />
              ) : (
                <Card
                  padding="none"
                  className="rounded-2xl overflow-hidden border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-900 shadow-xs p-0"
                >
                  <div className="overflow-x-auto">
                    <Table
                      data={students}
                      keyExtractor={(student) => student.id}
                      onRowClick={(student) => {
                        setSelectedStudentForDrawer(student);
                        setShowDrawer(true);
                      }}
                      rowClassName={(student) =>
                        cn(
                          'transition-all duration-150 hover:bg-stone-50/80 dark:hover:bg-white/[0.02] cursor-pointer',
                          student.status !== 'active' &&
                            'opacity-60 bg-stone-50/30 dark:bg-stone-950/20'
                        )
                      }
                      columns={[
                        {
                          key: 'select',
                          header: (
                            <input
                              type="checkbox"
                              checked={students.length > 0 && selectedIds.size === students.length}
                              onChange={handleSelectAll}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-stone-300 dark:border-stone-700 text-amber-600 focus:ring-amber-500 bg-transparent cursor-pointer"
                            />
                          ) as any,
                          width: '45px',
                          render: (student) => (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(student.id)}
                              onChange={(e) => {
                                const next = new Set(selectedIds);
                                if (e.target.checked) {
                                  next.add(student.id);
                                } else {
                                  next.delete(student.id);
                                }
                                setSelectedIds(next);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-stone-300 dark:border-stone-700 text-amber-600 focus:ring-amber-500 bg-transparent cursor-pointer"
                            />
                          ),
                        },
                        {
                          key: 'full_name',
                          header: 'Học sinh',
                          render: (student) => {
                            const displayName = getStudentDisplayName(student);
                            const initial = (displayName.charAt(0) || 'H').toUpperCase();
                            return (
                              <div className="flex items-center gap-2.5 py-1">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 uppercase">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      'font-bold tracking-tight text-xs transition-colors hover:text-amber-500 truncate',
                                      student.status !== 'active'
                                        ? 'text-stone-400 dark:text-stone-500 line-through'
                                        : 'text-stone-900 dark:text-white'
                                    )}
                                  >
                                    {displayName}
                                  </p>
                                  <p className="text-[11px] text-stone-400 font-normal truncate">
                                    {student.email || 'Chưa có email'}
                                  </p>
                                </div>
                              </div>
                            );
                          },
                        },
                        {
                          key: 'student_code',
                          header: 'Mã UID',
                          render: (student) => (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(student.student_code || '', 'UID');
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Click sao chép UID"
                            >
                              <span>{student.student_code || '—'}</span>
                              <Copy className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ),
                        },
                        {
                          key: 'student_id',
                          header: 'Mã CID',
                          render: (student) => (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(student.student_id || '', 'CID');
                              }}
                              className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Click sao chép CID"
                            >
                              <span>{student.student_id || '—'}</span>
                              <Copy className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ),
                        },
                        {
                          key: 'grade_level',
                          header: 'Khối lớp',
                          render: (student) => (
                            <DropdownMenu
                              trigger={
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-pointer active:scale-95 transition-all px-2.5 py-1 rounded-lg border border-stone-200 dark:border-white/10 font-bold text-xs bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-400"
                                  title="Click đổi khối lớp nhanh"
                                >
                                  {student.grade_level || 'Chưa xếp khối'}
                                </button>
                              }
                            >
                              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                                <DropdownItem
                                  key={g}
                                  onClick={() => handleInlineGradeUpdate(student, `Lớp ${g}`)}
                                  className="font-bold py-1.5 text-xs cursor-pointer"
                                >
                                  Lớp {g}
                                </DropdownItem>
                              ))}
                            </DropdownMenu>
                          ),
                        },
                        {
                          key: 'phone',
                          header: 'Liên hệ',
                          render: (student) => {
                            if (!student.phone) {
                              return <span className="text-stone-400 text-xs">—</span>;
                            }
                            const cleanPhone = student.phone.replace(/[^0-9+]/g, '');
                            return (
                              <div
                                className="flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a
                                  href={`tel:${student.phone}`}
                                  className="text-stone-800 dark:text-stone-200 text-xs font-semibold hover:text-blue-500 transition-colors flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-blue-500" />
                                  <span>{student.phone}</span>
                                </a>
                                <a
                                  href={`https://zalo.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase hover:bg-blue-500/20 transition-all"
                                  title="Nhắn tin Zalo"
                                >
                                  Zalo
                                </a>
                              </div>
                            );
                          },
                        },
                        {
                          key: 'status',
                          header: 'Trạng thái',
                          render: (student) => {
                            const isActive = student.status === 'active';
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInlineStatusToggle(student);
                                }}
                                className={cn(
                                  'cursor-pointer active:scale-95 transition-all px-2.5 py-0.5 rounded-full font-semibold text-[10px]',
                                  isActive
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-white/10 hover:bg-stone-200'
                                )}
                                title="Click để chuyển trạng thái"
                              >
                                {isActive ? 'Đang học' : 'Lưu trữ'}
                              </button>
                            );
                          },
                        },
                        {
                          key: 'actions',
                          header: 'Thao tác',
                          render: (student) => (
                            <div
                              className="flex justify-end items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/dashboard/students/${student.id}`}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-white/10 dark:hover:text-white transition-all"
                                title="Xem hồ sơ chi tiết"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/dashboard/students/${student.id}/transcript`}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all"
                                title="Bảng điểm học sinh"
                              >
                                <Award className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setEditingStudent(student)}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                <Icons.Edit className="w-4 h-4" />
                              </button>
                              {hasAdminAccess && (
                                <button
                                  type="button"
                                  onClick={() => handleArchiveOne(student)}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                  title="Lưu trữ học sinh"
                                >
                                  <Icons.Archive className="w-4 h-4" />
                                </button>
                              )}
                              <StudentQuickActions
                                studentId={student.id}
                                studentName={student.full_name}
                              />
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={pagination.prevPage}
              disabled={!pagination.hasPrevPage || loading}
            >
              Trước
            </Button>

            <span className="text-sm text-slate-600">
              Trang {pagination.page} của {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage || loading}
            >
              Tiếp theo
            </Button>
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1150] w-auto max-w-[95vw] animate-slide-in-bottom">
            <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-full px-5 py-2.5 flex items-center gap-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-stone-200 dark:border-stone-700">
              {/* Counter Badge */}
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shrink-0 animate-pulse" />
                <span className="text-xs font-bold whitespace-nowrap text-stone-800 dark:text-stone-100">
                  Đã chọn{' '}
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                    {selectedIds.size}
                  </span>{' '}
                  học sinh
                </span>
              </div>

              <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 shrink-0" />

              {/* Action Buttons in single clean row */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-8 px-3.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Icons.Download className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                  <span>Xuất CSV</span>
                </button>

                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkGradeUpdate(e.target.value);
                        e.target.value = ''; // reset
                      }
                    }}
                    className="h-8 pl-3.5 pr-8 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-full outline-none cursor-pointer appearance-none whitespace-nowrap transition-colors"
                  >
                    <option
                      value=""
                      className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                    >
                      Đổi khối lớp
                    </option>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option
                        key={g}
                        value={`Lớp ${g}`}
                        className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                      >
                        Lớp {g}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={handleBulkArchive}
                  className="h-8 px-3.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap border border-red-600"
                >
                  <Icons.Delete className="w-3.5 h-3.5 text-white" />
                  <span>Lưu trữ</span>
                </button>

                <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 shrink-0" />

                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="h-8 px-3 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                  title="Hủy chọn tất cả"
                >
                  <Icons.Error className="w-3.5 h-3.5 text-stone-500" />
                  <span>Bỏ chọn</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Sliding Drawer Panel */}
        <StudentDrawer
          student={selectedStudentForDrawer}
          isOpen={showDrawer}
          onClose={() => {
            setShowDrawer(false);
            setSelectedStudentForDrawer(null);
          }}
          onEdit={(student) => {
            setEditingStudent(student);
          }}
          handleToggleStatus={handleInlineStatusToggle}
          onArchive={handleArchiveOne}
        />

        {/* Unified User Form Modal for Students */}
        <UserFormModal
          isOpen={showAddModal || Boolean(editingStudent)}
          user={editingStudent}
          initialRole="student"
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingStudent(null);
            refetch();
          }}
        />
      </div>
    </div>
  );
}

// Student detail drawer component sliding from the right side
interface StudentDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  handleToggleStatus: (student: Student) => Promise<void>;
  onArchive: (student: Student) => void;
}

function StudentDrawer({
  student,
  isOpen,
  onClose,
  onEdit,
  handleToggleStatus,
  onArchive,
}: StudentDrawerProps) {
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (student) {
      setActiveStudent(student);
    }
  }, [student]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !activeStudent) return null;

  const isActive = activeStudent.status === 'active';

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[99999] flex justify-end transition-all duration-300',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      {/* Backdrop with fade effect */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      {/* Panel with slide-in transition */}
      <div
        className={cn(
          'relative w-full max-w-md sm:max-w-lg bg-white dark:bg-stone-900 border-l border-stone-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-6 flex flex-col h-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0 uppercase">
              {(getStudentDisplayName(activeStudent).charAt(0) || 'H').toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white leading-tight truncate">
                {getStudentDisplayName(activeStudent)}
              </h2>
              <p className="text-xs text-stone-400 font-normal truncate mt-0.5">
                {activeStudent.email || 'Chưa cập nhật email'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0 ml-2"
            aria-label="Đóng"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable details container */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 custom-scrollbar">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 dark:bg-white/[0.02] p-3 rounded-xl border border-stone-100 dark:border-white/5">
              <span className="text-[11px] font-medium text-stone-400 block mb-1">Khối lớp</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {activeStudent.grade_level || 'Chưa phân khối'}
              </span>
            </div>
            <div className="bg-stone-50 dark:bg-white/[0.02] p-3 rounded-xl border border-stone-100 dark:border-white/5">
              <span className="text-[11px] font-medium text-stone-400 block mb-1">Trạng thái</span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                )}
              >
                {isActive
                  ? 'Đang học'
                  : activeStudent.status === 'inactive'
                    ? 'Nghỉ học'
                    : activeStudent.status || 'Khóa'}
              </span>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-white/5 pb-1.5">
              Thông tin học thuật & Định danh
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Mã truy cập (UID):</span>
                <code className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                  {activeStudent.student_code || 'Chưa cấp'}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Mã định danh (CID):</span>
                <code className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded font-mono font-bold">
                  {activeStudent.student_id || 'Chưa cấp'}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Giới tính:</span>
                <span className="text-stone-900 dark:text-white font-semibold">
                  {activeStudent.gender === 'male'
                    ? 'Nam'
                    : activeStudent.gender === 'female'
                      ? 'Nữ'
                      : 'Khác'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Ngày sinh:</span>
                <span className="text-stone-900 dark:text-white font-semibold">
                  {activeStudent.date_of_birth
                    ? new Date(activeStudent.date_of_birth).toLocaleDateString('vi-VN')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-white/5 pb-1.5">
              Thông tin liên hệ
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Số điện thoại:</span>
                {activeStudent.phone ? (
                  <a
                    href={`tel:${activeStudent.phone}`}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {activeStudent.phone}
                  </a>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-stone-500 shrink-0">Địa chỉ cư trú:</span>
                <span
                  className="text-stone-900 dark:text-white font-semibold text-right truncate"
                  title={activeStudent.address || ''}
                >
                  {activeStudent.address || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-white/5 pb-1.5">
              Hệ thống
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Ngày khởi tạo:</span>
                <span className="text-stone-800 dark:text-stone-200 font-medium">
                  {new Date(activeStudent.created_at).toLocaleDateString('vi-VN')}{' '}
                  {new Date(activeStudent.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-stone-100 dark:border-white/5 pt-4 flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                onClose();
                onEdit(activeStudent);
              }}
              size="sm"
              className="rounded-xl h-9 text-xs font-semibold"
              leftIcon={<Icons.Edit className="w-3.5 h-3.5" />}
            >
              Sửa thông tin
            </Button>
            <Link href={`/dashboard/students/${activeStudent.id}`} className="w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl h-9 text-xs font-semibold border-stone-200 dark:border-stone-800"
                leftIcon={<Icons.Users className="w-3.5 h-3.5" />}
              >
                Hồ sơ chi tiết
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <Link
              href={`/dashboard/students/${activeStudent.id}/transcript`}
              className="w-full col-span-1"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl h-8.5 text-xs font-medium border-stone-200 dark:border-stone-800 text-amber-600 hover:bg-amber-50"
                leftIcon={<Icons.Grades className="w-3.5 h-3.5" />}
              >
                Điểm số
              </Button>
            </Link>
            <Link
              href={`/dashboard/students/${activeStudent.id}/progress`}
              className="w-full col-span-1"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl h-8.5 text-xs font-medium border-stone-200 dark:border-stone-800 text-blue-600 hover:bg-blue-50"
                leftIcon={<Icons.History className="w-3.5 h-3.5" />}
              >
                Tiến độ
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await handleToggleStatus(activeStudent);
                setActiveStudent((prev) =>
                  prev
                    ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }
                    : null
                );
              }}
              className="rounded-xl h-8.5 text-xs font-medium border-stone-200 dark:border-stone-800 text-rose-600 hover:bg-rose-50"
              leftIcon={
                isActive ? (
                  <Icons.Error className="w-3.5 h-3.5" />
                ) : (
                  <Icons.Success className="w-3.5 h-3.5" />
                )
              }
            >
              {isActive ? 'Lưu trữ' : 'Kích hoạt'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

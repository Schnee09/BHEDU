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
import { StatCard } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { PageHeader } from '@/components/Breadcrumb';
import { ToastContainer } from '@/components/ui/Toast';
import { logger } from '@/lib/logger';
import { createAuditLog, AuditActions } from '@/lib/audit';
import { routes } from '@/lib/routes';
import { Copy, Check, ChevronDown } from 'lucide-react';
import MobileStudentList from '@/components/students/MobileStudentList';
import StudentQuickActions from '@/components/students/StudentQuickActions';
import { cn } from '@/lib/utils';
import { showToast } from '@/components/ToastProvider';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';

import StudentFormModal, { Student } from '@/components/students/StudentFormModal';

interface StudentStats {
  total_students: number;
  active_students: number;
  inactive_students: number;
  by_grade: Record<string, number>;
}

export default function StudentsPage() {
  const toast = useToast();
  const { user, hasAdminAccess, isTeacher: _isTeacher } = useUser();

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
  }, [error, toast]);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-stone-100 dark:bg-stone-800 rounded-3xl skeleton-shimmer"
            />
          ))}
        </div>
      );
    }

    if (!statistics) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard
          label="Tổng học sinh"
          value={statistics.total_students}
          icon={<Icons.Students className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          subtitle="Hồ sơ toàn hệ thống"
          color="blue"
          className="shadow-md"
        />

        <StatCard
          label="Đang học"
          value={statistics.active_students}
          icon={<Icons.Success className="w-5 h-5" />}
          trend={{
            value: Math.round((statistics.active_students / statistics.total_students) * 100),
            isPositive: true,
          }}
          subtitle="Tỉ lệ hiện diện"
          color="emerald"
          className="shadow-md"
        />

        <StatCard
          label="Lưu trữ"
          value={statistics.inactive_students}
          icon={<Icons.Error className="w-5 h-5" />}
          trend={{ value: 0, isPositive: false }}
          subtitle="Hồ sơ tạm ngưng"
          color="slate"
          className="shadow-md"
        />

        <StatCard
          label="Khối đào tạo"
          value={Object.keys(statistics.by_grade || {}).length}
          icon={<Icons.Classes className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          subtitle="Các cấp độ học thuật"
          color="amber"
          className="shadow-md"
        />
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 relative overflow-x-hidden animate-in fade-in duration-1000">
      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200/50 dark:border-white/5 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Quản lý <span className="text-amber-500">Học sinh</span>
              </h1>
            </div>
            <p className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] pl-4">
              Hệ thống lưu trữ và điều phối hồ sơ giáo dục
            </p>
          </div>
          <div className="flex gap-3">
            <PermissionGuard permissions="students.import">
              <Link href="/dashboard/students/bulk">
                <Button
                  variant="outline"
                  size="md"
                  className="font-black uppercase tracking-widest text-[10px]"
                >
                  Tạo hàng loạt
                </Button>
              </Link>
            </PermissionGuard>
            <PermissionGuard permissions="students.create">
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                className="font-black uppercase tracking-widest text-[10px] shadow-amber-glow"
              >
                Thêm Học sinh mới
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Statistics */}
        {renderStatistics()}

        {/* Filters and Actions */}
        <div className="flex gap-6 mb-6">
          {/* Filter Sidebar */}
          {showFilters && (
            <div className="w-72 flex-shrink-0 animate-in slide-in-from-left-4 duration-300">
              <Card className="bg-stone-50/50 dark:bg-white/5 border-stone-200/50 dark:border-white/5">
                <CardHeader
                  title="Bộ lọc chuyên sâu"
                  className="font-serif italic text-sm font-black uppercase tracking-widest text-stone-500"
                />
                <div className="space-y-6 pt-2">
                  {/* Grade Level Filter */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">
                      Khối đào tạo
                    </label>
                    <div className="relative group">
                      <select
                        value={filters.gradeLevel}
                        onChange={(e) => setFilters({ ...filters, gradeLevel: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-bold text-stone-700 dark:text-stone-200 appearance-none transition-all shadow-sm"
                      >
                        <option value="">Tất cả các lớp</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={`Lớp ${i + 1}`}>{`Lớp ${i + 1}`}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none group-hover:text-amber-500 transition-colors" />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">
                      Trạng thái hồ sơ
                    </label>
                    <div className="relative group">
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-bold text-stone-700 dark:text-stone-200 appearance-none transition-all shadow-sm"
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang học tập</option>
                        <option value="inactive">Đã nghỉ học</option>
                        <option value="graduated">Đã tốt nghiệp</option>
                        <option value="suspended">Đang đình chỉ</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none group-hover:text-amber-500 transition-colors" />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setFilters({ gradeLevel: '', status: '', gender: '' })}
                    className="font-black uppercase tracking-widest text-[10px] py-3 mt-4 border-stone-200 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5"
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Card
              padding="p-2"
              className="mb-6 bg-stone-50/50 dark:bg-white/5 border-stone-200/50 dark:border-white/10 shadow-sm"
            >
              <div className="p-2 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Truy vấn học sinh theo tên, mã hoặc email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-stone-800 dark:text-white text-sm placeholder:text-stone-400 transition-all shadow-sm"
                  />
                </div>

                <div className="flex gap-2 items-center flex-wrap">
                  <Button
                    variant="outline"
                    onClick={refetch}
                    className="h-11 px-6 font-black uppercase tracking-widest text-[10px] border-stone-200"
                    disabled={loading}
                  >
                    <Icons.Search className="w-3.5 h-3.5 mr-2" /> Làm mới
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'h-11 px-6 font-black uppercase tracking-widest text-[10px] border-stone-200',
                      showFilters && 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                    )}
                  >
                    {showFilters ? (
                      <Icons.Close className="w-3.5 h-3.5 mr-2" />
                    ) : (
                      <Icons.Filter className="w-3.5 h-3.5 mr-2" />
                    )}
                    {showFilters ? 'Ẩn bộ lọc' : 'Lọc hồ sơ'}
                  </Button>

                  <div className="h-8 w-px bg-stone-200 dark:bg-stone-800 mx-2 hidden lg:block" />

                  <PermissionGuard permissions="reports.export">
                    <Button
                      variant="success"
                      onClick={handleExportCSV}
                      className="h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-emerald-glow"
                      disabled={students.length === 0}
                    >
                      <Icons.Download className="w-3.5 h-3.5 mr-2" /> Trích xuất CSV
                    </Button>
                  </PermissionGuard>

                  <PermissionGuard permissions="students.delete">
                    {selectedIds.size > 0 && (
                      <Button
                        variant="danger"
                        onClick={handleBulkArchive}
                        isLoading={archiving}
                        className="h-11 px-6 font-black uppercase tracking-widest text-[10px]"
                      >
                        <Icons.Archive className="w-3.5 h-3.5 mr-2" /> Lưu trữ ({selectedIds.size})
                      </Button>
                    )}
                  </PermissionGuard>
                </div>
              </div>

              {/* Results info */}
              <div className="mt-3 text-sm text-slate-600 flex items-center gap-2">
                <span>
                  Hiển thị {students.length} trong tổng số {data?.total || 0} học sinh
                </span>
                {selectedIds.size > 0 && (
                  <>
                    <span>•</span>
                    <Badge variant="info">{selectedIds.size} đã chọn</Badge>
                  </>
                )}
                {(filters.gradeLevel || filters.status || filters.gender) && (
                  <>
                    <span>•</span>
                    <Badge variant="warning">Bộ lọc đang hoạt động</Badge>
                  </>
                )}
              </div>
            </Card>

            {/* Error State */}
            {error && (
              <Card className="mb-6 border-red-500">
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

            {/* Students Table */}
            {students.length > 0 && (
              <>
                <MobileStudentList
                  students={students}
                  onEdit={setEditingStudent}
                  onArchive={handleArchiveOne}
                  selectedIds={selectedIds}
                  onSelect={handleSelectOne}
                  hasAdminAccess={hasAdminAccess}
                />
                <div className="hidden md:block">
                  <Card
                    padding="none"
                    className="rounded-[2.5rem] overflow-hidden border-none shadow-ultra glass-crystal p-0"
                  >
                    <Table
                      data={students}
                      keyExtractor={(student) => student.id}
                      onRowClick={(student) => {
                        setSelectedStudentForDrawer(student);
                        setShowDrawer(true);
                      }}
                      rowClassName={(student) =>
                        cn(
                          'transition-all duration-200',
                          student.status !== 'active' &&
                            'opacity-65 saturate-50 bg-red-500/[0.01] border-l-4 border-red-500/50'
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
                              className="w-4.5 h-4.5 rounded-lg border-stone-300 dark:border-stone-700 text-amber-600 focus:ring-amber-500 bg-transparent cursor-pointer"
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
                              className="w-4.5 h-4.5 rounded-lg border-stone-300 dark:border-stone-700 text-amber-600 focus:ring-amber-500 bg-transparent cursor-pointer"
                            />
                          ),
                        },
                        {
                          key: 'full_name',
                          header: 'HỌC SINH',
                          render: (student) => (
                            <div className="flex items-center gap-4 py-2">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-100 to-stone-50 dark:from-white/5 dark:to-white/2 flex items-center justify-center font-bold text-stone-400 border border-stone-100 dark:border-white/5 group-hover:scale-105 transition-transform">
                                {student.full_name?.charAt(0)}
                              </div>
                              <div>
                                <p
                                  className={cn(
                                    'font-bold tracking-tight transition-all',
                                    student.status !== 'active'
                                      ? 'text-stone-400 dark:text-stone-500 line-through'
                                      : 'text-stone-900 dark:text-white'
                                  )}
                                >
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-stone-400 font-medium">
                                  {student.email || '—'}
                                </p>
                              </div>
                            </div>
                          ),
                        },
                        {
                          key: 'student_code',
                          header: 'UID (MÃ TRUY CẬP)',
                          render: (student) => (
                            <span className="text-stone-600 dark:text-stone-400 font-mono text-xs font-bold bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded border border-stone-200/50 dark:border-white/10">
                              {student.student_code || '-'}
                            </span>
                          ),
                        },
                        {
                          key: 'student_id',
                          header: 'CID (MÃ ĐỊNH DANH)',
                          render: (student) => (
                            <span className="text-amber-600 dark:text-amber-400 font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500/5 border border-amber-500/10">
                              {student.student_id || '-'}
                            </span>
                          ),
                        },
                        {
                          key: 'grade_level',
                          header: 'KHỐI LỚP',
                          render: (student) => (
                            <DropdownMenu
                              trigger={
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-pointer active:scale-95 transition-all px-2.5 py-1 rounded-full border-none shadow-sm font-bold text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                                  title="Click để đổi khối lớp nhanh"
                                >
                                  {student.grade_level || 'Chưa xếp lớp'}
                                </button>
                              }
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                                <DropdownItem
                                  key={g}
                                  onClick={() => handleInlineGradeUpdate(student, `Lớp ${g}`)}
                                  className="font-bold py-2 text-xs"
                                >
                                  Lớp {g}
                                </DropdownItem>
                              ))}
                            </DropdownMenu>
                          ),
                        },
                        {
                          key: 'phone',
                          header: 'SỐ ĐIỆN THOẠI',
                          render: (student) => (
                            <span className="text-stone-700 dark:text-stone-300 text-xs font-bold">
                              {student.phone || '-'}
                            </span>
                          ),
                        },
                        {
                          key: 'status',
                          header: 'TRẠNG THÁI',
                          render: (student) => {
                            const isActive = student.status === 'active';
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInlineStatusToggle(student);
                                }}
                                className={cn(
                                  'cursor-pointer active:scale-95 transition-all px-3 py-1 rounded-full border-none shadow-sm font-bold text-xs ring-1 ring-stone-900/5 dark:ring-white/10',
                                  isActive
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                                )}
                                title="Click để đổi nhanh trạng thái"
                              >
                                {isActive
                                  ? 'Đang học'
                                  : student.status === 'inactive'
                                    ? 'Nghỉ học'
                                    : student.status || 'Khóa'}
                              </button>
                            );
                          },
                        },
                        {
                          key: 'created_at',
                          header: 'NGÀY THAM GIA',
                          render: (student) => (
                            <span className="text-stone-500 dark:text-stone-500 text-[10px] font-black uppercase tracking-widest">
                              {new Date(student.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          ),
                        },
                        {
                          key: 'actions',
                          header: '',
                          render: (student) => (
                            <div
                              className="flex justify-end items-center gap-1.5 pr-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200 mr-2">
                                <button
                                  onClick={() => setEditingStudent(student)}
                                  className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-amber-600 flex items-center justify-center border border-stone-200/50 dark:border-white/5 active:scale-90 transition-all"
                                  title="Chỉnh sửa hồ sơ"
                                >
                                  <Icons.Edit className="w-4 h-4" />
                                </button>
                                <Link
                                  href={`/dashboard/students/${student.id}/transcript`}
                                  className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-blue-500 flex items-center justify-center border border-stone-200/50 dark:border-white/5 active:scale-90 transition-all"
                                  title="Xem bảng điểm"
                                >
                                  <Icons.Grades className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleInlineStatusToggle(student)}
                                  className={cn(
                                    'w-8 h-8 rounded-xl bg-stone-50 dark:bg-white/5 flex items-center justify-center border border-stone-200/50 dark:border-white/5 active:scale-90 transition-all',
                                    student.status === 'active'
                                      ? 'text-stone-600 dark:text-stone-400 hover:text-red-500'
                                      : 'text-red-500 hover:text-emerald-500'
                                  )}
                                  title={student.status === 'active' ? 'Lưu trữ' : 'Kích hoạt'}
                                >
                                  {student.status === 'active' ? (
                                    <Icons.Error className="w-4 h-4" />
                                  ) : (
                                    <Icons.Success className="w-4 h-4" />
                                  )}
                                </button>
                              </div>

                              <StudentQuickActions
                                studentId={student.id}
                                studentName={student.full_name}
                              />
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Card>
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
          </div>
        </div>

        {/* Add/Edit Student Modal */}
        <StudentFormModal
          isOpen={showAddModal || editingStudent !== null}
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
          student={editingStudent}
          onSuccess={() => {
            refetch();
            setShowAddModal(false);
            setEditingStudent(null);
            toast.success(
              editingStudent ? 'Student updated' : 'Student added',
              editingStudent
                ? 'Student information has been updated successfully.'
                : 'New student has been added successfully.'
            );
          }}
        />

        {/* Floating Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1150] bg-stone-900 dark:bg-stone-950 text-white rounded-3xl px-8 py-4 flex flex-col sm:flex-row items-center gap-6 shadow-2xl shadow-black/40 border border-stone-800 dark:border-stone-850 animate-slide-in-bottom">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold tracking-tight">
                Đã chọn {selectedIds.size} học sinh
              </span>
            </div>
            <div className="h-px w-full sm:h-5 sm:w-px bg-stone-800 dark:bg-stone-850" />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="h-10 px-4 text-xs font-black uppercase tracking-widest text-white border-stone-800 hover:bg-stone-900 rounded-xl"
              >
                Trích xuất CSV
              </Button>

              <div className="relative group">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkGradeUpdate(e.target.value);
                      e.target.value = ''; // reset
                    }
                  }}
                  className="h-10 px-4 pr-8 text-xs font-black uppercase tracking-widest bg-transparent hover:bg-stone-900 text-white border border-stone-800 rounded-xl outline-none cursor-pointer appearance-none"
                >
                  <option value="" className="bg-stone-900 text-white">
                    Chuyển khối lớp
                  </option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={`Lớp ${g}`} className="bg-stone-900 text-white">
                      Lớp {g}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
              </div>

              <Button
                variant="danger"
                onClick={handleBulkArchive}
                className="h-10 px-4 text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-xl border-none shadow-md"
              >
                Lưu trữ hồ sơ
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="h-10 px-4 text-xs font-black uppercase tracking-widest text-stone-400 hover:text-white rounded-xl"
              >
                Bỏ chọn
              </Button>
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

  useEffect(() => {
    if (student) {
      setActiveStudent(student);
    }
  }, [student]);

  if (!activeStudent) return null;

  const isActive = activeStudent.status === 'active';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[1200] flex justify-end transition-all duration-300',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      {/* Backdrop with fade effect */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      {/* Panel with slide-in transition */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-white dark:bg-[#1C1917] border-l border-stone-200 dark:border-stone-800 shadow-2xl p-8 sm:p-10 flex flex-col h-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-stone-100 dark:border-white/5 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-serif text-3xl font-black shadow-lg shadow-amber-500/20">
              {activeStudent.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                {activeStudent.full_name}
              </h2>
              <p className="text-sm text-stone-400 font-medium">
                {activeStudent.email || 'Không có email'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-all duration-200"
            aria-label="Đóng"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable details container */}
        <div className="flex-1 overflow-y-auto py-8 space-y-8 pr-2 custom-scrollbar">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-stone-100 dark:border-white/5">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                Khối lớp
              </span>
              <Badge variant="info" className="font-bold text-xs">
                {activeStudent.grade_level || 'Chưa phân khối'}
              </Badge>
            </div>
            <div className="bg-stone-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-stone-100 dark:border-white/5">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                Trạng thái
              </span>
              <Badge variant={isActive ? 'success' : 'default'} className="font-bold text-xs">
                {isActive
                  ? 'Đang học'
                  : activeStudent.status === 'inactive'
                    ? 'Nghỉ học'
                    : activeStudent.status || 'Khóa'}
              </Badge>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-white/5 pb-2">
              Thông tin học thuật & Định danh
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Mã truy cập (UID):</span>
                <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold text-sm">
                  {activeStudent.student_code || 'Chưa cấp'}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Mã định danh (CID):</span>
                <code className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded font-mono font-bold text-sm">
                  {activeStudent.student_id || 'Chưa cấp'}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Giới tính:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold">
                  {activeStudent.gender === 'male'
                    ? 'Nam'
                    : activeStudent.gender === 'female'
                      ? 'Nữ'
                      : 'Khác'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Ngày sinh:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold">
                  {activeStudent.date_of_birth
                    ? new Date(activeStudent.date_of_birth).toLocaleDateString('vi-VN')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-white/5 pb-2">
              Thông tin liên hệ
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Số điện thoại:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold">
                  {activeStudent.phone || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Địa chỉ cư trú:</span>
                <span
                  className="text-sm text-stone-900 dark:text-white font-bold text-right truncate max-w-[200px]"
                  title={activeStudent.address || ''}
                >
                  {activeStudent.address || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-white/5 pb-2">
              Hệ thống
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Ngày tham gia hệ thống:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold text-right">
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
        <div className="border-t border-stone-100 dark:border-white/5 pt-6 flex flex-col gap-3 shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                onClose();
                onEdit(activeStudent);
              }}
              className="rounded-xl h-12 text-xs font-black uppercase tracking-widest shadow-amber-glow"
              leftIcon={<Icons.Edit className="w-4 h-4" />}
            >
              Sửa thông tin
            </Button>
            <Link href={`/dashboard/students/${activeStudent.id}`} className="w-full">
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 text-xs font-black uppercase tracking-widest border-stone-200 dark:border-stone-850"
                leftIcon={<Icons.Users className="w-4 h-4" />}
              >
                Hồ sơ chi tiết
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href={`/dashboard/students/${activeStudent.id}/transcript`}
              className="w-full col-span-1"
            >
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 text-xs font-black uppercase tracking-widest border-stone-200 dark:border-stone-850 text-amber-600"
                leftIcon={<Icons.Grades className="w-4 h-4" />}
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
                className="w-full rounded-xl h-12 text-xs font-black uppercase tracking-widest border-stone-200 dark:border-stone-850 text-blue-600"
                leftIcon={<Icons.History className="w-4 h-4" />}
              >
                Tiến độ
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                await handleToggleStatus(activeStudent);
                setActiveStudent((prev) =>
                  prev
                    ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }
                    : null
                );
              }}
              className="rounded-xl h-12 text-xs font-black uppercase tracking-widest border-stone-200 dark:border-stone-850 text-red-500"
              leftIcon={
                isActive ? (
                  <Icons.Error className="w-4 h-4" />
                ) : (
                  <Icons.Success className="w-4 h-4" />
                )
              }
            >
              {isActive ? 'Lưu trữ' : 'Kích hoạt'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

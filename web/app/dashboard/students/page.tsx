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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFetch, useMutation, usePagination, useDebounce, useToast, useUser } from "@/hooks";
import { apiFetch, bulkArchiveStudents, deleteStudent } from "@/lib/api/client";
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
} from "@/components/ui";
import { PermissionGuard } from "@/hooks/usePermissions";
import { StatCard } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { PageHeader } from "@/components/Breadcrumb";
import { ToastContainer } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { routes } from "@/lib/routes";
import { Copy, Check, ChevronDown } from "lucide-react";
import MobileStudentList from "@/components/students/MobileStudentList";
import StudentQuickActions from "@/components/students/StudentQuickActions";
import { cn } from "@/lib/utils";

import StudentFormModal, { Student } from "@/components/students/StudentFormModal";

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
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Filters
  const [filters, setFilters] = useState({
    gradeLevel: '',
    status: '',
    gender: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Pagination
  const pagination = usePagination({ initialPage: 1, initialLimit: 50 });

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch students with pagination and search
  const queryParams = new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    search: debouncedSearch,
    ...(filters.gradeLevel && { grade_level: filters.gradeLevel }),
    ...(filters.status && { status: filters.status }),
    ...(filters.gender && { gender: filters.gender })
  });

  // Option A routing model: /dashboard/* pages are role-aware.
  // Fetch from the role-aware route; server will return the right scope
  // (admin: all students, others: permitted subset).
  const { data, loading, error, refetch } = useFetch<{
    students: Student[];
    total: number;
    statistics?: StudentStats;
  }>(
    `/api/students?${queryParams.toString()}`
  );

  // Handle successful fetch
  const { setTotalItems } = pagination;
  useEffect(() => {
    if (data) {
      const studentsData = data.students || (data as any).data || [];
      const totalCount = data.total !== undefined ? data.total : (data as any).pagination?.total || 0;

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
      setSelectedIds(new Set(students.map(s => s.id)));
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

    if (!confirm(`Archive ${selectedIds.size} student(s)? This will set their status to inactive.`)) {
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
      logger.error('Bulk archive error', error instanceof Error ? error : new Error(String(error)), { originalError: String(error) });
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

  // Export CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.warning('No data', 'No students to export');
      return;
    }

    const studentsToExport = selectedIds.size > 0
      ? students.filter(s => selectedIds.has(s.id))
      : students;

    // Create CSV content
    const headers = ["Họ và tên", "UID (Mã truy cập)", "CID (Mã định danh)", "Email", "Số điện thoại", "Ngày sinh", "Khối lớp", "Trạng thái", "Ngày tham gia"];
    const rows = studentsToExport.map(s => [
      s.full_name,
      s.student_code || "",
      s.student_id || "",
      s.email || "",
      s.phone || "",
      s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('vi-VN') : "",
      s.grade_level || "",
      s.status || "active",
      new Date(s.created_at).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
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
            <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800 rounded-3xl skeleton-shimmer" />
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
          trend={{ value: Math.round((statistics.active_students / statistics.total_students) * 100), isPositive: true }}
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
                <Button variant="outline" size="md" className="font-black uppercase tracking-widest text-[10px]">
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
                <CardHeader title="Bộ lọc chuyên sâu" className="font-serif italic text-sm font-black uppercase tracking-widest text-stone-500" />
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
          <div className="flex-1">
            <Card padding="p-2" className="mb-6 bg-stone-50/50 dark:bg-white/5 border-stone-200/50 dark:border-white/10 shadow-sm">
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
                      "h-11 px-6 font-black uppercase tracking-widest text-[10px] border-stone-200",
                      showFilters && "bg-amber-500/10 border-amber-500/30 text-amber-600"
                    )}
                  >
                    {showFilters ? <Icons.Close className="w-3.5 h-3.5 mr-2" /> : <Icons.Filter className="w-3.5 h-3.5 mr-2" />}
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
                <span>Hiển thị {students.length} trong tổng số {data?.total || 0} học sinh</span>
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
                    ? "Hãy thử điều chỉnh từ khóa tìm kiếm"
                    : "Bắt đầu bằng cách nhập hoặc thêm học sinh"
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
                  <Card padding="none">
                    <Table
                      data={students}
                      keyExtractor={(student) => student.id}
                      columns={[
                        {
                          key: 'select',
                          header: (
                            <input
                              type="checkbox"
                              checked={students.length > 0 && selectedIds.size === students.length}
                              onChange={handleSelectAll}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                            />
                          ) as any,
                          width: '40px',
                          render: (student) => (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(student.id)}
                              onChange={() => handleSelectOne(student.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                            />
                          ),
                        },
                        {
                          key: 'full_name',
                          header: 'Tên',
                          render: (student) => (
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {student.full_name}
                            </Link>
                          ),
                        },
                        {
                          key: 'student_code',
                          header: 'UID (Mã truy cập)',
                          render: (student) => (
                            <span className="text-stone-600 dark:text-stone-400 font-mono text-xs font-bold bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded border border-stone-200/50 dark:border-white/10">
                              {student.student_code || '-'}
                            </span>
                          ),
                        },
                        {
                          key: 'student_id',
                          header: 'CID (Mã định danh)',
                          render: (student) => (
                            <span className="text-amber-600 dark:text-amber-400 font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500/5 border border-amber-500/10">
                              {student.student_id || '-'}
                            </span>
                          ),
                        },
                        {
                          key: 'email',
                          header: 'Địa chỉ Email',
                          render: (student) => (
                            <span className="text-stone-600 dark:text-stone-400 text-xs font-medium">{student.email || '-'}</span>
                          ),
                        },
                        {
                          key: 'grade_level',
                          header: 'Khối lớp',
                          render: (student) => (
                            student.grade_level ? (
                              <Badge variant="info" className="font-black text-[10px] uppercase tracking-widest">{student.grade_level}</Badge>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )
                          ),
                        },
                        {
                          key: 'phone',
                          header: 'Số điện thoại',
                          render: (student) => (
                            <span className="text-stone-700 dark:text-stone-300 text-xs font-bold">{student.phone || '-'}</span>
                          ),
                        },
                        {
                          key: 'status',
                          header: 'Trạng thái',
                          render: (student) => (
                            <Badge 
                              variant={student.status === 'active' ? 'success' : 'default'}
                              className="font-black text-[10px] uppercase tracking-widest"
                            >
                              {student.status === 'active' ? 'Đang học' : student.status || 'Hồ sơ'}
                            </Badge>
                          ),
                        },
                        {
                          key: 'created_at',
                          header: 'Ngày gia nhập',
                          render: (student) => (
                            <span className="text-stone-500 dark:text-stone-500 text-[10px] font-black uppercase tracking-widest">
                              {new Date(student.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          ),
                        },
                        {
                          key: 'actions',
                          header: '',
                          width: '60px',
                          render: (student) => (
                            <div className="flex justify-end pr-4">
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
              editingStudent ? 'Student information has been updated successfully.' : 'New student has been added successfully.'
            );
          }}
        />
      </div>
    </div>
  );
}

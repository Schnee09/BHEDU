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
  Modal
} from "@/components/ui";
import { StatCard } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { PageHeader } from "@/components/Breadcrumb";
import { ToastContainer } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { routes } from "@/lib/routes";
import { Copy, Check } from "lucide-react";
import MobileStudentList from "@/components/students/MobileStudentList";

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  student_code?: string;
  grade_level?: string;
  status?: string;
  gender?: string;
  created_at: string;
}

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
    `/api/v2/students?${queryParams.toString()}`
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
  const { mutate: archiveStudent, loading: archiving } = useMutation('/api/v2/students', 'DELETE');

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
    const headers = ["ID", "Full Name", "Email", "Phone", "Date of Birth", "Grade", "Status", "Joined"];
    const rows = studentsToExport.map(s => [
      s.id,
      s.full_name,
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-stone-100 dark:bg-stone-800 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      );
    }

    if (!statistics) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
        <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-4 border border-stone-100 dark:border-[#2C2420] shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group press-effect">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
            <Icons.Students className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Học sinh</p>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-100">{statistics.total_students}</p>
          <div className="h-1 w-6 bg-blue-500 rounded-full" />
        </div>

        <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-4 border border-stone-100 dark:border-[#2C2420] shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group press-effect">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
            <Icons.Success className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Đang học</p>
          <p className="text-2xl font-black text-green-600">{statistics.active_students}</p>
          <div className="h-1 w-6 bg-green-500 rounded-full" />
        </div>

        <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-4 border border-stone-100 dark:border-[#2C2420] shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group press-effect">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
            <Icons.Error className="w-10 h-10 text-stone-400" />
          </div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nghỉ học</p>
          <p className="text-2xl font-black text-stone-400">{statistics.inactive_students}</p>
          <div className="h-1 w-6 bg-stone-300 rounded-full" />
        </div>

        <div className="bg-white dark:bg-[#1C1814] rounded-2xl p-4 border border-amber-500/20 shadow-lg shadow-amber-500/5 flex flex-col justify-between h-28 relative overflow-hidden group press-effect">
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
            <Icons.Classes className="w-10 h-10 text-amber-500" />
          </div>
          <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Khối lớp</p>
          <p className="text-2xl font-black text-amber-500">{Object.keys(statistics.by_grade || {}).length}</p>
          <div className="h-1 w-10 bg-amber-500 rounded-full" />
        </div>
      </div>
    );
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Header with Breadcrumb */}
        <PageHeader
          title="Học sinh"
          description="Quản lý hồ sơ và thông tin học sinh"
          action={
            <div className="flex gap-2">
              <Link href="/dashboard/students/bulk">
                <Button variant="outline" leftIcon={<Icons.Upload className="w-4 h-4" />}>
                  Bulk Create
                </Button>
              </Link>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                leftIcon={<Icons.Add className="w-4 h-4" />}
              >
                Thêm Học sinh
              </Button>
            </div>
          }
        />

        {/* Statistics */}
        {renderStatistics()}

        {/* Filters and Actions */}
        <div className="flex gap-6 mb-6">
          {/* Filter Sidebar */}
          {showFilters && (
            <Card className="w-64 flex-shrink-0">
              <CardHeader title="Bộ lọc" />
              <div className="space-y-4">
                {/* Grade Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Khối lớp
                  </label>
                  <select
                    value={filters.gradeLevel}
                    onChange={(e) => setFilters({ ...filters, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả các lớp</option>
                    <option value="Lớp 1">Lớp 1</option>
                    <option value="Lớp 2">Lớp 2</option>
                    <option value="Lớp 3">Lớp 3</option>
                    <option value="Lớp 4">Lớp 4</option>
                    <option value="Lớp 5">Lớp 5</option>
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả</option>
                    <option value="active">Đang học</option>
                    <option value="inactive">Nghỉ học</option>
                    <option value="graduated">Đã tốt nghiệp</option>
                    <option value="suspended">Đình chỉ</option>
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giới tính
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setFilters({ gradeLevel: '', status: '', gender: '' })}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </Card>
          )}

          {/* Main Content */}
          <div className="flex-1">
            <Card className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm học sinh theo tên, email hoặc mã học sinh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<span>🔍</span>}
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={refetch}
                    leftIcon={<Icons.Search className="w-4 h-4" />}
                    disabled={loading}
                  >
                    Làm mới
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    leftIcon={showFilters ? <Icons.Close className="w-4 h-4" /> : <Icons.Filter className="w-4 h-4" />}
                  >
                    {showFilters ? 'Ẩn' : 'Bộ lọc'}
                  </Button>

                  <Button
                    variant="success"
                    onClick={handleExportCSV}
                    leftIcon={<Icons.Download className="w-4 h-4" />}
                    disabled={students.length === 0}
                  >
                    Xuất dữ liệu
                  </Button>

                  {hasAdminAccess && selectedIds.size > 0 && (
                    <Button
                      variant="danger"
                      onClick={handleBulkArchive}
                      isLoading={archiving}
                      leftIcon={<Icons.Archive className="w-4 h-4" />}
                    >
                      Lưu trữ ({selectedIds.size})
                    </Button>
                  )}

                  {hasAdminAccess && (
                    <Link href={routes.students.import()}>
                      <Button variant="outline" leftIcon={<span>📤</span>}>
                        Nhập dữ liệu
                      </Button>
                    </Link>
                  )}
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
                          label: (
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
                          label: 'Tên',
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
                          label: 'Mã học sinh',
                          render: (student) => (
                            <span className="text-gray-600 font-mono text-sm">
                              {student.student_code || '-'}
                            </span>
                          ),
                        },
                        {
                          key: 'email',
                          label: 'Email',
                          render: (student) => (
                            <span className="text-gray-600">{student.email || '-'}</span>
                          ),
                        },
                        {
                          key: 'grade_level',
                          label: 'Lớp',
                          render: (student) => (
                            student.grade_level ? (
                              <Badge variant="info">{student.grade_level}</Badge>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )
                          ),
                        },
                        {
                          key: 'phone',
                          label: 'Điện thoại',
                          render: (student) => (
                            <span className="text-slate-700">{student.phone || '-'}</span>
                          ),
                        },
                        {
                          key: 'status',
                          label: 'Trạng thái',
                          render: (student) => (
                            <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                              {student.status || 'active'}
                            </Badge>
                          ),
                        },
                        {
                          key: 'created_at',
                          label: 'Ngày tham gia',
                          render: (student) => (
                            <span className="text-gray-600 text-sm">
                              {new Date(student.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          ),
                        },
                        {
                          key: 'actions',
                          label: 'Hành động',
                          width: '160px',
                          render: (student) => (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingStudent(student)}
                                leftIcon={<Icons.Edit className="w-4 h-4" />}
                              >
                                Chỉnh sửa
                              </Button>
                              {hasAdminAccess && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleArchiveOne(student)}
                                  leftIcon={<Icons.Archive className="w-4 h-4" />}
                                >
                                  Lưu trữ
                                </Button>
                              )}
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

// Student Form Modal Component
interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess: () => void;
}

function StudentFormModal({ isOpen, onClose, student, onSuccess }: StudentFormModalProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    student_code: '',
    grade_level: '',
    status: 'active',
    gender: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        email: student.email || '',
        phone: student.phone || '',
        date_of_birth: student.date_of_birth || '',
        address: student.address || '',
        student_code: student.student_code || '',
        grade_level: student.grade_level || '',
        status: student.status || 'active',
        gender: student.gender || ''
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        student_code: '',
        grade_level: '',
        status: 'active',
        gender: ''
      });
    }
    setErrors({});
    setErrors({});
    setTempPassword(null);
  }, [student, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Họ tên là bắt buộc';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Định dạng số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const url = student
        ? `/api/students/${student.id}`
        : '/api/students';

      const method = student ? 'PUT' : 'POST';

      // Sanitize payload: convert empty strings to null or undefined for optional fields
      const payload = {
        ...formData,
        email: formData.email.trim() || undefined,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        student_code: formData.student_code.trim() || undefined, // Let backend generate if empty
        grade_level: formData.grade_level || null,
        gender: formData.gender || null,
        // Status is always set to a value from select
      };

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể lưu học sinh');
      }

      if (data.tempPassword) {
        setTempPassword(data.tempPassword);
        // Do not close yet - let user see password
      } else {
        onSuccess();
      }
    } catch (error: any) {
      toast.error('Error', error.message);
      logger.error('Student form error', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success("Đã sao chép", "Mật khẩu đã được lưu vào clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tempPassword ? 'Student Created Successfully' : (student ? 'Edit Student' : 'Add New Student')}
      size="lg"
      footer={
        tempPassword ? (
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={onSuccess}>
              Hoàn tất (Done)
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={submitting}
              leftIcon={student ? <Icons.Save className="w-4 h-4" /> : <Icons.Add className="w-4 h-4" />}
            >
              {student ? 'Update' : 'Add'} Student
            </Button>
          </div>
        )
      }
    >
      {tempPassword ? (
        <div className="space-y-6 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Icons.Success className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800">Tài khoản học sinh đã được tạo</h3>
              <p className="text-green-700 text-sm mt-1">
                Vui lòng sao chép thông tin đăng nhập dưới đây và gửi cho học sinh.
                Lưu ý: Mật khẩu này chỉ hiện <strong>một lần duy nhất</strong>.
              </p>
            </div>
          </div>

          <div className="grid gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                Họ và Tên
              </label>
              <div className="text-lg font-medium text-slate-900">{formData.full_name}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Mã Học Sinh (Dùng để đăng nhập)
                </label>
                <div className="text-lg font-mono font-medium text-slate-900 bg-white px-3 py-2 rounded border border-slate-200">
                  {formData.student_code}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Mật khẩu
                </label>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-mono font-medium text-slate-900 bg-white px-3 py-2 rounded border border-slate-200 flex-1">
                    {tempPassword}
                  </div>
                  <button
                    onClick={handleCopyPassword}
                    className="p-2hover:bg-slate-200 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                    title="Copy Password"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <Input
            label="Họ và tên"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={errors.full_name}
            placeholder="Nhập họ và tên học sinh"
          />

          {/* Email and Student Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              placeholder="hocsinh@example.com"
            />

            <Input
              label="Mã học sinh"
              value={formData.student_code}
              onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
              placeholder="HS2024001"
            />
          </div>

          {/* Phone and Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số điện thoại"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
              placeholder="0912 345 678"
            />

            <Input
              label="Ngày sinh"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          {/* Grade Level, Status, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn khối lớp</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                  <option key={grade} value={`Lớp ${grade}`}>Lớp {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Đang học</option>
                <option value="inactive">Nghỉ học</option>
                <option value="graduated">Đã tốt nghiệp</option>
                <option value="suspended">Đình chỉ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập địa chỉ học sinh"
            />
          </div>
          {/* Note */}
          {!student && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm flex items-start gap-3 mt-6">
              <Icons.Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Thông tin tài khoản</p>
                <p className="mt-1">
                  Hệ thống sẽ tự động tạo tài khoản đăng nhập cho học sinh.
                  Mật khẩu sẽ được hiển thị sau khi tạo thành công.
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}


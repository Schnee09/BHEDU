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
import { useFetch, useMutation, usePagination, useDebounce, useToast } from "@/hooks";
import { 
  Button, 
  Card, 
  CardHeader,
  Badge, 
  LoadingState, 
  EmptyState, 
  Input, 
  Table,
  SkeletonStatCard,
  SkeletonTable,
  Modal
} from "@/components/ui";
import { ToastContainer } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { createAuditLog, AuditActions } from "@/lib/audit";

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
  
  const { data, loading, error, refetch } = useFetch<{
    students: Student[];
    total: number;
    statistics?: StudentStats;
  }>(
    `/api/admin/students?${queryParams.toString()}`
  );
  
  // Handle successful fetch
  useEffect(() => {
    if (data) {
      pagination.setTotalItems(data.total);
      logger.info('Students loaded', { count: data.students.length });
    }
  }, [data]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load students', error);
      logger.error('Error loading students', new Error(error));
    }
  }, [error]);
  
  // Bulk archive mutation
  const { mutate: archiveStudent, loading: archiving } = useMutation('/api/admin/students', 'DELETE');
  
  const students = data?.students || [];
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
    if (selectedIds.size === 0) {
      toast.warning('No selection', 'Please select students to archive');
      return;
    }
    
    if (!confirm(`Archive ${selectedIds.size} student(s)? This will set their status to inactive.`)) {
      return;
    }
    
    try {
      logger.info('Bulk archiving students', { count: selectedIds.size });
      
      // Archive each student
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id =>
          fetch(`/api/admin/students/${id}`, { method: 'DELETE' })
        )
      );
      
      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = selectedIds.size - failed;
      
      if (failed > 0) {
        toast.warning('Partial success', `Archived ${succeeded} students, ${failed} failed`);
      } else {
        toast.success('Students archived', `Successfully archived ${succeeded} student(s)`);
      }
      
      // Audit log
      await createAuditLog({
        userId: 'current-user-id', // TODO: Get from session
        userEmail: 'admin@example.com', // TODO: Get from session
        userRole: 'admin',
        action: AuditActions.STUDENT_DELETED,
        resourceType: 'student',
        resourceId: 'bulk',
        metadata: { count: succeeded, studentIds: Array.from(selectedIds) },
      });
      
      setSelectedIds(new Set());
      refetch();
    } catch (error) {
      logger.error('Bulk archive error', { error });
      toast.error('Archive failed', 'Failed to archive students');
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
      s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : "",
      s.grade_level || "",
      s.status || "active",
      new Date(s.created_at).toLocaleDateString(),
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      );
    }
    
    if (!statistics) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-700">{statistics.total_students}</p>
            <p className="text-sm text-blue-600 mt-1 font-medium">Total Students</p>
          </div>
        </Card>
        <Card padding="md" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700">{statistics.active_students}</p>
            <p className="text-sm text-green-600 mt-1 font-medium">Active</p>
          </div>
        </Card>
        <Card padding="md" className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-700">{statistics.inactive_students}</p>
            <p className="text-sm text-slate-600 mt-1 font-medium">Inactive</p>
          </div>
        </Card>
        <Card padding="md" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-700">
              {Object.keys(statistics.by_grade || {}).length}
            </p>
            <p className="text-sm text-purple-600 mt-1 font-medium">Grade Levels</p>
          </div>
        </Card>
      </div>
    );
  };
  
  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-10 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-6 w-96 bg-slate-200 rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          
          <Card className="mb-6">
            <div className="h-12 bg-slate-200 rounded animate-pulse" />
          </Card>
          
          <Card>
            <SkeletonTable rows={10} columns={6} />
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Students</h1>
        <p className="text-lg text-slate-600">Manage student records and information</p>
      </div>
      
      {/* Statistics */}
      {renderStatistics()}
      
      {/* Filters and Actions */}
      <div className="flex gap-6 mb-6">
        {/* Filter Sidebar */}
        {showFilters && (
          <Card className="w-64 flex-shrink-0">
            <CardHeader title="Filters" />
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
                Clear Filters
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
                  placeholder="Search students by name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<span>🔍</span>}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<span>{showFilters ? '✕' : '⚙️'}</span>}
                >
                  {showFilters ? 'Hide' : 'Filters'}
                </Button>
                
                <Button
                  variant="success"
                  onClick={handleExportCSV}
                  leftIcon={<span>📥</span>}
                  disabled={students.length === 0}
                >
                  Export
                </Button>
                
                {selectedIds.size > 0 && (
                  <Button
                    variant="danger"
                    onClick={handleBulkArchive}
                    isLoading={archiving}
                    leftIcon={<span>🗄️</span>}
                  >
                    Archive ({selectedIds.size})
                  </Button>
                )}
                
                <Link href="/dashboard/students/import">
                  <Button variant="outline" leftIcon={<span>📤</span>}>
                    Import
                  </Button>
                </Link>
                
                <Button
                  variant="primary"
                  onClick={() => setShowAddModal(true)}
                  leftIcon={<span>➕</span>}
                >
                  Add Student
                </Button>
              </div>
            </div>
            
            {/* Results info */}
            <div className="mt-3 text-sm text-slate-600 flex items-center gap-2">
              <span>Showing {students.length} of {data?.total || 0} students</span>
              {selectedIds.size > 0 && (
                <>
                  <span>•</span>
                  <Badge variant="info">{selectedIds.size} selected</Badge>
                </>
              )}
              {(filters.gradeLevel || filters.status || filters.gender) && (
                <>
                  <span>•</span>
                  <Badge variant="warning">Filters active</Badge>
                </>
              )}
            </div>
          </Card>
      
      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-500">
          <div className="text-red-600">
            <p className="font-semibold">Error loading students</p>
            <p className="text-sm mt-1">{error}</p>
            <Button variant="outline" onClick={refetch} className="mt-3">
              Retry
            </Button>
          </div>
        </Card>
      )}
      
      {/* Empty State */}
      {!loading && students.length === 0 && !error && (
        <EmptyState
          icon={<span className="text-6xl">👨‍🎓</span>}
          title="No students found"
          description={
            debouncedSearch
              ? "Try adjusting your search query"
              : "Get started by importing or adding students"
          }
          action={
            <div className="flex gap-2">
              <Link href="/dashboard/students/import">
                <Button variant="primary">Import Students</Button>
              </Link>
              {debouncedSearch && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          }
        />
      )}
      
      {/* Students Table */}
      {students.length > 0 && (
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
                label: 'Name',
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
                label: 'Student ID',
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
                label: 'Grade',
                render: (student) => (
                  student.grade_level ? (
                    <Badge variant="info">{student.grade_level}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                ),
              },
              {
                key: 'phone',
                label: 'Phone',
                render: (student) => (
                  <span className="text-gray-600">{student.phone || '-'}</span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (student) => (
                  <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                    {student.status || 'active'}
                  </Badge>
                ),
              },
              {
                key: 'created_at',
                label: 'Joined',
                render: (student) => (
                  <span className="text-gray-600 text-sm">
                    {new Date(student.created_at).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-6">
          <Button
            variant="outline"
            onClick={pagination.prevPage}
            disabled={!pagination.hasPrevPage || loading}
          >
            Previous
          </Button>
          
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={pagination.nextPage}
            disabled={!pagination.hasNextPage || loading}
          >
            Next
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
  }, [student, isOpen]);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
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
        ? `/api/admin/students/${student.id}`
        : '/api/admin/students';
      
      const method = student ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save student');
      }
      
      onSuccess();
    } catch (error: any) {
      toast.error('Error', error.message);
      logger.error('Student form error', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? 'Edit Student' : 'Add New Student'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            leftIcon={<span>{student ? '💾' : '➕'}</span>}
          >
            {student ? 'Update' : 'Add'} Student
          </Button>
        </div>
      }
    >
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
      </form>
    </Modal>
  );
}


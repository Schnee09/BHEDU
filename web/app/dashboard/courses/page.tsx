/**
 * Courses Management Page
 * 
 * Features:
 * - Full CRUD operations for courses
 * - Search and filtering
 * - Statistics dashboard
 * - Export functionality
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useFetch, useMutation, usePagination, useDebounce, useToast } from "@/hooks";
import { 
  Button, 
  EmptyState, 
  Input, 
  Modal
} from "@/components/ui";
import { Card, StatCard } from "@/components/ui/Card";
import { Table } from "@/components/ui/table";
import Badge from "@/components/ui/badge";
import { SkeletonStatCard, SkeletonTable } from "@/components/ui/skeleton";
import { ToastContainer } from "@/components/ui/Toast";
import { Icons } from "@/components/ui/Icons";
import { logger } from "@/lib/logger";

interface Course {
  id: string;
  title: string;
  name?: string;
  description: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  academic_year_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CourseFormData {
  title: string;
  description: string;
  subject_id: string;
  teacher_id: string;
  academic_year_id: string;
}

export default function CoursesPage() {
  const toast = useToast();
  
  // Search with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    subject_id: "",
    teacher_id: "",
    academic_year_id: ""
  });
  const [formErrors, setFormErrors] = useState<Partial<CourseFormData>>({});
  
  // Pagination
  const pagination = usePagination({ initialPage: 1, initialLimit: 25 });
  
  // Selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Fetch courses
  const { data, loading, error, refetch } = useFetch<{ data: Course[] }>(
    `/api/admin/courses`
  );
  
  // Mutations
  const { mutate: createCourse, loading: creating } = useMutation('/api/admin/courses', 'POST');
  const { mutate: _updateCourse, loading: updating } = useMutation('/api/admin/courses', 'PUT');
  
  // Handle fetch errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load courses', error);
      logger.error('Error loading courses', new Error(error));
    }
  }, [error, toast]);
  
  // Filter courses by search (memoized for performance)
  const courses = useMemo(() => {
    return (data?.data || []).filter(course => {
      const name = course.title || course.name || '';
      const desc = course.description || '';
      const searchLower = debouncedSearch.toLowerCase();
      return name.toLowerCase().includes(searchLower) || 
             desc.toLowerCase().includes(searchLower);
    });
  }, [data?.data, debouncedSearch]);
  
  // Paginate courses (memoized for performance)
  const paginatedCourses = useMemo(() => {
    return courses.slice(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit
    );
  }, [courses, pagination.page, pagination.limit]);
  
  useEffect(() => {
    pagination.setTotalItems(courses.length);
  }, [courses.length, pagination]);
  
  // Selection handlers
  const _handleSelectAll = () => {
    if (selectedIds.size === paginatedCourses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCourses.map(c => c.id)));
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
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<CourseFormData> = {};
    
    if (!formData.title.trim()) {
      errors.title = "Course title is required";
    } else if (formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Open add modal
  const handleAddClick = () => {
    setFormData({
      title: "",
      description: "",
      subject_id: "",
      teacher_id: "",
      academic_year_id: ""
    });
    setFormErrors({});
    setShowAddModal(true);
  };
  
  // Open edit modal
  const handleEditClick = (course: Course) => {
    setFormData({
      title: course.title || course.name || "",
      description: course.description || "",
      subject_id: course.subject_id || "",
      teacher_id: course.teacher_id || "",
      academic_year_id: course.academic_year_id || ""
    });
    setFormErrors({});
    setEditingCourse(course);
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (editingCourse) {
        // Update existing course
        const result = await fetch(`/api/admin/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (!result.ok) {
          const errorData = await result.json();
          throw new Error(errorData.error || 'Failed to update course');
        }
        
        toast.success('Course updated', `"${formData.title}" has been updated`);
        setEditingCourse(null);
      } else {
        // Create new course
        await createCourse(formData);
        toast.success('Course created', `"${formData.title}" has been created`);
        setShowAddModal(false);
      }
      
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      toast.error('Error', message);
      logger.error('Course operation failed', err as Error);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      const result = await fetch(`/api/admin/courses/${courseToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error || 'Failed to delete course');
      }
      
      toast.success('Course deleted', `"${courseToDelete.title || courseToDelete.name}" has been deleted`);
      setCourseToDelete(null);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error('Error', message);
      logger.error('Course deletion failed', err as Error);
    }
  };
  
  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.warning('No selection', 'Please select courses to delete');
      return;
    }
    
    if (!confirm(`Delete ${selectedIds.size} course(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id =>
          fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
        )
      );
      
      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = selectedIds.size - failed;
      
      if (failed > 0) {
        toast.warning('Partial success', `Deleted ${succeeded} courses, ${failed} failed`);
      } else {
        toast.success('Courses deleted', `Successfully deleted ${succeeded} course(s)`);
      }
      
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      toast.error('Delete failed', 'Failed to delete courses');
      logger.error('Bulk delete error', err as Error);
    }
  };
  
  // Export CSV
  const handleExportCSV = () => {
    if (courses.length === 0) {
      toast.warning('No data', 'No courses to export');
      return;
    }
    
    const coursesToExport = selectedIds.size > 0 
      ? courses.filter(c => selectedIds.has(c.id))
      : courses;
    
    const headers = ["ID", "Title", "Description", "Created At"];
    const rows = coursesToExport.map(c => [
      c.id,
      c.title || c.name || "",
      c.description || "",
      new Date(c.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `courses_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export complete', `Exported ${coursesToExport.length} course(s)`);
  };
  
  // Table columns
  const columns = [
    {
      key: 'select',
      header: '',
      render: (course: Course) => (
        <input
          type="checkbox"
          checked={selectedIds.has(course.id)}
          onChange={() => handleSelectOne(course.id)}
          className="w-4 h-4 text-stone-600 rounded focus:ring-stone-500"
        />
      )
    },
    {
      key: 'title',
      header: 'Course Title',
      render: (course: Course) => (
        <div>
          <p className="font-medium text-stone-900">{course.title || course.name}</p>
          {course.description && (
            <p className="text-sm text-stone-500 truncate max-w-xs">{course.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (course: Course) => (
        <span className="text-stone-600">
          {course.subject_id ? (
            <Badge variant="info">Linked</Badge>
          ) : (
            <span className="text-stone-400">—</span>
          )}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (course: Course) => (
        <span className="text-sm text-stone-600">
          {new Date(course.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (course: Course) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(course)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCourseToDelete(course)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];
  
  // Loading state
  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-10 w-48 bg-stone-200 rounded animate-pulse mb-2" />
            <div className="h-6 w-96 bg-stone-200 rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          
          <Card>
            <SkeletonTable rows={10} columns={5} />
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-stone-900 mb-2">Courses</h1>
          <p className="text-lg text-stone-600">Manage courses and curriculum</p>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Courses"
            value={data?.data?.length || 0}
            icon={<Icons.Classes className="w-6 h-6" />}
            color="slate"
          />
          <StatCard
            label="With Subject"
            value={(data?.data || []).filter(c => c.subject_id).length}
            icon={<Icons.Success className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            label="With Teacher"
            value={(data?.data || []).filter(c => c.teacher_id).length}
            icon={<Icons.Teachers className="w-6 h-6" />}
            color="purple"
          />
        </div>
        
        {/* Actions Bar */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <>
                  <Badge variant="info" className="py-2 px-3">
                    {selectedIds.size} selected
                  </Badge>
                  <Button variant="outline" onClick={handleBulkDelete} className="text-red-600">
                    Delete Selected
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={handleExportCSV} leftIcon={<Icons.Download className="w-4 h-4" />}>
                Export CSV
              </Button>
              <Button onClick={handleAddClick} leftIcon={<Icons.Add className="w-4 h-4" />}>
                Add Course
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Courses Table */}
        <Card>
          {courses.length === 0 ? (
            <EmptyState
              icon={<Icons.Classes className="w-12 h-12 text-stone-400" />}
              title="No courses found"
              description={searchQuery ? "Try adjusting your search" : "Get started by adding your first course"}
              action={
                <Button onClick={handleAddClick} leftIcon={<Icons.Add className="w-4 h-4" />}>
                  Add Course
                </Button>
              }
            />
          ) : (
            <>
              <Table
                data={paginatedCourses}
                columns={columns}
                keyExtractor={(course) => course.id}
              />
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200">
                  <p className="text-sm text-stone-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, courses.length)} of{' '}
                    {courses.length} courses
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pagination.prevPage}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pagination.nextPage}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
        
        {/* Add/Edit Modal */}
        <Modal
          isOpen={showAddModal || !!editingCourse}
          onClose={() => {
            setShowAddModal(false);
            setEditingCourse(null);
          }}
          title={editingCourse ? "Edit Course" : "Add New Course"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Course Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to Mathematics"
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-red-600 mt-1">{formErrors.title}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Course description..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCourse(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={creating || updating}
              >
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </form>
        </Modal>
        
        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!courseToDelete}
          onClose={() => setCourseToDelete(null)}
          title="Delete Course"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              Are you sure you want to delete "{courseToDelete?.title || courseToDelete?.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setCourseToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Course
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}


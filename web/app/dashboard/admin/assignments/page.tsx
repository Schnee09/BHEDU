'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  max_points: number;
  due_date: string;
  published: boolean;
  created_at: string;
  class: {
    id: string;
    name: string;
    code: string;
    grade_level: string;
    teacher: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
  category: {
    id: string;
    name: string;
    weight: number;
  } | null;
  submission_count: number;
}

interface Class {
  id: string;
  name: string;
  code: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    class_id: '',
    teacher_id: '',
    status: '',
    type: ''
  });
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });

  // Selection for bulk operations
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAssignments();
  }, [filters, sortBy, sortOrder, pagination.page]);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.class_id) params.append('class_id', filters.class_id);
      if (filters.teacher_id) params.append('teacher_id', filters.teacher_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);

      const response: any = await apiFetch(`/api/admin/assignments?${params}`);
      if (response.success) {
        setAssignments(response.assignments);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response: any = await apiFetch('/api/admin/classes?limit=1000');
      if (response.success) {
        setClasses(response.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response: any = await apiFetch('/api/admin/teachers?limit=1000');
      if (response.success) {
        setTeachers(response.teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleAssignmentSelection = (assignmentId: string) => {
    const newSelection = new Set(selectedAssignments);
    if (newSelection.has(assignmentId)) {
      newSelection.delete(assignmentId);
    } else {
      newSelection.add(assignmentId);
    }
    setSelectedAssignments(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedAssignments.size === assignments.length) {
      setSelectedAssignments(new Set());
    } else {
      setSelectedAssignments(new Set(assignments.map(a => a.id)));
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const response: any = await apiFetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        fetchAssignments();
      } else {
        alert(response.error || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('An error occurred while deleting the assignment');
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedAssignments.size === 0) return;

    try {
      const promises = Array.from(selectedAssignments).map(id =>
        apiFetch(`/api/admin/assignments/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ published: publish })
        })
      );

      await Promise.all(promises);
      setSelectedAssignments(new Set());
      fetchAssignments();
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('An error occurred during bulk update');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedAssignments.size} assignment(s)?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedAssignments).map(id =>
        apiFetch(`/api/admin/assignments/${id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(promises);
      setSelectedAssignments(new Set());
      fetchAssignments();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('An error occurred during bulk delete');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Class', 'Teacher', 'Type', 'Due Date', 'Max Points', 'Status', 'Submissions'];
    const rows = assignments.map(a => [
      a.title,
      a.class.name,
      `${a.class.teacher.first_name} ${a.class.teacher.last_name}`,
      a.type,
      new Date(a.due_date).toLocaleDateString(),
      a.max_points.toString(),
      a.published ? 'Published' : 'Draft',
      a.submission_count.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'homework': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'exam': return 'bg-red-100 text-red-800';
      case 'project': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments Management</h1>
        <p className="text-gray-600">Manage assignments across all classes</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search assignments..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Class Filter */}
          <select
            value={filters.class_id}
            onChange={(e) => handleFilterChange('class_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
            ))}
          </select>

          {/* Teacher Filter */}
          <select
            value={filters.teacher_id}
            onChange={(e) => handleFilterChange('teacher_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Teachers</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.first_name} {teacher.last_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="homework">Homework</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="project">Project</option>
          </select>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              Export CSV
            </button>
          </div>

          {selectedAssignments.size > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedAssignments.size} selected
              </span>
              <button
                onClick={() => handleBulkPublish(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Publish Selected
              </button>
              <button
                onClick={() => handleBulkPublish(false)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
              >
                Unpublish Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedAssignments(new Set())}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No assignments found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAssignments.size === assignments.length && assignments.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('title')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Assignment {getSortIcon('title')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Type {getSortIcon('type')}
                  </th>
                  <th
                    onClick={() => handleSort('due_date')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Due Date {getSortIcon('due_date')}
                  </th>
                  <th
                    onClick={() => handleSort('max_points')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Points {getSortIcon('max_points')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAssignments.has(assignment.id)}
                        onChange={() => toggleAssignmentSelection(assignment.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/dashboard/admin/assignments/${assignment.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {assignment.title}
                      </a>
                      {assignment.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {assignment.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`/dashboard/admin/classes/${assignment.class.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {assignment.class.name}
                      </a>
                      <div className="text-xs text-gray-500">{assignment.class.code}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <a
                        href={`/dashboard/admin/teachers/${assignment.class.teacher.id}`}
                        className="hover:underline"
                      >
                        {assignment.class.teacher.first_name} {assignment.class.teacher.last_name}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(assignment.type)}`}>
                        {assignment.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {assignment.max_points}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        assignment.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {assignment.submission_count}
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} assignments
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.total_pages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

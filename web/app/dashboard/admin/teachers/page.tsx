'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  status: string;
  hire_date: string | null;
  class_count: number;
  student_count: number;
  classes: {
    id: string;
    name: string;
    code: string;
    grade_level: string;
    status: string;
  }[];
  created_at: string;
}

interface AcademicYear {
  id: string;
  name: string;
  status: string;
}

export default function AdminTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    department: '',
    academic_year_id: ''
  });
  const [sortBy, setSortBy] = useState('first_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });

  // Selection for bulk operations
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTeachers();
  }, [filters, sortBy, sortOrder, pagination.page]);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.academic_year_id) params.append('academic_year_id', filters.academic_year_id);

      const response: any = await apiFetch(`/api/admin/teachers?${params}`);
      if (response.success) {
        setTeachers(response.teachers);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response: any = await apiFetch('/api/admin/academic-years');
      if (response.success) {
        setAcademicYears(response.academic_years);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    const newSelection = new Set(selectedTeachers);
    if (newSelection.has(teacherId)) {
      newSelection.delete(teacherId);
    } else {
      newSelection.add(teacherId);
    }
    setSelectedTeachers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedTeachers.size === teachers.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(teachers.map(t => t.id)));
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Are you sure you want to deactivate this teacher? This cannot be undone.')) {
      return;
    }

    try {
      const response: any = await apiFetch(`/api/admin/teachers/${teacherId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        fetchTeachers();
      } else {
        alert(response.error || 'Failed to deactivate teacher');
      }
    } catch (error) {
      console.error('Error deactivating teacher:', error);
      alert('An error occurred while deactivating the teacher');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedTeachers.size === 0) return;

    if (!confirm(`Are you sure you want to deactivate ${selectedTeachers.size} teacher(s)?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedTeachers).map(id =>
        apiFetch(`/api/admin/teachers/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'inactive' })
        })
      );

      await Promise.all(promises);
      setSelectedTeachers(new Set());
      fetchTeachers();
    } catch (error) {
      console.error('Error bulk deactivating:', error);
      alert('An error occurred during bulk deactivation');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Department', 'Status', 'Classes', 'Students', 'Hire Date'];
    const rows = teachers.map(t => [
      `${t.first_name} ${t.last_name}`,
      t.email,
      t.phone || '',
      t.department || '',
      t.status,
      t.class_count.toString(),
      t.student_count.toString(),
      t.hire_date || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading && teachers.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teachers Management</h1>
        <p className="text-gray-600">Manage teacher accounts, assignments, and workload</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Department Filter */}
          <input
            type="text"
            placeholder="Filter by department..."
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Academic Year Filter */}
          <select
            value={filters.academic_year_id}
            onChange={(e) => handleFilterChange('academic_year_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Academic Years</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Add Teacher
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              Export CSV
            </button>
          </div>

          {selectedTeachers.size > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedTeachers.size} selected
              </span>
              <button
                onClick={handleBulkDeactivate}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Deactivate Selected
              </button>
              <button
                onClick={() => setSelectedTeachers(new Set())}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Teachers Table */}
      {teachers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No teachers found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add First Teacher
          </button>
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
                      checked={selectedTeachers.size === teachers.length && teachers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('first_name')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Teacher {getSortIcon('first_name')}
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Email {getSortIcon('email')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.has(teacher.id)}
                        onChange={() => toggleTeacherSelection(teacher.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/dashboard/admin/teachers/${teacher.id}`}
                        className="block"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-3">
                            {teacher.first_name[0]}{teacher.last_name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            {teacher.phone && (
                              <div className="text-xs text-gray-500">{teacher.phone}</div>
                            )}
                          </div>
                        </div>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {teacher.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {teacher.department || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {teacher.class_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {teacher.student_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Deactivate
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
              {pagination.total} teachers
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

      {/* Create Modal - Placeholder */}
      {showCreateModal && (
        <TeacherFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTeachers();
          }}
        />
      )}

      {/* Edit Modal - Placeholder */}
      {showEditModal && selectedTeacher && (
        <TeacherFormModal
          mode="edit"
          teacherData={selectedTeacher}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeacher(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTeacher(null);
            fetchTeachers();
          }}
        />
      )}
    </div>
  );
}

// Teacher Form Modal Component
function TeacherFormModal({
  mode,
  teacherData,
  onClose,
  onSuccess
}: {
  mode: 'create' | 'edit';
  teacherData?: Teacher;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    first_name: teacherData?.first_name || '',
    last_name: teacherData?.last_name || '',
    email: teacherData?.email || '',
    phone: teacherData?.phone || '',
    department: teacherData?.department || '',
    status: teacherData?.status || 'active',
    hire_date: teacherData?.hire_date || '',
    password: '' // Only for create mode
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body: any = { ...formData };
      
      // Remove password field if editing
      if (mode === 'edit') {
        delete body.password;
      }

      const url = mode === 'create'
        ? '/api/admin/teachers'
        : `/api/admin/teachers/${teacherData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response: any = await apiFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      if (response.success || response.user || response.teacher) {
        onSuccess();
      } else {
        setError(response.error || 'Failed to save teacher');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Add New Teacher' : 'Edit Teacher'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={mode === 'create'}
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date
              </label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Teacher' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { showToast } from '@/components/ToastProvider';
import { api } from '@/lib/api-client';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  created_at: string;
  class_count?: number;
}

export default function AdminTeachersPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.role !== 'admin') {
      showToast.error('Access denied');
      return;
    }
    fetchTeachers();
  }, [profile, profileLoading, search]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const result = await api.teachers.list({ 
        search: search.trim() || undefined 
      });
      console.log('[Teachers] Fetched', result.length, 'teachers');
      setTeachers(result);
    } catch (error) {
      console.error('[Teachers] Fetch error:', error);
      showToast.error('Failed to load teachers');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === teachers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(teachers.map(t => t.id)));
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

  const handleExportCSV = () => {
    if (teachers.length === 0) {
      showToast.error('No teachers to export');
      return;
    }

    const teachersToExport = selectedIds.size > 0 
      ? teachers.filter(t => selectedIds.has(t.id))
      : teachers;

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Classes', 'Joined'];
    const rows = teachersToExport.map(t => [
      t.id,
      t.full_name,
      t.email || '',
      t.phone || '',
      t.class_count?.toString() || '0',
      new Date(t.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast.success(`Exported ${teachersToExport.length} teacher(s) to CSV`);
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading teachers...</p>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Access denied. Admin only.</p>
      </div>
    );
  }

  const isAllSelected = teachers.length > 0 && selectedIds.size === teachers.length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Teachers Management</h1>
        
        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium"
          >
            📥 Export CSV
          </button>

          {/* Add Teacher Button */}
          <Link
            href="/dashboard/admin/teachers/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            ➕ Add Teacher
          </Link>
        </div>

        {/* Results Info */}
        <div className="text-sm text-gray-600 mb-2">
          Showing {teachers.length} teacher(s)
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No teachers found</p>
          <p className="text-gray-400 text-sm mt-2">
            {search ? 'Try adjusting your search query' : 'Add your first teacher to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3 text-left">Full Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Classes</th>
                <th className="p-3 text-left">Joined</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(teacher.id)}
                      onChange={() => handleSelectOne(teacher.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <Link 
                      href={`/dashboard/admin/teachers/${teacher.id}`}
                      className="text-blue-700 hover:underline font-medium"
                    >
                      {teacher.full_name}
                    </Link>
                  </td>
                  <td className="p-3 text-gray-600">{teacher.email || '-'}</td>
                  <td className="p-3 text-gray-600">{teacher.phone || '-'}</td>
                  <td className="p-3 text-gray-600">
                    {teacher.class_count !== undefined ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {teacher.class_count} {teacher.class_count === 1 ? 'class' : 'classes'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(teacher.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/teachers/${teacher.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/admin/teachers/${teacher.id}`}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

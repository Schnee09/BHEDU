'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { showToast } from '@/components/ToastProvider';
import { api } from '@/lib/api-client';

interface Class {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
  teacher?: {
    full_name: string;
  };
  enrollment_count?: number;
}

export default function AdminClassesPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.role !== 'admin') {
      showToast.error('Access denied');
      return;
    }
    fetchClasses();
  }, [profile, profileLoading, search]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const result = await api.classes.list({ 
        search: search.trim() || undefined 
      });
      console.log('[Admin Classes] Fetched', result.length, 'classes');
      setClasses(result);
    } catch (error) {
      console.error('[Admin Classes] Fetch error:', error);
      showToast.error('Failed to load classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === classes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(classes.map(c => c.id)));
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
    if (classes.length === 0) {
      showToast.error('No classes to export');
      return;
    }

    const classesToExport = selectedIds.size > 0 
      ? classes.filter(c => selectedIds.has(c.id))
      : classes;

    const headers = ['ID', 'Name', 'Teacher', 'Students', 'Created'];
    const rows = classesToExport.map(c => [
      c.id,
      c.name,
      c.teacher?.full_name || 'Not assigned',
      c.enrollment_count?.toString() || '0',
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `classes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast.success(`Exported ${classesToExport.length} class(es) to CSV`);
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading classes...</p>
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

  const isAllSelected = classes.length > 0 && selectedIds.size === classes.length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Classes Management</h1>
        
        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class name..."
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

          {/* Add Class Button */}
          <Link
            href="/dashboard/admin/classes/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            ➕ Add Class
          </Link>
        </div>

        {/* Results Info */}
        <div className="text-sm text-gray-600 mb-2">
          Showing {classes.length} class(es)
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No classes found</p>
          <p className="text-gray-400 text-sm mt-2">
            {search ? 'Try adjusting your search query' : 'Add your first class to get started'}
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
                <th className="p-3 text-left">Class Name</th>
                <th className="p-3 text-left">Teacher</th>
                <th className="p-3 text-left">Students</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(cls.id)}
                      onChange={() => handleSelectOne(cls.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <Link 
                      href={`/dashboard/admin/classes/${cls.id}`}
                      className="text-blue-700 hover:underline font-medium"
                    >
                      {cls.name}
                    </Link>
                  </td>
                  <td className="p-3 text-gray-600">
                    {cls.teacher?.full_name || 'Not assigned'}
                  </td>
                  <td className="p-3 text-gray-600">
                    {cls.enrollment_count !== undefined ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {cls.enrollment_count} {cls.enrollment_count === 1 ? 'student' : 'students'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(cls.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/classes/${cls.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/admin/classes/${cls.id}`}
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

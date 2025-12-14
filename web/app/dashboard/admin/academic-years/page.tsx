'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card } from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/skeleton";

interface Term {
  name: string;
  start_date: string;
  end_date: string;
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms: Term[];
  created_at: string;
  updated_at: string;
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'current' | 'past'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/academic-years');
      const data = await response.json();
      setYears(data.data || data);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      alert('Failed to fetch academic years');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingYear) {
        // Update existing year
        const response = await apiFetch(`/api/admin/academic-years/${editingYear.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update');
        }
      } else {
        // Create new year
        const response = await apiFetch('/api/admin/academic-years', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }
      }

      setShowForm(false);
      setEditingYear(null);
      setFormData({ name: '', start_date: '', end_date: '', is_current: false });
      fetchYears();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save academic year';
      console.error('Error saving academic year:', error);
      alert(errorMessage);
    }
  };

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      start_date: year.start_date,
      end_date: year.end_date,
      is_current: year.is_current,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this academic year?')) return;

    try {
      const response = await apiFetch(`/api/admin/academic-years/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      fetchYears();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete academic year';
      console.error('Error deleting academic year:', error);
      alert(errorMessage);
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      const response = await apiFetch(`/api/admin/academic-years/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_current: true }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set current');
      }
      fetchYears();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set current year';
      console.error('Error setting current year:', error);
      alert(errorMessage);
    }
  };

  const filteredYears = years.filter((year) => {
    const matchesSearch = year.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'current') {
      return matchesSearch && year.is_current;
    } else if (filterStatus === 'past') {
      return matchesSearch && !year.is_current;
    }
    return matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Academic Years</h1>
          <p className="text-gray-600">Manage school academic years and terms</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingYear(null);
            setFormData({ name: '', start_date: '', end_date: '', is_current: false });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Academic Year
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by year name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'current' | 'past')}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Years</option>
          <option value="current">Current Year</option>
          <option value="past">Past Years</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Year Name *</label>
                <input
                  type="text"
                  placeholder="e.g., 2024-2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Set as current academic year</label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingYear ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingYear(null);
                  }}
                  className="flex-1 px-4 py-2 bg-stone-200 rounded-lg hover:bg-stone-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Years List */}
      {loading ? (
        <Card>
          <SkeletonTable rows={8} columns={4} />
        </Card>
      ) : filteredYears.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          No academic years found. Create your first academic year to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {filteredYears.map((year) => (
                <tr key={year.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{year.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                    {new Date(year.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                    {new Date(year.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {year.is_current ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Current
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-stone-100 text-stone-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {!year.is_current && (
                        <button
                          onClick={() => handleSetCurrent(year.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Set Current
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(year)}
                        className="text-stone-600 hover:text-stone-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(year.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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

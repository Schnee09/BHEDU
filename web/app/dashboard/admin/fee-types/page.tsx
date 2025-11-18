'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';

interface FeeType {
  id: string;
  name: string;
  description: string;
  amount: number;
  category: string;
  is_mandatory: boolean;
  is_active: boolean;
  academic_year_id: string | null;
  academic_years?: { name: string } | null;
  created_at: string;
  updated_at: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

const CATEGORIES = [
  'tuition',
  'registration',
  'books',
  'uniform',
  'transport',
  'laboratory',
  'library',
  'technology',
  'sports',
  'misc'
];

export default function FeeTypesPage() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: 0,
    category: 'tuition',
    is_mandatory: true,
    is_active: true,
    academic_year_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch fee types
      const feeResponse = await apiFetch('/api/admin/fee-types');
      const feeData = await feeResponse.json();
      setFeeTypes(feeData);

      // Fetch academic years
      const yearResponse = await apiFetch('/api/admin/academic-years');
      const yearData = await yearResponse.json();
      setAcademicYears(yearData.academic_years || yearData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      academic_year_id: formData.academic_year_id || null,
    };

    try {
      if (editingFeeType) {
        const response = await apiFetch(`/api/admin/fee-types/${editingFeeType.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update');
        }
      } else {
        const response = await apiFetch('/api/admin/fee-types', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }
      }

      setShowForm(false);
      setEditingFeeType(null);
      setFormData({
        name: '',
        description: '',
        amount: 0,
        category: 'tuition',
        is_mandatory: true,
        is_active: true,
        academic_year_id: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving fee type:', error);
      alert(error.message || 'Failed to save fee type');
    }
  };

  const handleEdit = (feeType: FeeType) => {
    setEditingFeeType(feeType);
    setFormData({
      name: feeType.name,
      description: feeType.description || '',
      amount: feeType.amount,
      category: feeType.category,
      is_mandatory: feeType.is_mandatory,
      is_active: feeType.is_active,
      academic_year_id: feeType.academic_year_id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee type?')) return;

    try {
      const response = await apiFetch(`/api/admin/fee-types/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting fee type:', error);
      alert(error.message || 'Failed to delete fee type');
    }
  };

  const filteredFeeTypes = feeTypes.filter((fee) => {
    const matchesSearch = fee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || fee.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && fee.is_active) ||
      (filterStatus === 'inactive' && !fee.is_active) ||
      (filterStatus === 'mandatory' && fee.is_mandatory) ||
      (filterStatus === 'optional' && !fee.is_mandatory);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group by category
  const groupedFees = filteredFeeTypes.reduce((acc, fee) => {
    if (!acc[fee.category]) {
      acc[fee.category] = [];
    }
    acc[fee.category].push(fee);
    return acc;
  }, {} as Record<string, FeeType[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Fee Types</h1>
          <p className="text-gray-600">Manage school fees and charges</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingFeeType(null);
            setFormData({
              name: '',
              description: '',
              amount: 0,
              category: 'tuition',
              is_mandatory: true,
              is_active: true,
              academic_year_id: '',
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Fee Type
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search fee types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="mandatory">Mandatory</option>
          <option value="optional">Optional</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4">
              {editingFeeType ? 'Edit Fee Type' : 'Add Fee Type'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fee Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Annual Tuition"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Academic Year</label>
                <select
                  value={formData.academic_year_id}
                  onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All Years</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_mandatory}
                    onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Mandatory</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingFeeType ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFeeType(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Types List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredFeeTypes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No fee types found. Create your first fee type to get started.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFees).map(([category, fees]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                  {category}
                  <span className="text-sm font-normal text-gray-500">({fees.length})</span>
                </h3>
              </div>
              <div className="divide-y">
                {fees.map((fee) => (
                  <div key={fee.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{fee.name}</h4>
                          {fee.is_mandatory && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Mandatory
                            </span>
                          )}
                          {!fee.is_active && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        {fee.description && (
                          <p className="text-sm text-gray-600 mt-1">{fee.description}</p>
                        )}
                        {fee.academic_years && (
                          <p className="text-xs text-gray-500 mt-1">
                            Academic Year: {fee.academic_years.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${fee.amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(fee)}
                            className="text-sm text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(fee.id)}
                            className="text-sm text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

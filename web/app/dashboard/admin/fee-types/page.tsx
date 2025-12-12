'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

interface FeeType {
  id: string;
  name: string;
  description: string | null;
  amount: number;
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

export default function FeeTypesPage() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: 0,
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
      const feeTypesData = Array.isArray(feeData) ? feeData : (feeData?.data || []);
      setFeeTypes(feeTypesData);

      // Fetch academic years
      const yearResponse = await apiFetch('/api/admin/academic-years');
      const yearData = await yearResponse.json();
      const academicYearsData = Array.isArray(yearData) ? yearData : (yearData?.data || []);
      setAcademicYears(academicYearsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFeeTypes([]);
      setAcademicYears([]);
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
        is_active: true,
        academic_year_id: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving fee type:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save fee type';
      alert(errorMessage);
    }
  };

  const handleEdit = (feeType: FeeType) => {
    setEditingFeeType(feeType);
    setFormData({
      name: feeType.name,
      description: feeType.description || '',
      amount: feeType.amount,
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete fee type';
      alert(errorMessage);
    }
  };

  const filteredFeeTypes = feeTypes.filter((fee) => {
    const matchesSearch = fee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && fee.is_active) ||
      (filterStatus === 'inactive' && !fee.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icons.Finance className="w-8 h-8 text-blue-600" />
            Fee Types
          </h1>
          <p className="text-gray-500 mt-1">Manage school fees and charges</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingFeeType(null);
            setFormData({
              name: '',
              description: '',
              amount: 0,
              is_active: true,
              academic_year_id: '',
            });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icons.Add className="w-5 h-5" />
          Add Fee Type
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Filter className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search fee types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingFeeType ? 'Edit Fee Type' : 'Add Fee Type'}
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Annual Tuition"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <select
                    value={formData.academic_year_id}
                    onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">All Years</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingFeeType(null);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800"
                  >
                    {editingFeeType ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Fee Types List */}
      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading...</div>
      ) : filteredFeeTypes.length === 0 ? (
        <div className="text-center py-12 text-stone-500 bg-white rounded-xl border border-stone-200">
          <Icons.Finance className="w-12 h-12 mx-auto mb-3 text-stone-400" />
          <p>No fee types found. Create your first fee type to get started.</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-stone-900">All Fee Types</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
              {filteredFeeTypes.length} Total
            </span>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-stone-100">
              {filteredFeeTypes.map((fee) => (
                <div key={fee.id} className="p-6 hover:bg-stone-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-stone-900">{fee.name}</h4>
                        {!fee.is_active && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-100 text-stone-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      {fee.description && (
                        <p className="text-sm text-stone-500 mt-1">{fee.description}</p>
                      )}
                      {fee.academic_years && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-500">
                          <Icons.Calendar className="w-3 h-3" />
                          {fee.academic_years.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-stone-900">
                          ${fee.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(fee)}
                          className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Icons.Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Icons.Delete className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'

interface FeeType {
  id: string
  name: string
  description: string | null
  amount: number
  category: string | null
  is_mandatory: boolean
  is_active: boolean
  academic_year_id: string | null
  academic_year?: {
    id: string
    name: string
  }
  created_at: string
}

interface AcademicYear {
  id: string
  name: string
}

export default function FeeManagementPage() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeType | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'tuition',
    is_mandatory: true,
    is_active: true,
    academic_year_id: ''
  })

  const categories = [
    'tuition',
    'registration',
    'books',
    'uniform',
    'transport',
    'laboratory',
    'sports',
    'library',
    'exam',
    'misc'
  ]

  useEffect(() => {
    Promise.all([fetchFeeTypes(), fetchAcademicYears()])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchFeeTypes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterYear !== 'all') params.set('academic_year_id', filterYear)

      const response = await apiFetch(`/api/admin/finance/fee-types?${params}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to fetch fee types')
      setFeeTypes(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await apiFetch('/api/admin/academic-years')
      const result = await response.json()
      if (response.ok) {
        setAcademicYears(result.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch academic years:', err)
    }
  }

  useEffect(() => {
    fetchFeeTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const url = editingFee
        ? `/api/admin/finance/fee-types/${editingFee.id}`
        : '/api/admin/finance/fee-types'

      const response = await apiFetch(url, {
        method: editingFee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          academic_year_id: formData.academic_year_id || null
        })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to save fee type')

      setShowModal(false)
      setEditingFee(null)
      resetForm()
      fetchFeeTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleEdit = (fee: FeeType) => {
    setEditingFee(fee)
    setFormData({
      name: fee.name,
      description: fee.description || '',
      amount: fee.amount.toString(),
      category: fee.category || 'tuition',
      is_mandatory: fee.is_mandatory,
      is_active: fee.is_active,
      academic_year_id: fee.academic_year_id || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee type?')) return

    try {
      const response = await apiFetch(`/api/admin/finance/fee-types/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete fee type')
      }

      fetchFeeTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      category: 'tuition',
      is_mandatory: true,
      is_active: true,
      academic_year_id: ''
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <button
          onClick={() => {
            setEditingFee(null)
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Add Fee Type
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Academic Year
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fee Types List */}
      <div className="bg-white dark:bg-stone-900 rounded-lg shadow overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-3 mobile-card-list">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading fee types...</div>
          ) : feeTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No fee types found.</div>
          ) : (
            feeTypes.map((fee) => (
              <div
                key={fee.id}
                className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-[#2C2420] active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight truncate">
                      {fee.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {fee.description || 'Không có mô tả'}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                      {formatCurrency(fee.amount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-stone-50 dark:bg-white/5 rounded-lg p-2">
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-0.5">Phân loại</p>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 truncate">{fee.category || 'N/A'}</p>
                  </div>
                  <div className="bg-stone-50 dark:bg-white/5 rounded-lg p-2">
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-0.5">Năm học</p>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 truncate">{fee.academic_year?.name || 'Tất cả'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-[#2C2420]">
                  <div className="flex gap-2">
                    {fee.is_mandatory && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Bắt buộc</span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${fee.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}>
                      {fee.is_active ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(fee)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-800">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading fee types...
                </td>
              </tr>
            ) : feeTypes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No fee types found. Create one to get started.
                </td>
              </tr>
            ) : (
              feeTypes.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fee.name}</div>
                    {fee.description && (
                      <div className="text-sm text-gray-500">{fee.description}</div>
                    )}
                    {fee.is_mandatory && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                        Mandatory
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {fee.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {formatCurrency(fee.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fee.academic_year?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fee.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {fee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(fee)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-2xl max-w-2xl w-full min-h-[100dvh] sm:min-h-0 sm:max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingFee ? 'Edit Fee Type' : 'Add New Fee Type'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={formData.academic_year_id}
                    onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Not specific to any year</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_mandatory}
                      onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Mandatory Fee</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingFee(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {editingFee ? 'Update' : 'Create'} Fee Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

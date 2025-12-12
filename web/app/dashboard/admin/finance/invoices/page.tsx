'use client'

/**
 * Admin Invoices Management Page
 * Create and manage student invoices
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from "@/components/ui/Card"
import { Icons } from "@/components/ui/Icons"

interface Invoice {
  id: string
  invoice_number: string
  student_id: string
  academic_year_id: string
  issue_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  balance: number
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
  notes: string | null
  created_at: string
  student: {
    id: string
    student_id: string
    full_name: string
    email: string
    grade_level: string
  }
  academic_year: {
    id: string
    name: string
  }
  items?: Array<{
    id: string
    fee_type_id: string
    description: string
    quantity: number
    unit_price: number
    amount: number
    fee_type: {
      id: string
      name: string
      category: string
    }
  }>
}

interface Student {
  id: string
  student_id: string
  full_name: string
  email: string
  grade_level: string
}

interface FeeType {
  id: string
  name: string
  category: string
  amount: number
}

interface AcademicYear {
  id: string
  name: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    student_id: '',
    status: '',
    academic_year_id: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    academic_year_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    items: [] as Array<{
      fee_type_id: string
      description: string
      quantity: number
      unit_price: number
    }>
  })

   
  useEffect(() => {
    fetchStudents()
    fetchFeeTypes()
    fetchAcademicYears()
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchStudents = async () => {
    try {
      const res = await apiFetch('/api/admin/users?role=student&status=active&limit=1000')
      const response = await res.json()
      if (response.success) {
        setStudents(response.data || response.users || [])
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }

  const fetchFeeTypes = async () => {
    try {
      const res = await apiFetch('/api/admin/fee-types?is_active=true')
      const response = await res.json()
      if (response.success) {
        setFeeTypes(response.data || response.fee_types || [])
      }
    } catch (err) {
      console.error('Error fetching fee types:', err)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const res = await apiFetch('/api/admin/academic-years')
      const response = await res.json()
      if (response.success) {
        setAcademicYears(response.data || response.academic_years || [])
      }
    } catch (err) {
      console.error('Error fetching academic years:', err)
    }
  }

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      
      if (filters.student_id) params.append('student_id', filters.student_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.academic_year_id) params.append('academic_year_id', filters.academic_year_id)

      const res = await apiFetch(`/api/admin/finance/invoices?${params}`)
      const response = await res.json()
      
      if (response.success) {
        let filteredInvoices = response.data || response.invoices || []
        
        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredInvoices = filteredInvoices.filter((inv: Invoice) =>
            inv.invoice_number.toLowerCase().includes(searchLower) ||
            inv.student.full_name.toLowerCase().includes(searchLower) ||
            inv.student.student_id.toLowerCase().includes(searchLower)
          )
        }
        
        setInvoices(filteredInvoices)
      } else {
        setError(response.error || 'Failed to fetch invoices')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { fee_type_id: '', description: '', quantity: 1, unit_price: 0 }
      ]
    })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill price when fee type is selected
    if (field === 'fee_type_id') {
      const feeType = feeTypes.find(ft => ft.id === value)
      if (feeType) {
        newItems[index].unit_price = feeType.amount
        newItems[index].description = feeType.name
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const handleCreateInvoice = async () => {
    if (!formData.student_id || !formData.academic_year_id || !formData.due_date) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.items.length === 0) {
      alert('Please add at least one line item')
      return
    }

    setCreating(true)
    try {
      const res = await apiFetch('/api/admin/finance/invoices', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      const response = await res.json()

      if (response.success) {
        alert('Invoice created successfully!')
        setShowCreateModal(false)
        setFormData({
          student_id: '',
          academic_year_id: '',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: '',
          notes: '',
          items: []
        })
        fetchInvoices()
      } else {
        alert(response.error || 'Failed to create invoice')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice'
      alert(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icons.Finance className="w-8 h-8 text-blue-600" />
            Invoices
          </h1>
          <p className="text-gray-500 mt-1">Create and manage student invoices</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icons.Add className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Filter className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Invoice #, Student..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Student */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                value={filters.student_id}
                onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.student_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <select
                value={filters.academic_year_id}
                onChange={(e) => setFilters({ ...filters, academic_year_id: e.target.value })}
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
          </div>
        </CardBody>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Icons.Error className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Icons.Finance className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No invoices found. Create your first invoice to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
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
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {invoice.invoice_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.student.student_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(invoice.issue_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(invoice.due_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(invoice.paid_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-bold ${invoice.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {formatCurrency(invoice.balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/admin/finance/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Icons.View className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>
            </CardHeader>

            <CardBody className="space-y-6">
              {/* Student and Academic Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student *
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} ({student.student_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={formData.academic_year_id}
                    onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">Select Year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Line Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                  >
                    <Icons.Add className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {formData.items.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    No items added. Click "Add Item" to add line items.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="col-span-12 md:col-span-4">
                          <select
                            value={item.fee_type_id}
                            onChange={(e) => handleItemChange(index, 'fee_type_id', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Select Fee Type</option>
                            {feeTypes.map((ft) => (
                              <option key={ft.id} value={ft.id}>
                                {ft.name} ({ft.category})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="col-span-5 md:col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            min="1"
                          />
                        </div>
                        <div className="col-span-5 md:col-span-2">
                          <input
                            type="number"
                            placeholder="Price"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1 text-right flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove Item"
                          >
                            <Icons.Delete className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.items.length > 0 && (
                  <div className="mt-4 text-right">
                    <div className="text-lg font-bold text-gray-900">
                      Total: {formatCurrency(calculateTotal())}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}

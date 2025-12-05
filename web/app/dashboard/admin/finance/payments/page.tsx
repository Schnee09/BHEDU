'use client'

/**
 * Admin Payments Management Page
 * Record and manage student payments
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'

interface Payment {
  id: string
  student_id: string
  payment_date: string
  amount: number
  payment_method_id: string
  reference_number: string | null
  notes: string | null
  received_by: string
  created_at: string
  student: {
    id: string
    student_id: string
    full_name: string
    email: string
    grade_level: string
  }
  payment_method: {
    id: string
    name: string
    type: string
  }
  received_by_user: {
    id: string
    full_name: string
  }
  allocations?: Array<{
    id: string
    invoice_id: string
    amount: number
    invoice: {
      invoice_number: string
      total_amount: number
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

interface PaymentMethod {
  id: string
  name: string
  type: string
  is_active: boolean
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  balance: number
  status: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedStudentInvoices, setSelectedStudentInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    student_id: '',
    payment_method_id: '',
    start_date: '',
    end_date: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method_id: '',
    reference_number: '',
    notes: '',
    allocations: [] as Array<{
      invoice_id: string
      amount: number
    }>
  })

  // Statistics
  const [stats, setStats] = useState({
    total_payments: 0,
    total_amount: 0,
    today_count: 0,
    today_amount: 0
  })

   
  useEffect(() => {
    fetchStudents()
    fetchPaymentMethods()
    fetchPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

   
  useEffect(() => {
    if (formData.student_id) {
      fetchStudentInvoices(formData.student_id)
    } else {
      setSelectedStudentInvoices([])
      setFormData({ ...formData, allocations: [] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.student_id])

  const fetchStudents = async () => {
    try {
      const res = await apiFetch('/api/admin/users?role=student&status=active&limit=1000')
      const response = await res.json()
      if (response.success) {
        setStudents(response.users)
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const res = await apiFetch('/api/admin/finance/payment-methods?is_active=true')
      const response = await res.json()
      if (response.success) {
        setPaymentMethods(response.payment_methods || [])
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err)
    }
  }

  const fetchStudentInvoices = async (studentId: string) => {
    setLoadingInvoices(true)
    try {
      const res = await apiFetch(`/api/admin/finance/invoices?student_id=${studentId}&status=issued&status=overdue`)
      const response = await res.json()
      if (response.success) {
        const unpaidInvoices = (response.data || response.invoices || []).filter((inv: Invoice) => inv.balance > 0)
        setSelectedStudentInvoices(unpaidInvoices)
        
        // Auto-allocate payment amount to invoices
        if (formData.amount) {
          autoAllocatePayment(unpaidInvoices, Number(formData.amount))
        }
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const autoAllocatePayment = (invoices: Invoice[], paymentAmount: number) => {
    const allocations: Array<{ invoice_id: string; amount: number }> = []
    let remainingAmount = paymentAmount

    for (const invoice of invoices) {
      if (remainingAmount <= 0) break
      
      const allocationAmount = Math.min(remainingAmount, invoice.balance)
      allocations.push({
        invoice_id: invoice.id,
        amount: allocationAmount
      })
      remainingAmount -= allocationAmount
    }

    setFormData({ ...formData, allocations })
  }

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      
      if (filters.student_id) params.append('student_id', filters.student_id)
      if (filters.payment_method_id) params.append('payment_method_id', filters.payment_method_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)

      const res = await apiFetch(`/api/admin/finance/payments?${params}`)
      const response = await res.json()
      
      if (response.success) {
        let filteredPayments = response.data || response.payments || []
        
        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredPayments = filteredPayments.filter((payment: Payment) =>
            payment.student.full_name.toLowerCase().includes(searchLower) ||
            payment.student.student_id.toLowerCase().includes(searchLower) ||
            payment.reference_number?.toLowerCase().includes(searchLower)
          )
        }
        
        setPayments(filteredPayments)
        
        // Calculate statistics
        const totalAmount = filteredPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
        const today = new Date().toISOString().split('T')[0]
        const todayPayments = filteredPayments.filter((p: Payment) => p.payment_date.startsWith(today))
        const todayAmount = todayPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
        
        setStats({
          total_payments: filteredPayments.length,
          total_amount: totalAmount,
          today_count: todayPayments.length,
          today_amount: todayAmount
        })
      } else {
        setError(response.error || 'Failed to fetch payments')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAllocationChange = (invoiceId: string, amount: number) => {
    const newAllocations = [...formData.allocations]
    const existingIndex = newAllocations.findIndex(a => a.invoice_id === invoiceId)
    
    if (amount > 0) {
      if (existingIndex >= 0) {
        newAllocations[existingIndex].amount = amount
      } else {
        newAllocations.push({ invoice_id: invoiceId, amount })
      }
    } else {
      if (existingIndex >= 0) {
        newAllocations.splice(existingIndex, 1)
      }
    }
    
    setFormData({ ...formData, allocations: newAllocations })
  }

  const getTotalAllocated = () => {
    return formData.allocations.reduce((sum, a) => sum + a.amount, 0)
  }

  const getUnallocatedAmount = () => {
    return Number(formData.amount) - getTotalAllocated()
  }

  const handleCreatePayment = async () => {
    if (!formData.student_id || !formData.amount || !formData.payment_method_id) {
      alert('Please fill in all required fields')
      return
    }

    const totalAllocated = getTotalAllocated()
    const paymentAmount = Number(formData.amount)

    if (totalAllocated > paymentAmount) {
      alert('Total allocated amount cannot exceed payment amount')
      return
    }

    setCreating(true)
    try {
      const res = await apiFetch('/api/admin/finance/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: paymentAmount
        })
      })
      const response = await res.json()

      if (response.success) {
        alert('Payment recorded successfully!')
        setShowCreateModal(false)
        setFormData({
          student_id: '',
          payment_date: new Date().toISOString().split('T')[0],
          amount: '',
          payment_method_id: '',
          reference_number: '',
          notes: '',
          allocations: []
        })
        setSelectedStudentInvoices([])
        fetchPayments()
      } else {
        alert(response.error || 'Failed to record payment')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment'
      alert(errorMessage)
    } finally {
      setCreating(false)
    }
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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">Record and manage student payments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          + Record Payment
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_payments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_amount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Today's Payments</p>
          <p className="text-2xl font-bold text-blue-600">{stats.today_count}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Today's Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.today_amount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Student, Reference..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              value={filters.student_id}
              onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.student_id})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={filters.payment_method_id}
              onChange={(e) => setFilters({ ...filters, payment_method_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payments found. Record your first payment to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocations
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.student.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.student.student_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.payment_method.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.reference_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.received_by_user.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {payment.allocations && payment.allocations.length > 0 ? (
                        <div className="text-sm">
                          {payment.allocations.map((alloc) => (
                            <div key={alloc.id} className="text-gray-600">
                              {alloc.invoice.invoice_number}: {formatCurrency(alloc.amount)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No allocations</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Student and Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student *
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value })
                      if (selectedStudentInvoices.length > 0) {
                        autoAllocatePayment(selectedStudentInvoices, Number(e.target.value))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method_id}
                    onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} ({method.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Check #, Transaction ID, etc."
                />
              </div>

              {/* Invoice Allocations */}
              {formData.student_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allocate to Invoices (Optional)
                  </label>
                  
                  {loadingInvoices ? (
                    <div className="text-sm text-gray-500 py-4">Loading invoices...</div>
                  ) : selectedStudentInvoices.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4 border border-dashed border-gray-300 rounded p-4 text-center">
                      No unpaid invoices found for this student.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedStudentInvoices.map((invoice) => {
                        const allocation = formData.allocations.find(a => a.invoice_id === invoice.id)
                        return (
                          <div key={invoice.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {invoice.invoice_number}
                              </div>
                              <div className="text-xs text-gray-500">
                                Balance: {formatCurrency(invoice.balance)}
                              </div>
                            </div>
                            <div className="w-40">
                              <input
                                type="number"
                                value={allocation?.amount || 0}
                                onChange={(e) => handleAllocationChange(invoice.id, Number(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                max={invoice.balance}
                              />
                            </div>
                          </div>
                        )
                      })}
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Total Payment:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(Number(formData.amount) || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-700">Total Allocated:</span>
                          <span className="font-bold text-green-600">{formatCurrency(getTotalAllocated())}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-700">Unallocated:</span>
                          <span className={`font-bold ${getUnallocatedAmount() > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                            {formatCurrency(getUnallocatedAmount())}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({
                    student_id: '',
                    payment_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    payment_method_id: '',
                    reference_number: '',
                    notes: '',
                    allocations: []
                  })
                  setSelectedStudentInvoices([])
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                disabled={creating}
              >
                {creating ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

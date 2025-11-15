'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface Payment {
  id: string
  receipt_number: string
  student_account_id: string
  amount: number
  payment_method_id: string
  payment_date: string
  reference_number: string | null
  notes: string | null
  payment_method?: {
    id: string
    name: string
    type: string
  }
  student_account?: {
    id: string
    student?: {
      first_name: string
      last_name: string
      student_id: string
    }
  }
  created_at: string
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  is_active: boolean
}

interface InvoiceAllocation {
  invoice_id: string
  amount: number
}

export default function PaymentsPage() {
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    student_account_id: searchParams.get('student') || '',
    amount: '',
    payment_method_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    allocations: [] as InvoiceAllocation[]
  })

  useEffect(() => {
    Promise.all([fetchPayments(), fetchPaymentMethods()])
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/finance/payments')
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to fetch payments')
      setPayments(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await apiFetch('/api/admin/finance/payment-methods')
      const result = await response.json()
      if (response.ok) {
        setPaymentMethods(result.data?.filter((m: PaymentMethod) => m.is_active) || [])
      }
    } catch (err) {
      console.error('Failed to fetch payment methods:', err)
    }
  }

  const addAllocation = () => {
    setFormData({
      ...formData,
      allocations: [
        ...formData.allocations,
        { invoice_id: '', amount: 0 }
      ]
    })
  }

  const removeAllocation = (index: number) => {
    const newAllocations = formData.allocations.filter((_, i) => i !== index)
    setFormData({ ...formData, allocations: newAllocations })
  }

  const updateAllocation = (index: number, field: keyof InvoiceAllocation, value: string | number) => {
    const newAllocations = [...formData.allocations]
    newAllocations[index] = { ...newAllocations[index], [field]: value }
    setFormData({ ...formData, allocations: newAllocations })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const totalAllocated = formData.allocations.reduce((sum, a) => sum + (parseFloat(a.amount.toString()) || 0), 0)
    const paymentAmount = parseFloat(formData.amount)

    if (totalAllocated > paymentAmount) {
      setError('Total allocated amount cannot exceed payment amount')
      return
    }

    try {
      const response = await apiFetch('/api/admin/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_account_id: formData.student_account_id,
          amount: paymentAmount,
          payment_method_id: formData.payment_method_id,
          payment_date: formData.payment_date,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          allocations: formData.allocations.filter(a => a.invoice_id && a.amount > 0)
        })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to record payment')

      setShowModal(false)
      resetForm()
      fetchPayments()
      
      // Show success with receipt number
      if (result.data?.receipt_number) {
        alert(`Payment recorded successfully!\nReceipt #: ${result.data.receipt_number}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const resetForm = () => {
    setFormData({
      student_account_id: '',
      amount: '',
      payment_method_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: '',
      allocations: []
    })
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

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const studentName = `${payment.student_account?.student?.first_name} ${payment.student_account?.student?.last_name}`.toLowerCase()
    const studentId = payment.student_account?.student?.student_id.toLowerCase() || ''
    const receiptNumber = payment.receipt_number.toLowerCase()
    return studentName.includes(search) || studentId.includes(search) || receiptNumber.includes(search)
  })

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    today: payments.filter(p => 
      new Date(p.payment_date).toDateString() === new Date().toDateString()
    ).length,
    todayAmount: payments
      .filter(p => new Date(p.payment_date).toDateString() === new Date().toDateString())
      .reduce((sum, p) => sum + p.amount, 0)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Record Payment
        </button>
      </div>

      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Payments</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Collected</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalAmount)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Today&apos;s Payments</div>
          <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Today&apos;s Collection</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(stats.todayAmount)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Payments
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by receipt #, student name or ID..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Loading payments...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.receipt_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.student_account?.student?.first_name}{' '}
                      {payment.student_account?.student?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.student_account?.student?.student_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {payment.payment_method?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.reference_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => window.print()}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Print Receipt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Record Payment</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Account ID *
                    </label>
                    <input
                      type="text"
                      value={formData.student_account_id}
                      onChange={(e) => setFormData({ ...formData, student_account_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                      placeholder="Enter student account ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={formData.payment_method_id}
                      onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} ({method.type})
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
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
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
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Check #, transaction ID, etc."
                  />
                </div>

                {/* Invoice Allocations */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Invoice Allocations (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={addAllocation}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      + Add Allocation
                    </button>
                  </div>

                  {formData.allocations.length > 0 && (
                    <div className="space-y-2">
                      {formData.allocations.map((allocation, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={allocation.invoice_id}
                            onChange={(e) => updateAllocation(index, 'invoice_id', e.target.value)}
                            placeholder="Invoice ID"
                            className="flex-1 px-3 py-2 border rounded-md"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={allocation.amount}
                            onChange={(e) => updateAllocation(index, 'amount', parseFloat(e.target.value))}
                            placeholder="Amount"
                            className="w-32 px-3 py-2 border rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeAllocation(index)}
                            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="text-sm text-gray-600 mt-2">
                        Total Allocated: {formatCurrency(formData.allocations.reduce((sum, a) => sum + (parseFloat(a.amount.toString()) || 0), 0))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
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
                    Record Payment
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

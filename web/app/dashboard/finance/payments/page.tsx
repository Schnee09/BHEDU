'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'

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
          <div className="text-sm text-slate-700 font-medium mb-1">Total Payments</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-slate-700 font-medium mb-1">Total Collected</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalAmount)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-slate-700 font-medium mb-1">Today&apos;s Payments</div>
          <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-slate-700 font-medium mb-1">Today&apos;s Collection</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(stats.todayAmount)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
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

      {/* Payments List */}
      <div className="bg-white dark:bg-stone-900 rounded-lg shadow overflow-hidden">

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-3 mobile-card-list">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading payments...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No payments found.</div>
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-[#2C2420] active:scale-[0.98] transition-all relative overflow-hidden"
              >
                {/* Top Shine */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />

                {/* Header with receipt and amount */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">
                      {payment.receipt_number}
                    </p>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base leading-tight truncate">
                      {payment.student_account?.student?.first_name}{' '}
                      {payment.student_account?.student?.last_name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      ID: {payment.student_account?.student?.student_id}
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-xl flex-shrink-0 ml-2 border border-emerald-100 dark:border-emerald-800/50">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-stone-50/50 dark:bg-white/5 rounded-xl p-3">
                  <div className="rounded-lg">
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-widest mb-1">Phương thức</p>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                      {payment.payment_method?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="rounded-lg">
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-widest mb-1">Ngày thu</p>
                    <p className="font-bold text-stone-800 dark:text-stone-200 text-sm">{formatDate(payment.payment_date)}</p>
                  </div>
                </div>

                {/* Reference and Action */}
                <div className="pt-4 border-t border-stone-100 dark:border-[#2C2420] flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    <span className="text-xs font-medium">Ref: {payment.reference_number || '-'}</span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white dark:bg-[#2C2420] text-blue-600 dark:text-blue-400 border border-stone-200 dark:border-[#3D342C] rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-stone-50 dark:hover:bg-[#3D342C] transition-all active:scale-95"
                  >
                    In biên lai
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto table-scroll-container">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-700">
            <thead className="bg-gray-50 dark:bg-stone-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-stone-900 divide-y divide-gray-200 dark:divide-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {payment.receipt_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.student_account?.student?.first_name}{' '}
                        {payment.student_account?.student?.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payment.student_account?.student?.student_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                        {payment.payment_method?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.reference_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => window.print()}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-2xl max-w-3xl w-full min-h-[100dvh] sm:min-h-0 sm:max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
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

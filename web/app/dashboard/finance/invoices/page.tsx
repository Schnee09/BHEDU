'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { ResponsiveTable, MobileCard } from '@/components/ui/ResponsiveTable'

interface Invoice {
  id: string
  invoice_number: string
  student_account_id: string
  issue_date: string
  due_date: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  balance: number
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  notes: string | null
  student_account?: {
    id: string
    student?: {
      first_name: string
      last_name: string
      student_id: string
    }
    academic_year?: {
      name: string
    }
  }
  created_at: string
}

interface FeeType {
  id: string
  name: string
  amount: number
  category: string | null
}

interface InvoiceItem {
  fee_type_id: string
  description: string
  quantity: number
  unit_price: number
  discount: number
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    student_account_id: '',
    due_date: '',
    discount_amount: '0',
    tax_amount: '0',
    notes: '',
    items: [] as InvoiceItem[]
  })

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchFeeTypes()])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const response = await apiFetch(`/api/admin/finance/invoices?${params}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to fetch invoices')
      setInvoices(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchFeeTypes = async () => {
    try {
      const response = await apiFetch('/api/admin/finance/fee-types')
      const result = await response.json()
      if (response.ok) {
        setFeeTypes(result.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch fee types:', err)
    }
  }

  useEffect(() => {
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus])

  const addInvoiceItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          fee_type_id: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount: 0
        }
      ]
    })
  }

  const removeInvoiceItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-fill description and unit price when fee type is selected
    if (field === 'fee_type_id' && value) {
      const feeType = feeTypes.find(f => f.id === value)
      if (feeType) {
        newItems[index].description = feeType.name
        newItems[index].unit_price = feeType.amount
      }
    }

    setFormData({ ...formData, items: newItems })
  }

  const calculateTotal = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price - item.discount),
      0
    )
    const discount = parseFloat(formData.discount_amount) || 0
    const tax = parseFloat(formData.tax_amount) || 0
    return subtotal - discount + tax
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.items.length === 0) {
      setError('Please add at least one invoice item')
      return
    }

    try {
      const response = await apiFetch('/api/admin/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_account_id: formData.student_account_id,
          due_date: formData.due_date,
          discount_amount: parseFloat(formData.discount_amount) || 0,
          tax_amount: parseFloat(formData.tax_amount) || 0,
          notes: formData.notes || null,
          items: formData.items
        })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to create invoice')

      setShowModal(false)
      resetForm()
      fetchInvoices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const resetForm = () => {
    setFormData({
      student_account_id: '',
      due_date: '',
      discount_amount: '0',
      tax_amount: '0',
      notes: '',
      items: []
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const studentName = `${invoice.student_account?.student?.first_name} ${invoice.student_account?.student?.last_name}`.toLowerCase()
    const studentId = invoice.student_account?.student?.student_id.toLowerCase() || ''
    const invoiceNumber = invoice.invoice_number.toLowerCase()
    return studentName.includes(search) || studentId.includes(search) || invoiceNumber.includes(search)
  })

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.paid_amount, 0),
    totalBalance: invoices.reduce((sum, inv) => sum + inv.balance, 0),
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Create Invoice
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
          <div className="text-sm text-gray-600 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.totalAmount)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalPaid)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Outstanding Balance</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalBalance)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Invoice
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, student name or ID..."
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <ResponsiveTable
        mobileView={
          <div className="space-y-4 pb-20">
            {filteredInvoices.map((invoice) => (
              <MobileCard
                key={invoice.id}
                title={invoice.invoice_number}
                subtitle={`${invoice.student_account?.student?.first_name} ${invoice.student_account?.student?.last_name}`}
                status={{
                  label: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
                  color: invoice.status === 'paid' ? 'green' : (invoice.status === 'overdue' ? 'red' : 'yellow')
                }}
                fields={[
                  { label: "ID Học sinh", value: invoice.student_account?.student?.student_id || '---' },
                  { label: "Ngày hết hạn", value: formatDate(invoice.due_date) },
                  { label: "Tổng tiền", value: formatCurrency(invoice.total_amount) },
                  { 
                    label: "Còn lại", 
                    value: (
                      <span className={invoice.balance > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                        {formatCurrency(invoice.balance)}
                      </span>
                    ) 
                  },
                ]}
                actions={
                  <>
                    <Link
                      href={`/dashboard/finance/invoices/${invoice.id}`}
                      className="flex-1 py-2.5 bg-white dark:bg-[#2C2420] border border-stone-200 dark:border-[#3D342C] rounded-xl text-xs font-bold uppercase tracking-wider text-center"
                    >
                      Chi tiết
                    </Link>
                    {invoice.balance > 0 && (
                      <Link
                        href={`/dashboard/finance/payments?invoice=${invoice.id}`}
                        className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center"
                      >
                        Thanh toán
                      </Link>
                    )}
                  </>
                }
              />
            ))}
            {filteredInvoices.length === 0 && !loading && (
              <div className="text-center py-12 text-stone-500 bg-white dark:bg-[#1A1410] rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                Không tìm thấy hóa đơn nào.
              </div>
            )}
            {loading && (
              <div className="text-center py-12 text-stone-500">
                Đang tải hóa đơn...
              </div>
            )}
          </div>
        }
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-700">
          <thead className="bg-gray-50 dark:bg-stone-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hóa đơn #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Học sinh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ngày phát hành
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ngày đến hạn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tổng cộng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Số dư
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-stone-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy hóa đơn nào.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invoice.student_account?.student?.first_name}{' '}
                      {invoice.student_account?.student?.last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {invoice.student_account?.student?.student_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    <span className={invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(invoice.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/finance/invoices/${invoice.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Xem
                    </Link>
                    {invoice.balance > 0 && (
                      <Link
                        href={`/dashboard/finance/payments?invoice=${invoice.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Thu
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ResponsiveTable>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Create New Invoice</h2>

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
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Invoice Items *
                    </label>
                    <button
                      type="button"
                      onClick={addInvoiceItem}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border p-3 rounded-md">
                        <div className="grid grid-cols-6 gap-2 mb-2">
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Fee Type</label>
                            <select
                              value={item.fee_type_id}
                              onChange={(e) => updateInvoiceItem(index, 'fee_type_id', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              required
                            >
                              <option value="">Select fee type</option>
                              {feeTypes.map(fee => (
                                <option key={fee.id} value={fee.id}>
                                  {fee.name} - {formatCurrency(fee.amount)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border rounded text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value))}
                              className="w-full px-2 py-1 border rounded text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Discount</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateInvoiceItem(index, 'discount', parseFloat(e.target.value))}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeInvoiceItem(index)}
                              className="w-full px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            required
                          />
                        </div>
                        <div className="text-right mt-2">
                          <span className="text-sm font-semibold">
                            Item Total: {formatCurrency(item.quantity * item.unit_price - item.discount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Discount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.tax_amount}
                      onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="w-full">
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculateTotal())}
                      </div>
                    </div>
                  </div>
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
                    Create Invoice
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

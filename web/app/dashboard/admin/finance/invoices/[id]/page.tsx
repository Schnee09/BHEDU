'use client'

/**
 * Admin Invoice Details Page
 * View and manage individual invoice
 */

import { useState, useEffect, use, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface InvoiceDetails {
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
  updated_at: string
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
  items: Array<{
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
  payment_allocations?: Array<{
    id: string
    payment_id: string
    amount: number
    created_at: string
    payment: {
      id: string
      payment_date: string
      amount: number
      reference_number: string | null
      payment_method: {
        id: string
        name: string
      }
      received_by_user: {
        id: string
        full_name: string
      }
    }
  }>
}

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchInvoice = useCallback(async () => {
    if (!resolvedParams) return

    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/admin/finance/invoices/${resolvedParams.id}`)
      const response = await res.json()

      if (response.success) {
        setInvoice(response.invoice)
      } else {
        setError(response.error || 'Failed to fetch invoice')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams])

  useEffect(() => {
    if (resolvedParams) {
      fetchInvoice()
    }
  }, [resolvedParams, fetchInvoice])

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return
    if (!confirm(`Are you sure you want to change status to ${newStatus.toUpperCase()}?`)) return

    setUpdating(true)
    try {
      const res = await apiFetch(`/api/admin/finance/invoices/${invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      const response = await res.json()

      if (response.success) {
        alert('Status updated successfully!')
        fetchInvoice()
      } else {
        alert(response.error || 'Failed to update status')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status'
      alert(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return

    setUpdating(true)
    try {
      const res = await apiFetch(`/api/admin/finance/invoices/${invoice.id}`, {
        method: 'DELETE'
      })
      const response = await res.json()

      if (response.success) {
        alert('Invoice deleted successfully!')
        router.push('/dashboard/admin/finance/invoices')
      } else {
        alert(response.error || 'Failed to delete invoice')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice'
      alert(errorMessage)
    } finally {
      setUpdating(false)
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
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
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
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading invoice details...
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Invoice not found'}
        </div>
        <Link
          href="/dashboard/admin/finance/invoices"
          className="inline-block mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Invoices
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/finance/invoices"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to Invoices
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="text-gray-600 mt-2">
              Issued {formatDate(invoice.issue_date)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(invoice.status)}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student & Invoice Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill To</h2>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{invoice.student.full_name}</p>
                  <p className="text-gray-600 text-sm">ID: {invoice.student.student_id}</p>
                  <p className="text-gray-600 text-sm">{invoice.student.email}</p>
                  <p className="text-gray-600 text-sm">Grade: {invoice.student.grade_level}</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Invoice Number:</span>
                    <span className="text-gray-900 text-sm font-medium">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Academic Year:</span>
                    <span className="text-gray-900 text-sm font-medium">{invoice.academic_year.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Issue Date:</span>
                    <span className="text-gray-900 text-sm font-medium">{formatDate(invoice.issue_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Due Date:</span>
                    <span className="text-gray-900 text-sm font-medium">{formatDate(invoice.due_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{item.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 capitalize">{item.fee_type.category}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payment_allocations && invoice.payment_allocations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
              <div className="space-y-3">
                {invoice.payment_allocations.map((allocation) => (
                  <div key={allocation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(allocation.payment.payment_date)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Method: {allocation.payment.payment_method.name}
                        </div>
                        {allocation.payment.reference_number && (
                          <div className="text-sm text-gray-600">
                            Ref: {allocation.payment.reference_number}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Received by: {allocation.payment.received_by_user.full_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(allocation.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Summary & Actions */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paid Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(invoice.paid_amount)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-gray-900 font-medium">Balance Due:</span>
                <span className={`text-xl font-bold ${invoice.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              {invoice.balance > 0 && (
                <Link
                  href={`/dashboard/admin/finance/payments?student_id=${invoice.student_id}`}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center block"
                >
                  Record Payment
                </Link>
              )}

              {invoice.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('issued')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={updating}
                >
                  Issue Invoice
                </button>
              )}

              {invoice.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  disabled={updating}
                >
                  Cancel Invoice
                </button>
              )}

              <Link
                href={`/dashboard/admin/finance/student-accounts?student_id=${invoice.student_id}`}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-center block"
              >
                View Student Account
              </Link>

              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={updating}
              >
                Delete Invoice
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Created: {formatDate(invoice.created_at)}</div>
              <div>Updated: {formatDate(invoice.updated_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

/**
 * Admin Student Account Details Page
 * View individual student financial account with transaction history
 */

import { useState, useEffect, use } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StudentAccount {
  id: string
  student_id: string
  academic_year_id: string
  total_charges: number
  total_payments: number
  balance: number
  status: 'active' | 'inactive' | 'suspended'
  last_payment_date: string | null
  created_at: string
  updated_at: string
  student: {
    id: string
    student_id: string
    full_name: string
    email: string
    phone: string | null
    grade_level: string
    section: string | null
    enrollment_status: string
  }
  academic_year: {
    id: string
    name: string
    start_date: string
    end_date: string
  }
}

interface Invoice {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  balance: number
  status: string
}

interface Payment {
  id: string
  payment_date: string
  amount: number
  reference_number: string | null
  notes: string | null
  payment_method: {
    id: string
    name: string
  }
  received_by_user: {
    id: string
    full_name: string
  }
  allocations: Array<{
    id: string
    invoice_id: string
    amount: number
    invoice: {
      invoice_number: string
    }
  }>
}

export default function StudentAccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [account, setAccount] = useState<StudentAccount | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments'>('overview')

  useEffect(() => {
    if (resolvedParams) {
      fetchAccountDetails()
    }
  }, [resolvedParams])

  const fetchAccountDetails = async () => {
    if (!resolvedParams) return

    setLoading(true)
    setError(null)
    try {
      // Fetch account details
      const accountRes = await apiFetch(`/api/admin/finance/student-accounts/${resolvedParams.id}`)
      const accountResponse = await accountRes.json()

      if (!accountResponse.success) {
        setError(accountResponse.error || 'Failed to fetch account')
        setLoading(false)
        return
      }

      setAccount(accountResponse.account)

      // Fetch invoices for this student
      const invoicesRes = await apiFetch(`/api/admin/finance/invoices?student_id=${accountResponse.account.student_id}`)
      const invoicesResponse = await invoicesRes.json()
      if (invoicesResponse.success) {
        setInvoices(invoicesResponse.invoices || [])
      }

      // Fetch payments for this student
      const paymentsRes = await apiFetch(`/api/admin/finance/payments?student_id=${accountResponse.account.student_id}`)
      const paymentsResponse = await paymentsRes.json()
      if (paymentsResponse.success) {
        setPayments(paymentsResponse.payments || [])
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account details'
      setError(errorMessage)
    } finally {
      setLoading(false)
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading account details...
        </div>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Account not found'}
        </div>
        <Link
          href="/dashboard/admin/finance/student-accounts"
          className="inline-block mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Student Accounts
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/finance/student-accounts"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to Student Accounts
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {account.student.full_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Student ID: {account.student.student_id} • {account.student.grade_level}
              {account.student.section && ` - ${account.student.section}`}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Academic Year: {account.academic_year.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(account.status)}
            {getStatusBadge(account.student.enrollment_status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm text-gray-600 mb-1">Total Charges</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(account.total_charges)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm text-gray-600 mb-1">Total Payments</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(account.total_payments)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm text-gray-600 mb-1">Balance</div>
              <div className={`text-2xl font-bold ${account.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                {formatCurrency(account.balance)}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'invoices'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'payments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Payments ({payments.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                      {/* Recent Invoices */}
                      {invoices.slice(0, 3).map((invoice) => (
                        <div key={invoice.id} className="flex justify-between items-center border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Invoice {invoice.invoice_number}
                            </div>
                            <div className="text-xs text-gray-600">
                              Issued: {formatDate(invoice.issue_date)} • Due: {formatDate(invoice.due_date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrency(invoice.balance)}
                            </div>
                            <div>{getStatusBadge(invoice.status)}</div>
                          </div>
                        </div>
                      ))}

                      {/* Recent Payments */}
                      {payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center border-l-4 border-green-500 bg-green-50 p-3 rounded">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Payment {payment.reference_number || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatDate(payment.payment_date)} • {payment.payment_method.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                          </div>
                        </div>
                      ))}

                      {invoices.length === 0 && payments.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </div>

                  {account.last_payment_date && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Last Payment</div>
                      <div className="text-lg font-medium text-gray-900 mt-1">
                        {formatDate(account.last_payment_date)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Invoices Tab */}
              {activeTab === 'invoices' && (
                <div>
                  {invoices.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No invoices found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Invoice #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Issue Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Due Date
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Paid
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Balance
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {invoice.invoice_number}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDate(invoice.issue_date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDate(invoice.due_date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {formatCurrency(invoice.total_amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-green-600">
                                {formatCurrency(invoice.paid_amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                {formatCurrency(invoice.balance)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {getStatusBadge(invoice.status)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Link
                                  href={`/dashboard/admin/finance/invoices/${invoice.id}`}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900">
                              Totals:
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.paid_amount, 0))}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.balance, 0))}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div>
                  {payments.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No payments found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(payment.payment_date)}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {payment.payment_method.name}
                                </div>
                                {payment.reference_number && (
                                  <div className="text-xs text-gray-500">
                                    Ref: {payment.reference_number}
                                  </div>
                                )}
                              </div>
                              
                              {payment.allocations && payment.allocations.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <div className="text-xs text-gray-600">Allocated to:</div>
                                  {payment.allocations.map((alloc) => (
                                    <div key={alloc.id} className="text-xs text-gray-700 ml-4">
                                      • Invoice {alloc.invoice.invoice_number}: {formatCurrency(alloc.amount)}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {payment.notes && (
                                <div className="mt-2 text-xs text-gray-600">
                                  Note: {payment.notes}
                                </div>
                              )}

                              <div className="text-xs text-gray-500 mt-2">
                                Received by: {payment.received_by_user.full_name}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(payment.amount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">Total Payments:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-600">Email</div>
                <div className="text-gray-900 font-medium">{account.student.email}</div>
              </div>
              {account.student.phone && (
                <div>
                  <div className="text-gray-600">Phone</div>
                  <div className="text-gray-900 font-medium">{account.student.phone}</div>
                </div>
              )}
              <div>
                <div className="text-gray-600">Grade Level</div>
                <div className="text-gray-900 font-medium">{account.student.grade_level}</div>
              </div>
              {account.student.section && (
                <div>
                  <div className="text-gray-600">Section</div>
                  <div className="text-gray-900 font-medium">{account.student.section}</div>
                </div>
              )}
              <div>
                <div className="text-gray-600">Enrollment Status</div>
                <div className="mt-1">{getStatusBadge(account.student.enrollment_status)}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/admin/finance/invoices?student_id=${account.student_id}`}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center block"
              >
                Create Invoice
              </Link>
              <Link
                href={`/dashboard/admin/finance/payments?student_id=${account.student_id}`}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center block"
              >
                Record Payment
              </Link>
              <Link
                href={`/dashboard/students/${account.student.id}`}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-center block"
              >
                View Student Profile
              </Link>
            </div>
          </div>

          {/* Account Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Invoices:</span>
                <span className="text-gray-900 font-medium">{invoices.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Invoices:</span>
                <span className="text-green-600 font-medium">
                  {invoices.filter(i => i.status === 'paid').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overdue Invoices:</span>
                <span className="text-red-600 font-medium">
                  {invoices.filter(i => i.status === 'overdue').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Payments:</span>
                <span className="text-gray-900 font-medium">{payments.length}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="text-gray-900 font-medium">Payment Rate:</span>
                <span className="text-gray-900 font-medium">
                  {account.total_charges > 0
                    ? Math.round((account.total_payments / account.total_charges) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Account Metadata</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Created: {formatDate(account.created_at)}</div>
              <div>Updated: {formatDate(account.updated_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

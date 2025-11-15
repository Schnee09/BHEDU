'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface StudentAccount {
  id: string
  student_id: string
  academic_year_id: string
  balance: number
  total_invoiced: number
  total_paid: number
  total_discounts: number
  status: 'paid' | 'partial' | 'overdue' | 'pending'
  student?: {
    id: string
    first_name: string
    last_name: string
    student_id: string
    email: string | null
    phone: string | null
  }
  academic_year?: {
    id: string
    name: string
    start_date: string
    end_date: string
  }
  last_payment_date: string | null
  created_at: string
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
  receipt_number: string
  amount: number
  payment_date: string
  payment_method?: {
    name: string
    type: string
  }
  reference_number: string | null
}

export default function StudentAccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string

  const [account, setAccount] = useState<StudentAccount | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments'>('overview')

  useEffect(() => {
    fetchAccountDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  const fetchAccountDetails = async () => {
    try {
      setLoading(true)

      // Fetch account details
      const accountResponse = await fetch(`/api/admin/finance/student-accounts?id=${accountId}`)
      const accountResult = await accountResponse.json()

      if (!accountResponse.ok) throw new Error(accountResult.error || 'Failed to fetch account')
      
      const accountData = accountResult.data?.[0]
      if (!accountData) throw new Error('Account not found')
      
      setAccount(accountData)

      // Fetch invoices for this account
      const invoicesResponse = await fetch(`/api/admin/finance/invoices?student_account_id=${accountId}`)
      const invoicesResult = await invoicesResponse.json()
      if (invoicesResponse.ok) {
        setInvoices(invoicesResult.data || [])
      }

      // Fetch payments for this account
      const paymentsResponse = await fetch(`/api/admin/finance/payments?student_account_id=${accountId}`)
      const paymentsResult = await paymentsResponse.json()
      if (paymentsResponse.ok) {
        setPayments(paymentsResult.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading account details...</div>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Account not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/finance/accounts')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Accounts
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.push('/dashboard/finance/accounts')}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            ← Back to Accounts
          </button>
          <h1 className="text-2xl font-bold">
            {account.student?.first_name} {account.student?.last_name}
          </h1>
          <p className="text-gray-600">Student ID: {account.student?.student_id}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-1">Account Status</div>
          <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(account.status)}`}>
            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Invoiced</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(account.total_invoiced)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(account.total_paid)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Outstanding Balance</div>
          <div className={`text-2xl font-bold ${account.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(account.balance)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Discounts</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(account.total_discounts)}
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Full Name</div>
            <div className="font-medium">
              {account.student?.first_name} {account.student?.last_name}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Student ID</div>
            <div className="font-medium">{account.student?.student_id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Email</div>
            <div className="font-medium">{account.student?.email || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Phone</div>
            <div className="font-medium">{account.student?.phone || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Academic Year</div>
            <div className="font-medium">{account.academic_year?.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Last Payment</div>
            <div className="font-medium">
              {account.last_payment_date ? formatDate(account.last_payment_date) : 'No payments yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/finance/invoices?student=${account.student_id}`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Invoice
          </Link>
          <Link
            href={`/dashboard/finance/payments?student=${account.id}`}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Record Payment
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
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
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Payment Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all"
                    style={{
                      width: `${account.total_invoiced > 0 ? (account.total_paid / account.total_invoiced) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {account.total_invoiced > 0
                    ? `${Math.round((account.total_paid / account.total_invoiced) * 100)}% paid`
                    : '0% paid'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Recent Invoices</h4>
                  {invoices.slice(0, 3).length === 0 ? (
                    <p className="text-sm text-gray-500">No invoices yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {invoices.slice(0, 3).map(invoice => (
                        <li key={invoice.id} className="text-sm">
                          <Link
                            href={`/dashboard/finance/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {invoice.invoice_number}
                          </Link>
                          <span className="text-gray-600"> - {formatCurrency(invoice.total_amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Recent Payments</h4>
                  {payments.slice(0, 3).length === 0 ? (
                    <p className="text-sm text-gray-500">No payments yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {payments.slice(0, 3).map(payment => (
                        <li key={payment.id} className="text-sm">
                          <span className="font-medium">{payment.receipt_number}</span>
                          <span className="text-gray-600"> - {formatCurrency(payment.amount)}</span>
                          <span className="text-gray-500 text-xs block">{formatDate(payment.payment_date)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    invoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dashboard/finance/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {invoice.invoice_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.issue_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {formatCurrency(invoice.paid_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <span className={invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(invoice.balance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.receipt_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {payment.payment_method?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.reference_number || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

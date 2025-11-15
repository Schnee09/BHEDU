'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'

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
  }
  academic_year?: {
    id: string
    name: string
  }
  last_payment_date: string | null
  created_at: string
}

export default function StudentAccountsPage() {
  const [accounts, setAccounts] = useState<StudentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterYear])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterYear !== 'all') params.set('academic_year_id', filterYear)

      const response = await apiFetch(`/api/admin/finance/student-accounts?${params}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to fetch accounts')
      setAccounts(result.data || [])
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

  const filteredAccounts = accounts.filter(account => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const fullName = `${account.student?.first_name} ${account.student?.last_name}`.toLowerCase()
    const studentId = account.student?.student_id.toLowerCase() || ''
    return fullName.includes(search) || studentId.includes(search)
  })

  const stats = {
    total: accounts.length,
    paid: accounts.filter(a => a.status === 'paid').length,
    partial: accounts.filter(a => a.status === 'partial').length,
    overdue: accounts.filter(a => a.status === 'overdue').length,
    pending: accounts.filter(a => a.status === 'pending').length,
    totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
    totalInvoiced: accounts.reduce((sum, a) => sum + a.total_invoiced, 0),
    totalPaid: accounts.reduce((sum, a) => sum + a.total_paid, 0)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Accounts</h1>
        <Link
          href="/dashboard/finance/invoices"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Invoice
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalBalance)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Invoiced</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.totalInvoiced)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Collected</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalPaid)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Collection Rate</div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.totalInvoiced > 0
              ? `${Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-3">Account Status Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Accounts</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Paid</div>
            <div className="text-xl font-bold text-green-600">{stats.paid}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Partial</div>
            <div className="text-xl font-bold text-yellow-600">{stats.partial}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Overdue</div>
            <div className="text-xl font-bold text-red-600">{stats.overdue}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-xl font-bold text-blue-600">{stats.pending}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Student
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ID..."
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
              <option value="paid">Paid</option>
              <option value="partial">Partial Payment</option>
              <option value="overdue">Overdue</option>
              <option value="pending">Pending</option>
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
              {/* You can populate this dynamically */}
            </select>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoiced
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Loading accounts...
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No student accounts found.
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {account.student?.first_name} {account.student?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {account.student?.student_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.academic_year?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(account.total_invoiced)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    {formatCurrency(account.total_paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    <span className={account.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(account.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(account.status)}`}>
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/finance/accounts/${account.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/dashboard/finance/payments?student=${account.student_id}`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Add Payment
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

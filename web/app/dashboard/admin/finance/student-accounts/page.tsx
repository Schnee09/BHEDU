'use client'

/**
 * Admin Student Accounts Page
 * View and manage student financial accounts and balances
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'

interface StudentAccount {
  id: string
  student_id: string
  academic_year_id: string
  total_charges: number
  total_payments: number
  balance: number
  status: 'active' | 'paid' | 'overdue'
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
}

interface AcademicYear {
  id: string
  name: string
}

export default function StudentAccountsPage() {
  const [accounts, setAccounts] = useState<StudentAccount[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    academic_year_id: '',
    status: '',
    has_balance: ''
  })

  // Statistics
  const [stats, setStats] = useState({
    total_accounts: 0,
    total_charges: 0,
    total_payments: 0,
    total_balance: 0,
    overdue_count: 0
  })

  useEffect(() => {
    fetchAcademicYears()
    fetchAccounts()
  }, [filters])

  const fetchAcademicYears = async () => {
    try {
      const res = await apiFetch('/api/admin/academic-years')
      const response = await res.json()
      if (response.success) {
        setAcademicYears(response.academic_years)
      }
    } catch (err) {
      console.error('Error fetching academic years:', err)
    }
  }

  const fetchAccounts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      
      if (filters.academic_year_id) params.append('academic_year_id', filters.academic_year_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.has_balance) params.append('has_balance', filters.has_balance)

      const res = await apiFetch(`/api/admin/finance/student-accounts?${params}`)
      const response = await res.json()
      
      if (response.success) {
        let filteredAccounts = response.accounts || []
        
        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredAccounts = filteredAccounts.filter((acc: StudentAccount) =>
            acc.student.full_name.toLowerCase().includes(searchLower) ||
            acc.student.student_id.toLowerCase().includes(searchLower) ||
            acc.student.email.toLowerCase().includes(searchLower)
          )
        }
        
        setAccounts(filteredAccounts)
        
        // Calculate statistics
        const totalCharges = filteredAccounts.reduce((sum: number, acc: StudentAccount) => sum + acc.total_charges, 0)
        const totalPayments = filteredAccounts.reduce((sum: number, acc: StudentAccount) => sum + acc.total_payments, 0)
        const totalBalance = filteredAccounts.reduce((sum: number, acc: StudentAccount) => sum + acc.balance, 0)
        const overdueCount = filteredAccounts.filter((acc: StudentAccount) => acc.status === 'overdue').length
        
        setStats({
          total_accounts: filteredAccounts.length,
          total_charges: totalCharges,
          total_payments: totalPayments,
          total_balance: totalBalance,
          overdue_count: overdueCount
        })
      } else {
        setError(response.error || 'Failed to fetch accounts')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Accounts</h1>
        <p className="text-gray-600 mt-2">Manage student financial accounts and balances</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Accounts</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_accounts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Charges</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.total_charges)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_payments)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Outstanding Balance</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.total_balance)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Overdue Accounts</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue_count}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Student
            </label>
            <input
              type="text"
              placeholder="Name, ID, or Email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={filters.academic_year_id}
              onChange={(e) => setFilters({ ...filters, academic_year_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Balance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Balance
            </label>
            <select
              value={filters.has_balance}
              onChange={(e) => setFilters({ ...filters, has_balance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accounts</option>
              <option value="true">With Balance</option>
              <option value="false">Fully Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No accounts found. Try adjusting your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Charges
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Payments
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
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.student.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.student.student_id} • {account.student.grade_level}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {account.academic_year.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {formatCurrency(account.total_charges)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(account.total_payments)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${account.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {formatCurrency(account.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(account.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/admin/finance/student-accounts/${account.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/dashboard/admin/finance/invoices?student_id=${account.student_id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Invoices
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

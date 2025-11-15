'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'

interface DashboardData {
  total_outstanding: number
  accounts_with_balance: number
  total_collected: number
  payment_count: number
  total_invoiced: number
  paid_invoices: number
  overdue_invoices: number
  account_status: {
    paid: number
    partial: number
    overdue: number
    pending: number
  }
}

export default function FinanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/finance/reports?type=dashboard')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }

      setData(result.data)
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

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Financial Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Financial Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  const collectionRate = data.total_invoiced > 0
    ? (data.total_collected / data.total_invoiced) * 100
    : 0

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/finance/fees"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Fees
          </Link>
          <Link
            href="/dashboard/finance/payments"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Record Payment
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.total_outstanding)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.accounts_with_balance} accounts with balance
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Collected</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.total_collected)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.payment_count} payments received
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Invoiced</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(data.total_invoiced)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.paid_invoices} paid invoices
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Collection Rate</div>
          <div className="text-2xl font-bold text-purple-600">
            {collectionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.overdue_invoices} overdue invoices
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Account Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-3xl font-bold text-green-600">
              {data.account_status.paid}
            </div>
            <div className="text-sm text-gray-600 mt-1">Paid</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded">
            <div className="text-3xl font-bold text-yellow-600">
              {data.account_status.partial}
            </div>
            <div className="text-sm text-gray-600 mt-1">Partial</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded">
            <div className="text-3xl font-bold text-red-600">
              {data.account_status.overdue}
            </div>
            <div className="text-sm text-gray-600 mt-1">Overdue</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-3xl font-bold text-gray-600">
              {data.account_status.pending}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            href="/dashboard/finance/fees"
            className="p-4 border rounded hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">💵</div>
            <div className="text-sm font-medium">Manage Fees</div>
          </Link>
          <Link
            href="/dashboard/finance/accounts"
            className="p-4 border rounded hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium">Student Accounts</div>
          </Link>
          <Link
            href="/dashboard/finance/invoices"
            className="p-4 border rounded hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm font-medium">Create Invoice</div>
          </Link>
          <Link
            href="/dashboard/finance/payments"
            className="p-4 border rounded hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">💳</div>
            <div className="text-sm font-medium">Record Payment</div>
          </Link>
          <Link
            href="/dashboard/finance/reports"
            className="p-4 border rounded hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">View Reports</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

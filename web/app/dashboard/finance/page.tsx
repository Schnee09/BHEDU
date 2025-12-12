'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { Card, StatCard } from '@/components/ui/Card'
import { Icons } from "@/components/ui/Icons";

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
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(data.total_outstanding)}
          subtitle={`${data.accounts_with_balance} accounts with balance`}
          icon={<Icons.Warning className="w-6 h-6" />}
          color="slate"
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(data.total_collected)}
          subtitle={`${data.payment_count} payments received`}
          icon={<Icons.Finance className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          label="Total Invoiced"
          value={formatCurrency(data.total_invoiced)}
          subtitle={`${data.paid_invoices} paid invoices`}
          icon={<Icons.Grades className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          label="Collection Rate"
          value={`${collectionRate.toFixed(1)}%`}
          subtitle={`${data.overdue_invoices} overdue invoices`}
          icon={<Icons.Chart className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Account Status */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-stone-900">Account Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.paid}
            </div>
            <div className="text-sm text-stone-500 mt-1">Paid</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.partial}
            </div>
            <div className="text-sm text-stone-500 mt-1">Partial</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.overdue}
            </div>
            <div className="text-sm text-stone-500 mt-1">Overdue</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.pending}
            </div>
            <div className="text-sm text-stone-500 mt-1">Pending</div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            href="/dashboard/finance/fees"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Icons.Finance className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Manage Fees</div>
          </Link>
          <Link
            href="/dashboard/finance/accounts"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
              <Icons.Users className="w-6 h-6 text-gray-600 group-hover:text-purple-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Student Accounts</div>
          </Link>
          <Link
            href="/dashboard/finance/invoices"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Icons.Grades className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Create Invoice</div>
          </Link>
          <Link
            href="/dashboard/finance/payments"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
              <Icons.CreditCard className="w-6 h-6 text-gray-600 group-hover:text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Record Payment</div>
          </Link>
          <Link
            href="/dashboard/finance/reports"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
              <Icons.Chart className="w-6 h-6 text-gray-600 group-hover:text-orange-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">View Reports</div>
          </Link>
        </div>
      </Card>
    </div>
  )
}

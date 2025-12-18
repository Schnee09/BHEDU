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
        throw new Error(result.error || 'Không thể tải dữ liệu bảng điều khiển')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Bảng điều khiển tài chính</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Đang tải dữ liệu bảng điều khiển...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Bảng điều khiển tài chính</h1>
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
        <h1 className="text-2xl font-bold">Bảng điều khiển tài chính</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/finance/fees"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quản lý học phí
          </Link>
          <Link
            href="/dashboard/finance/payments"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Ghi nhận thanh toán
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tổng nợ"
          value={formatCurrency(data.total_outstanding)}
          subtitle={`${data.accounts_with_balance} tài khoản có dư nợ`}
          icon={<Icons.Warning className="w-6 h-6" />}
          color="slate"
        />
        <StatCard
          label="Tổng đã thu"
          value={formatCurrency(data.total_collected)}
          subtitle={`${data.payment_count} thanh toán đã nhận`}
          icon={<Icons.Finance className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          label="Tổng hóa đơn"
          value={formatCurrency(data.total_invoiced)}
          subtitle={`${data.paid_invoices} hóa đơn đã thanh toán`}
          icon={<Icons.Grades className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          label="Tỷ lệ thu"
          value={`${collectionRate.toFixed(1)}%`}
          subtitle={`${data.overdue_invoices} hóa đơn quá hạn`}
          icon={<Icons.Chart className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Account Status */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-stone-900">Tổng quan trạng thái tài khoản</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.paid}
            </div>
            <div className="text-sm text-stone-500 mt-1">Đã thanh toán</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.partial}
            </div>
            <div className="text-sm text-stone-500 mt-1">Thanh toán một phần</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.overdue}
            </div>
            <div className="text-sm text-stone-500 mt-1">Quá hạn</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded">
            <div className="text-3xl font-bold text-stone-600">
              {data.account_status.pending}
            </div>
            <div className="text-sm text-stone-500 mt-1">Đang chờ</div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Hành động nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            href="/dashboard/finance/fees"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Icons.Finance className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Quản lý học phí</div>
          </Link>
          <Link
            href="/dashboard/finance/accounts"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
              <Icons.Users className="w-6 h-6 text-gray-600 group-hover:text-purple-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Tài khoản học sinh</div>
          </Link>
          <Link
            href="/dashboard/finance/invoices"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Icons.Grades className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Tạo hóa đơn</div>
          </Link>
          <Link
            href="/dashboard/finance/payments"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
              <Icons.CreditCard className="w-6 h-6 text-gray-600 group-hover:text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Ghi nhận thanh toán</div>
          </Link>
          <Link
            href="/dashboard/finance/reports"
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group"
          >
            <div className="p-2 bg-gray-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
              <Icons.Chart className="w-6 h-6 text-gray-600 group-hover:text-orange-600" />
            </div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Xem báo cáo</div>
          </Link>
        </div>
      </Card>
    </div>
  )
}

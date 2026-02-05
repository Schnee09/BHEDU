'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch, getFinanceReports } from '@/lib/api/client'
import { Card, StatCard } from '@/components/ui/Card'
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

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
      // Use V2 Client
      const result = await getFinanceReports('dashboard')
      setData(result)
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 glass-premium p-6 md:p-8 rounded-[40px] border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tighter text-stone-900 dark:text-stone-100 mb-2">Quản lý Tài chính</h1>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Theo dõi dư nợ, hóa đơn và tỷ lệ thu học phí toàn hệ thống.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3 relative z-10">
          <Link
            href="/dashboard/finance/fees"
            className="flex-1 md:flex-none h-12 flex items-center justify-center px-6 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 press-effect transition-all"
          >
            Quản lý học phí
          </Link>
          <Link
            href="/dashboard/finance/payments"
            className="flex-1 md:flex-none h-12 flex items-center justify-center px-6 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 press-effect transition-all"
          >
            Thanh toán
          </Link>
        </div>
      </div>

      {/* Key Metrics - Optimized for Mobile Density */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
        <StatCard
          label="Tổng dư nợ"
          value={formatCurrency(data.total_outstanding)}
          subtitle={`${data.accounts_with_balance} tài khoản`}
          icon={<Icons.Warning className="w-5 h-5 md:w-6 md:h-6" />}
          color="slate"
          className="glass-premium rounded-[28px] border-white/10"
        />
        <StatCard
          label="Tổng đã thu"
          value={formatCurrency(data.total_collected)}
          subtitle={`${data.payment_count} lượt`}
          icon={<Icons.Finance className="w-5 h-5 md:w-6 md:h-6" />}
          color="green"
          className="glass-premium rounded-[28px] border-white/10"
        />
        <StatCard
          label="Tổng hóa đơn"
          value={formatCurrency(data.total_invoiced)}
          subtitle={`${data.paid_invoices} đã xong`}
          icon={<Icons.Grades className="w-5 h-5 md:w-6 md:h-6" />}
          color="orange"
          className="glass-premium rounded-[28px] border-white/10"
        />
        <StatCard
          label="Tỷ lệ thu"
          value={`${collectionRate.toFixed(1)}%`}
          subtitle={`${data.overdue_invoices} quá hạn`}
          icon={<Icons.Chart className="w-5 h-5 md:w-6 md:h-6" />}
          color="purple"
          className="glass-premium rounded-[28px] border-white/10"
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

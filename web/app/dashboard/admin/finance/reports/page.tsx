'use client'

/**
 * Admin Financial Reports Page
 * View financial statistics, trends, and generate reports
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'

interface ReportData {
  summary: {
    total_revenue: number
    total_outstanding: number
    total_invoices: number
    total_payments: number
    paid_invoices: number
    overdue_invoices: number
    average_invoice_amount: number
    average_payment_amount: number
  }
  by_category: Array<{
    category: string
    total_amount: number
    invoice_count: number
  }>
  by_grade_level: Array<{
    grade_level: string
    total_charges: number
    total_payments: number
    balance: number
    student_count: number
  }>
  by_month: Array<{
    month: string
    invoices_issued: number
    invoices_amount: number
    payments_received: number
    payments_amount: number
  }>
  payment_methods: Array<{
    method_name: string
    payment_count: number
    total_amount: number
  }>
  top_debtors: Array<{
    student_id: string
    student_name: string
    grade_level: string
    balance: number
  }>
}

interface AcademicYear {
  id: string
  name: string
}

export default function FinancialReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    academic_year_id: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  useEffect(() => {
    if (filters.academic_year_id || (filters.start_date && filters.end_date)) {
      fetchReportData()
    }
  }, [filters])

  const fetchAcademicYears = async () => {
    try {
      const res = await apiFetch('/api/admin/academic-years')
      const response = await res.json()
      if (response.success) {
        setAcademicYears(response.academic_years)
        // Auto-select current academic year
        const currentYear = response.academic_years.find((y: { is_current: boolean; id: string }) => y.is_current)
        if (currentYear) {
          setFilters({ ...filters, academic_year_id: currentYear.id })
        }
      }
    } catch (err) {
      console.error('Error fetching academic years:', err)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      
      if (filters.academic_year_id) params.append('academic_year_id', filters.academic_year_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)

      const res = await apiFetch(`/api/admin/finance/reports?${params}`)
      const response = await res.json()
      
      if (response.success) {
        setReportData(response.data)
      } else {
        setError(response.error || 'Failed to fetch report data')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch report data'
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const calculateCollectionRate = () => {
    if (!reportData) return 0
    const { total_revenue, total_outstanding } = reportData.summary
    const totalBilled = total_revenue + total_outstanding
    if (totalBilled === 0) return 0
    return (total_revenue / totalBilled) * 100
  }

  const exportToCSV = () => {
    if (!reportData) return
    
    // Create CSV content
    let csv = 'Financial Report\n\n'
    csv += 'Summary\n'
    csv += `Total Revenue,${reportData.summary.total_revenue}\n`
    csv += `Total Outstanding,${reportData.summary.total_outstanding}\n`
    csv += `Total Invoices,${reportData.summary.total_invoices}\n`
    csv += `Total Payments,${reportData.summary.total_payments}\n\n`
    
    csv += 'Revenue by Category\n'
    csv += 'Category,Amount,Invoice Count\n'
    reportData.by_category.forEach(item => {
      csv += `${item.category},${item.total_amount},${item.invoice_count}\n`
    })
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-2">View financial statistics and trends</p>
        </div>
        {reportData && (
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            📥 Export to CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="">Select Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading report data...
        </div>
      ) : !reportData ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Select an academic year or date range to view reports.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.summary.total_revenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.summary.total_payments} payments
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(reportData.summary.total_outstanding)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.summary.overdue_invoices} overdue
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-600">
                {reportData.summary.total_invoices}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.summary.paid_invoices} paid
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatPercentage(calculateCollectionRate())}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Average: {formatCurrency(reportData.summary.average_payment_amount)}
              </p>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Category</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Count
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg per Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.by_category.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(item.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {item.invoice_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.total_amount / item.invoice_count)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Grade Level */}
          {reportData.by_grade_level && reportData.by_grade_level.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">By Grade Level</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade Level
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.by_grade_level.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.grade_level || 'Not Specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {item.student_count}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(item.total_charges)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(item.total_payments)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`text-sm font-bold ${item.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                            {formatCurrency(item.balance)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {reportData.payment_methods && reportData.payment_methods.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Methods</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.payment_methods.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">{item.method_name}</div>
                    <div className="text-xl font-bold text-green-600 mt-1">
                      {formatCurrency(item.total_amount)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.payment_count} transactions
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Debtors */}
          {reportData.top_debtors && reportData.top_debtors.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Outstanding Balances</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.top_debtors.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.student_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.student_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.grade_level}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(item.balance)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Trends */}
          {reportData.by_month && reportData.by_month.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Trends</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoices Issued
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payments Received
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.by_month.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.month}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {item.invoices_issued}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(item.invoices_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {item.payments_received}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(item.payments_amount)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface OutstandingBalance {
  student_id: string
  student_name: string
  student_number: string
  academic_year: string
  total_invoiced: number
  total_paid: number
  balance: number
  status: string
}

interface RevenueReport {
  period: string
  total_revenue: number
  payment_count: number
}

interface CategoryReport {
  category: string
  total_amount: number
  invoice_count: number
}

interface PaymentSummary {
  payment_method: string
  total_amount: number
  transaction_count: number
}

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<'outstanding' | 'revenue' | 'category' | 'payment'>('outstanding')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance[]>([])
  const [revenueReport, setRevenueReport] = useState<RevenueReport[]>([])
  const [categoryReport, setCategoryReport] = useState<CategoryReport[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([])

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    academicYearId: '',
    status: ''
  })

  useEffect(() => {
    fetchReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters])

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = '/api/admin/finance/reports?'
      const params = new URLSearchParams()

      switch (activeTab) {
        case 'outstanding':
          params.set('type', 'outstanding')
          if (filters.academicYearId) params.set('academic_year_id', filters.academicYearId)
          if (filters.status) params.set('status', filters.status)
          break

        case 'revenue':
          params.set('type', 'revenue')
          params.set('start_date', filters.startDate)
          params.set('end_date', filters.endDate)
          break

        case 'category':
          params.set('type', 'category')
          params.set('start_date', filters.startDate)
          params.set('end_date', filters.endDate)
          break

        case 'payment':
          params.set('type', 'payment_summary')
          params.set('start_date', filters.startDate)
          params.set('end_date', filters.endDate)
          break
      }

      const response = await fetch(url + params.toString())
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to fetch report data')

      switch (activeTab) {
        case 'outstanding':
          setOutstandingBalances(result.data || [])
          break
        case 'revenue':
          setRevenueReport(result.data || [])
          break
        case 'category':
          setCategoryReport(result.data || [])
          break
        case 'payment':
          setPaymentSummary(result.data || [])
          break
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

  const exportToCSV = () => {
    let csvContent = ''
    let filename = ''

    switch (activeTab) {
      case 'outstanding':
        filename = `outstanding-balances-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = 'Student ID,Student Name,Academic Year,Total Invoiced,Total Paid,Balance,Status\n'
        outstandingBalances.forEach(row => {
          csvContent += `${row.student_number},"${row.student_name}",${row.academic_year},${row.total_invoiced},${row.total_paid},${row.balance},${row.status}\n`
        })
        break

      case 'revenue':
        filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = 'Period,Total Revenue,Payment Count\n'
        revenueReport.forEach(row => {
          csvContent += `${row.period},${row.total_revenue},${row.payment_count}\n`
        })
        break

      case 'category':
        filename = `category-report-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = 'Category,Total Amount,Invoice Count\n'
        categoryReport.forEach(row => {
          csvContent += `${row.category},${row.total_amount},${row.invoice_count}\n`
        })
        break

      case 'payment':
        filename = `payment-summary-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = 'Payment Method,Total Amount,Transaction Count\n'
        paymentSummary.forEach(row => {
          csvContent += `${row.payment_method},${row.total_amount},${row.transaction_count}\n`
        })
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export to CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('outstanding')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'outstanding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Outstanding Balances
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'revenue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Revenue Report
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'category'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fee Category Report
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'payment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Methods
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(activeTab === 'revenue' || activeTab === 'category' || activeTab === 'payment') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </>
            )}
            {activeTab === 'outstanding' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={filters.academicYearId}
                    onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">All Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading report data...</div>
        ) : (
          <>
            {activeTab === 'outstanding' && (
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
                      Total Invoiced
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Paid
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
                  {outstandingBalances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No outstanding balances found.
                      </td>
                    </tr>
                  ) : (
                    outstandingBalances.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{row.student_name}</div>
                          <div className="text-sm text-gray-500">{row.student_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.academic_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.total_invoiced)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {formatCurrency(row.total_paid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          {formatCurrency(row.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            row.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            row.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {outstandingBalances.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {formatCurrency(outstandingBalances.reduce((sum, row) => sum + row.total_invoiced, 0))}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                        {formatCurrency(outstandingBalances.reduce((sum, row) => sum + row.total_paid, 0))}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600">
                        {formatCurrency(outstandingBalances.reduce((sum, row) => sum + row.balance, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}

            {activeTab === 'revenue' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueReport.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No revenue data found for this period.
                      </td>
                    </tr>
                  ) : (
                    revenueReport.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {formatCurrency(row.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.payment_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.total_revenue / row.payment_count)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {revenueReport.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                        {formatCurrency(revenueReport.reduce((sum, row) => sum + row.total_revenue, 0))}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {revenueReport.reduce((sum, row) => sum + row.payment_count, 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}

            {activeTab === 'category' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average per Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryReport.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No category data found for this period.
                      </td>
                    </tr>
                  ) : (
                    categoryReport.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                          {formatCurrency(row.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.invoice_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.total_amount / row.invoice_count)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {categoryReport.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">
                        {formatCurrency(categoryReport.reduce((sum, row) => sum + row.total_amount, 0))}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {categoryReport.reduce((sum, row) => sum + row.invoice_count, 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}

            {activeTab === 'payment' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentSummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No payment data found for this period.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const totalAmount = paymentSummary.reduce((sum, row) => sum + row.total_amount, 0)
                      return paymentSummary.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.payment_method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                            {formatCurrency(row.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.transaction_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(row.total_amount / row.transaction_count)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {totalAmount > 0 ? `${Math.round((row.total_amount / totalAmount) * 100)}%` : '0%'}
                          </td>
                        </tr>
                      ))
                    })()
                  )}
                </tbody>
                {paymentSummary.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-purple-600">
                        {formatCurrency(paymentSummary.reduce((sum, row) => sum + row.total_amount, 0))}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {paymentSummary.reduce((sum, row) => sum + row.transaction_count, 0)}
                      </td>
                      <td></td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}

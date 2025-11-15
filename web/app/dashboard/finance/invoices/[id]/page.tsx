'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface InvoiceItem {
  id: string
  fee_type_id: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  amount: number
  fee_type?: {
    name: string
    category: string | null
  }
}

interface Invoice {
  id: string
  invoice_number: string
  student_account_id: string
  issue_date: string
  due_date: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  balance: number
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  notes: string | null
  student_account?: {
    id: string
    student?: {
      id: string
      first_name: string
      last_name: string
      student_id: string
      email: string | null
      phone: string | null
    }
    academic_year?: {
      name: string
    }
  }
  invoice_items?: InvoiceItem[]
  created_at: string
  updated_at: string
}

interface Payment {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_method?: {
    name: string
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoiceDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId])

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true)

      // Fetch invoice details
      const invoiceResponse = await fetch(`/api/admin/finance/invoices?id=${invoiceId}`)
      const invoiceResult = await invoiceResponse.json()

      if (!invoiceResponse.ok) throw new Error(invoiceResult.error || 'Failed to fetch invoice')
      
      const invoiceData = invoiceResult.data?.[0]
      if (!invoiceData) throw new Error('Invoice not found')
      
      setInvoice(invoiceData)

      // Fetch payments for this invoice
      const paymentsResponse = await fetch(`/api/admin/finance/payments?invoice_id=${invoiceId}`)
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
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading invoice details...</div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Invoice not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/finance/invoices')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Invoices
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header - No Print */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <button
            onClick={() => router.push('/dashboard/finance/invoices')}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            ← Back to Invoices
          </button>
          <h1 className="text-2xl font-bold">Invoice Details</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Print Invoice
          </button>
          {invoice.balance > 0 && (
            <Link
              href={`/dashboard/finance/payments?invoice=${invoice.id}`}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Record Payment
            </Link>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">INVOICE</h2>
            <div className="text-gray-600">
              <div>Invoice #: <span className="font-semibold">{invoice.invoice_number}</span></div>
              <div>Issue Date: {formatDate(invoice.issue_date)}</div>
              <div>Due Date: {formatDate(invoice.due_date)}</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
            <div className="text-gray-900">
              <div className="font-semibold">
                {invoice.student_account?.student?.first_name} {invoice.student_account?.student?.last_name}
              </div>
              <div>Student ID: {invoice.student_account?.student?.student_id}</div>
              {invoice.student_account?.student?.email && (
                <div>{invoice.student_account.student.email}</div>
              )}
              {invoice.student_account?.student?.phone && (
                <div>{invoice.student_account.student.phone}</div>
              )}
              <div className="mt-2">Academic Year: {invoice.student_account?.academic_year?.name}</div>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.invoice_items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.fee_type?.category || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between py-2 border-b text-red-600">
                <span>Discount:</span>
                <span className="font-semibold">-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-b-2 border-gray-800">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg">{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between py-2 text-green-600">
              <span>Amount Paid:</span>
              <span className="font-semibold">{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2">
              <span className={`font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Balance Due:
              </span>
              <span className={`font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(invoice.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Notes:</h3>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment History - No Print */}
      {payments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 print:hidden">
          <h2 className="text-lg font-semibold mb-4">Payment History</h2>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-white {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Financial Reports API
 * Provides various financial reports and analytics
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const supabase = createClientFromRequest(request as any)
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') // outstanding, revenue, payment_summary, category
    const academicYearId = searchParams.get('academic_year_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    switch (reportType) {
      case 'outstanding': {
        // Outstanding balances report
        let query = supabase.from('outstanding_balances').select('*')
        
        if (academicYearId) {
          query = query.eq('academic_year_id', academicYearId)
        }

        const { data, error } = await query
        if (error) throw error

        // Calculate summary
        const summary = {
          total_outstanding: data?.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) || 0,
          student_count: data?.length || 0,
          average_balance: data?.length ? (data.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) / data.length) : 0
        }

        return NextResponse.json({ success: true, data, summary })
      }

      case 'revenue': {
        // Revenue summary by period
        let query = supabase
          .from('payments')
          .select('payment_date, amount, payment_method:payment_methods(name)')
          .order('payment_date', { ascending: false })

        if (startDate) query = query.gte('payment_date', startDate)
        if (endDate) query = query.lte('payment_date', endDate)

        const { data, error } = await query
        if (error) throw error

        // Group by month and payment method
        const monthlyRevenue = new Map<string, { total: number; count: number; methods: Map<string, number> }>()
        
        data?.forEach(payment => {
          const month = payment.payment_date.substring(0, 7) // YYYY-MM
          if (!monthlyRevenue.has(month)) {
            monthlyRevenue.set(month, { total: 0, count: 0, methods: new Map() })
          }
          const monthData = monthlyRevenue.get(month)!
          monthData.total += parseFloat(payment.amount)
          monthData.count += 1
          
          const methodObj = payment.payment_method as unknown as { name: string } | null
          const method = methodObj?.name || 'Unknown'
          monthData.methods.set(method, (monthData.methods.get(method) || 0) + parseFloat(payment.amount))
        })

        const revenueData = Array.from(monthlyRevenue.entries()).map(([month, data]) => ({
          month,
          total: data.total,
          transaction_count: data.count,
          payment_methods: Array.from(data.methods.entries()).map(([method, amount]) => ({
            method,
            amount
          }))
        }))

        return NextResponse.json({ success: true, data: revenueData })
      }

      case 'category': {
        // Revenue by fee category
        const { data, error } = await supabase.from('revenue_by_category').select('*')
        if (error) throw error

        return NextResponse.json({ success: true, data })
      }

      case 'payment_summary': {
        // Payment summary from view
        const query = supabase.from('payment_summary').select('*')
        
        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ success: true, data })
      }

      case 'dashboard': {
        // Dashboard overview with multiple metrics
        const [
          outstandingResult,
          paymentsResult,
          invoicesResult,
          accountsResult
        ] = await Promise.all([
          supabase.from('student_accounts').select('balance, status'),
          supabase.from('payments').select('amount, payment_date'),
          supabase.from('invoices').select('status, total_amount, paid_amount'),
          supabase.from('student_accounts').select('status')
        ])

        const dashboard = {
          total_outstanding: outstandingResult.data?.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) || 0,
          accounts_with_balance: outstandingResult.data?.filter(acc => parseFloat(acc.balance || 0) > 0).length || 0,
          total_collected: paymentsResult.data?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0,
          payment_count: paymentsResult.data?.length || 0,
          total_invoiced: invoicesResult.data?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0) || 0,
          paid_invoices: invoicesResult.data?.filter(inv => inv.status === 'paid').length || 0,
          overdue_invoices: invoicesResult.data?.filter(inv => inv.status === 'overdue').length || 0,
          account_status: {
            paid: accountsResult.data?.filter(acc => acc.status === 'paid').length || 0,
            partial: accountsResult.data?.filter(acc => acc.status === 'partial').length || 0,
            overdue: accountsResult.data?.filter(acc => acc.status === 'overdue').length || 0,
            pending: accountsResult.data?.filter(acc => acc.status === 'pending').length || 0
          }
        }

        return NextResponse.json({ success: true, data: dashboard })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: outstanding, revenue, category, payment_summary, or dashboard' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in GET /api/admin/finance/reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

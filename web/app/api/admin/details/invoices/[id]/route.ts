import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { supabase } = await getDataClient(request)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        student:profiles(id, full_name, email),
        academic_year:academic_years(id, name),
        items:invoice_items(*, fee_type:fee_types(id,name,category)),
        payments:payments(*)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching invoice details:', error)
      return NextResponse.json({ error: 'Failed to fetch invoice details' }, { status: 500 })
    }

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: invoice })
  } catch (err) {
    console.error('Error in admin/details/invoices/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

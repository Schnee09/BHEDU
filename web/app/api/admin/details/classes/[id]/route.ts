import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { supabase } = await getDataClient(request)

    const { data: cls, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles(id, first_name, last_name, email),
        academic_year:academic_years(id, name),
        enrollments:enrollments(*, student:profiles(id, full_name, email)),
        assignments:assignments(*, category:assignment_categories(id,name))
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching class details:', error)
      return NextResponse.json({ error: 'Failed to fetch class details' }, { status: 500 })
    }

    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: cls })
  } catch (err) {
    console.error('Error in admin/details/classes/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

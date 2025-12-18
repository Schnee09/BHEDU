import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, staffAuth } from '@/lib/auth/adminAuth'
import { handleApiError } from '@/lib/api/errors'
import { getDataClient } from '@/lib/auth/dataClient'

export const dynamic = 'force-dynamic'

type Body = {
  studentIds: string[]
}

/**
 * POST /api/students/bulk-archive
 * Archives multiple students in one request to avoid rate-limit bursts from the UI.
 *
 * Access: admin, staff
 * Body: { studentIds: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const isStaff = await staffAuth(req)
    const isAdmin = await adminAuth(req)
    if (!isStaff.authorized && !isAdmin.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as Body | null
    const studentIds = body?.studentIds

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds is required' }, { status: 400 })
    }

    // Basic sanity guard to avoid accidentally archiving the entire table.
    if (studentIds.length > 500) {
      return NextResponse.json({ error: 'Too many studentIds (max 500)' }, { status: 400 })
    }

  const { supabase } = await getDataClient(req)

    // Convention in this codebase: "archiving" a student means setting status=inactive / is_active=false.
    // We do this in one update to avoid N delete calls.
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'inactive', is_active: false })
      .in('id', studentIds)
      .eq('role', 'student')
      .select('id')

    if (error) throw error

    const archivedIds = (data || []).map((r: any) => r.id)
    const failedIds = studentIds.filter((id) => !archivedIds.includes(id))

    return NextResponse.json({
      success: true,
      archivedCount: archivedIds.length,
      archivedIds,
      failedIds,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Role-aware Students API
 * GET/POST /api/students
 *
 * Access rules (per user request):
 * - admin: can list all students; can create/edit/delete
 * - staff: can list all students; can create/edit/delete
 * - teacher: can list students in their assigned classes only
 *
 * Notes:
 * - We intentionally keep the canonical UI endpoint under /api/students (Option A)
 *   so /dashboard/* pages don't hardcode /api/admin/*.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateQuery } from '@/lib/api/validation'
import { studentQuerySchema } from '@/lib/schemas/students'
import { handleApiError } from '@/lib/api/errors'
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth, staffAuth, teacherAuth } from '@/lib/auth/adminAuth'
import { GET as adminGET, POST as adminPOST } from '@/app/api/admin/students/route'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await teacherAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 })
    }

    // admin and staff can reuse the existing admin list implementation
    if (auth.userRole === 'admin' || auth.userRole === 'staff') {
      return adminGET(request)
    }

    // teacher: limit to students in teacher's classes
    if (auth.userRole !== 'teacher') {
      // teacherAuth allows other roles (like student) in this repo; deny here.
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { supabase } = await getDataClient(request)
    const queryParams = validateQuery(request, studentQuerySchema)

    const search = queryParams.search || ''
    const page = queryParams.page || 1
    const limit = queryParams.limit || 50
    const offset = (page - 1) * limit

    // Find teacher profile id for the current user
    const { data: teacherProfile, error: tpErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (tpErr || !teacherProfile) {
      return NextResponse.json({ success: true, students: [], total: 0, statistics: null }, { status: 200 })
    }

    // Determine which classes this teacher teaches.
    // Convention in this repo: `classes.teacher_id` references `profiles.id`.
    const { data: classRows, error: classErr } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherProfile.id)

    if (classErr || !classRows || classRows.length === 0) {
      return NextResponse.json({ success: true, students: [], total: 0, statistics: null }, { status: 200 })
    }

    const classIds = classRows.map((c: any) => c.id)

    // Find active enrollments for those classes
    const { data: enrollments, error: enrollErr } = await supabase
      .from('enrollments')
      .select('student_id')
      .in('class_id', classIds)
      .eq('status', 'active')

    if (enrollErr || !enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, students: [], total: 0, statistics: null }, { status: 200 })
    }

    const studentIds = Array.from(new Set(enrollments.map((e: any) => e.student_id)))

    let countQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .in('id', studentIds)

    let dataQuery = supabase
      .from('profiles')
      .select('id, user_id, email, full_name, role, phone, address, date_of_birth, student_code, grade_level, gender, status, is_active, photo_url, enrollment_date, notes, created_at, updated_at')
      .eq('role', 'student')
      .in('id', studentIds)
      .order('full_name', { ascending: true })

    if (search) {
      const searchFilter = `full_name.ilike.%${search}%,email.ilike.%${search}%`
      countQuery = countQuery.or(searchFilter)
      dataQuery = dataQuery.or(searchFilter)
    }

    const { count, error: countError } = await countQuery
    if (countError) throw countError

    const { data, error: dataError } = await dataQuery.range(offset, offset + limit - 1)
    if (dataError) throw dataError

    return NextResponse.json({ success: true, students: data || [], total: count || 0, statistics: null })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  // create is staff/admin only
  const isStaff = await staffAuth(request)
  const isAdmin = await adminAuth(request)
  if (!isStaff.authorized && !isAdmin.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return adminPOST(request)
}

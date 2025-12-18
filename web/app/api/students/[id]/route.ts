/**
 * Role-aware Student Detail API
 * GET/PUT/DELETE /api/students/[id]
 *
 * Option A routing model:
 * - UI pages live under /dashboard/* (role-aware)
 * - /dashboard/admin/* is reserved for admin-only tools
 *
 * This route is a facade over the existing /api/admin/students/[id] handlers.
 * It prevents UI pages from hardcoding /api/admin/* while preserving the
 * existing authorization rules.
 *
 * Note: PUT/DELETE remain admin-only today because the delegated handler
 * enforces adminAuth().
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  GET as adminGET,
  PUT as adminPUT,
  DELETE as adminDELETE,
} from '@/app/api/admin/students/[id]/route'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { adminAuth, staffAuth, teacherAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await teacherAuth(req)
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await ctx.params

    // admin/staff can reuse the existing (admin) detail implementation
    if (auth.userRole === 'admin' || auth.userRole === 'staff') {
      return adminGET(req, ctx)
    }

    // teacher: allowed only if the student is in one of the teacher's classes
    if (auth.userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { supabase } = await getDataClient(req)

    // Find teacher profile id for current user
    const { data: teacherProfile, error: tpErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (tpErr || !teacherProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify membership via enrollments
    const { data: enrollment, error: enrollErr } = await supabase
      .from('enrollments')
      .select('id, class_id')
      .eq('student_id', id)
      .eq('status', 'active')
      .maybeSingle()

    if (enrollErr || !enrollment) {
      // At this point, either the student doesn't exist or isn't visible.
      throw new NotFoundError('Student not found')
    }

    const { data: teacherClass, error: classErr } = await supabase
      .from('classes')
      .select('id')
      .eq('id', enrollment.class_id)
      .eq('teacher_id', teacherProfile.id)
      .maybeSingle()

    if (classErr || !teacherClass) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: student, error: studentErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle()

    if (studentErr || !student) {
      throw new NotFoundError('Student not found')
    }

    return NextResponse.json({ success: true, data: student })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const isStaff = await staffAuth(req)
  const isAdmin = await adminAuth(req)
  if (!isStaff.authorized && !isAdmin.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return adminPUT(req, ctx)
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const isStaff = await staffAuth(req)
  const isAdmin = await adminAuth(req)
  if (!isStaff.authorized && !isAdmin.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return adminDELETE(req, ctx)
}

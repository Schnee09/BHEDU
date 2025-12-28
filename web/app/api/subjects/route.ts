/**
 * Subjects API
 * GET /api/subjects - Fetch subjects
 * POST /api/subjects - Create a new subject
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { staffAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError } from '@/lib/api/errors'
import { SubjectService } from '@/lib/services/SubjectService'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req as any)

    // Allowed subject codes: configured via env or fallback to center defaults
    const allowedEnv = process.env.NEXT_PUBLIC_ALLOWED_SUBJECT_CODES
    const allowedCodes = (allowedEnv
      ? allowedEnv.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
      : ['TOAN', 'LY', 'HOA', 'VAN', 'ANH', 'KHTN']
    )

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('id, name, code')
      .in('code', allowedCodes)
      .order('name')

    if (error) throw error

    return NextResponse.json({ success: true, subjects: subjects || [] })
  } catch (error: any) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await staffAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    const body = await request.json()
    const { name, code, description, credits } = body

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Tên và mã môn học là bắt buộc' },
        { status: 400 }
      )
    }

    const subjectService = new SubjectService()
    const subject = await subjectService.createSubject({
      name,
      code,
      description,
      credits,
    })

    return NextResponse.json({ success: true, subject }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}


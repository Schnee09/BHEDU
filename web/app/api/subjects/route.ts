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
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // RLS policies now allow public SELECT
    const supabase = createClientFromRequest(req)



    const { data: subjects, error, count } = await supabase
      .from('subjects')
      .select('id, name, code, description', { count: 'exact' })
      .order('created_at', { ascending: true }) // Get oldest first for dedup
      .order('name')



    if (error) {
      logger.warn('Subjects query error', { error: error.message })
      return NextResponse.json({ success: true, subjects: [] })
    }

    // Deduplicate by code (keep first/oldest entry)
    const seenCodes = new Set<string>()
    const uniqueSubjects = (subjects || []).filter(s => {
      const code = s.code?.toLowerCase()
      if (!code || seenCodes.has(code)) return false
      seenCodes.add(code)
      return true
    }).map(s => ({
      ...s,
      is_active: true
    }))



    return NextResponse.json({ success: true, subjects: uniqueSubjects })
  } catch (error: any) {
    logger.error('Error fetching subjects', error)
    return NextResponse.json(
      { success: false, error: error.message, subjects: [] },
      { status: 200 }
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


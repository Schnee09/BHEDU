/**
 * Semesters API
 * GET /api/semesters - Fetch all semesters
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req)
    
    const { data: semesters, error } = await supabase
      .from('semesters')
      .select('id, name, code, start_date, end_date')
      .order('start_date', { ascending: false })

    if (error) {
      logger.warn('Error fetching semesters', { error: error.message })
      return NextResponse.json({ success: true, semesters: [] })
    }

    // Add is_active: true as default since column might not exist in some records
    const semestersWithActive = (semesters || []).map(s => ({
      ...s,
      is_active: false
    }))

    return NextResponse.json({ success: true, semesters: semestersWithActive })
  } catch (error: any) {
    logger.error('Error fetching semesters', error)
    return NextResponse.json(
      { success: false, error: error.message, semesters: [] },
      { status: 200 }
    )
  }
}

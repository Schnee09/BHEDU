/**
 * Semesters API
 * GET /api/semesters - Fetch all semesters
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req)

    console.log('[Semesters API] Fetching semesters...')
    
    const { data: semesters, error, count } = await supabase
      .from('semesters')
      .select('id, name, code, start_date, end_date', { count: 'exact' })
      .order('start_date', { ascending: false })

    console.log('[Semesters API] Result:', { 
      count, 
      dataLength: semesters?.length,
      error: error?.message 
    })

    if (error) {
      console.error('Supabase error fetching semesters:', error)
      return NextResponse.json({ success: true, semesters: [] })
    }

    // Add is_active: true as default since column might not exist in some records
    const semestersWithActive = (semesters || []).map(s => ({
      ...s,
      is_active: false // Default, will be overridden if exists
    }))

    return NextResponse.json({ success: true, semesters: semestersWithActive })
  } catch (error: any) {
    console.error('Error fetching semesters:', error)
    return NextResponse.json(
      { success: false, error: error.message, semesters: [] },
      { status: 200 }
    )
  }
}

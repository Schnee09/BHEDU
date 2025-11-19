import { createClientFromRequest } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req as any)

    const { data: subjects, error } = await supabase
      .from('grade_categories')
      .select('id, name, code')
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

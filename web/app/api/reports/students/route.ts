import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'
import { enforceRateLimit } from '@/lib/api/rateLimit'
import { rateLimitConfigs } from '@/lib/auth/rateLimit'
import { handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/students
 * Query params:
 * - format=csv -> return CSV download
 * - limit (optional) -> max rows to include in CSV (default 5000)
 */
export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, { bucketConfig: rateLimitConfigs.apiBucket, keyPrefix: 'reports-students' })
    if (limited) return limited.response

    const authResult = await adminAuth(request, rateLimitConfigs.auth)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const limit = Math.min(10000, Math.max(100, parseInt(url.searchParams.get('limit') || '5000', 10)))

    const { supabase } = await getDataClient(request)

    // Aggregates
    const countsPromise = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')
    const activePromise = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true)
    const inactivePromise = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', false)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const newThisMonthPromise = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', startOfMonth)

    const [countsRes, activeRes, inactiveRes, newMonthRes] = await Promise.all([countsPromise, activePromise, inactivePromise, newThisMonthPromise])

    const total = countsRes.count ?? 0
    const active = activeRes.count ?? 0
    const inactive = inactiveRes.count ?? 0
    const newThisMonth = newMonthRes.count ?? 0

    // Demographics and groups
    const byGradeRes = await supabase.from('profiles').select('grade_level, id', { count: 'exact' }).eq('role', 'student')
    const gradeCounts: any = {};
    (byGradeRes.data || []).forEach((r: any) => {
      const g = r.grade_level || 'Unknown'
      gradeCounts[g] = (gradeCounts[g] || 0) + 1
    })

    const genderRes = await supabase.from('profiles').select('gender, id', { count: 'exact' }).eq('role', 'student')
    const genderCounts: any = {};
    (genderRes.data || []).forEach((r: any) => {
      const g = r.gender || 'Unknown'
      genderCounts[g] = (genderCounts[g] || 0) + 1
    })

    // If CSV requested, stream students (limited)
    if (format === 'csv') {
      // Fetch student rows for CSV export (limit capped above)
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, grade_level, status, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      const headers = ["ID","Full Name","Email","Phone","Grade Level","Status","Created At"]
      const rows = (students || []).map((s: any) => [
        s.id,
        s.full_name || '',
        s.email || '',
        s.phone || '',
        s.grade_level || '',
        s.status || '',
        s.created_at ? new Date(s.created_at).toISOString() : ''
      ])

      const csv = [headers.join(','), ...rows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))].join('\n')

      const res = NextResponse.next()
      res.headers.set('Content-Type', 'text/csv; charset=utf-8')
      res.headers.set('Content-Disposition', `attachment; filename="students_report_${new Date().toISOString().split('T')[0]}.csv"`)
      return new NextResponse(csv, { status: 200, headers: res.headers })
    }

    // JSON response with aggregates
    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        newThisMonth,
        byGrade: gradeCounts,
        byGender: genderCounts
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

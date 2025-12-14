import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'
import { enforceRateLimit } from '@/lib/api/rateLimit'
import { rateLimitConfigs } from '@/lib/auth/rateLimit'
import { handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

// Helper: safe number
function asNumber(n: any): number | null {
  if (n === null || n === undefined) return null
  const v = Number(n)
  return Number.isFinite(v) ? v : null
}

// Compute median of numeric array
function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid]
  return (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * GET /api/reports/grades
 * Query params:
 * - format=csv -> download CSV
 * - academic_year_id, class_id, course_id -> filters
 * - bucket=10 -> distribution bucket size in percent (default 10)
 * - limit -> max rows for CSV (default 5000)
 */
export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, { bucketConfig: rateLimitConfigs.apiBucket, keyPrefix: 'reports-grades' })
    if (limited) return limited.response

    const authResult = await adminAuth(request, rateLimitConfigs.auth)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const academicYearId = url.searchParams.get('academic_year_id')
    const classId = url.searchParams.get('class_id')
    const courseId = url.searchParams.get('course_id')
    const bucketSize = Math.max(1, Math.min(50, parseInt(url.searchParams.get('bucket') || '10', 10)))
    const limit = Math.min(10000, Math.max(100, parseInt(url.searchParams.get('limit') || '5000', 10)))

    const { supabase } = await getDataClient(request)

    // Build base query for grades
    // We'll try to fetch related fields via foreign table selects. If relations differ, fields may be null and code handles it.
    let query = supabase
      .from('grades')
      .select(
        `id, student_id, class_id, assignment_id, points_earned, max_points, created_at, ` +
        `assignment:assignments(id, title, max_points), student:profiles(id, full_name), class:classes(id, name)`
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (academicYearId) {
      // Many schemas link class -> academic_year_id
      query = query.eq('academic_year_id', academicYearId)
    }
    if (classId) query = query.eq('class_id', classId)
    if (courseId) query = query.eq('course_id', courseId)

    // Limit rows fetched for CSV
    if (format === 'csv') {
      query = (query as any).limit(limit)
    }

    const { data: gradesRows, error } = await query

    if (error) {
      // If table missing or other errors, surface gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [], aggregates: {}, note: 'grades table not available' })
      }
      throw error
    }

    const rows = (gradesRows || []) as any[]

    // Compute percentage and collect numeric arrays
    const percentages: number[] = []
    const pointsArray: number[] = []
    const processed = rows.map(r => {
      const points = asNumber(r.points_earned ?? r.points ?? r.score)
      const maxPoints = asNumber(r.max_points ?? r.assignment?.max_points ?? r.max ?? null)
      const pct = (points !== null && maxPoints !== null && maxPoints > 0) ? (points / maxPoints) * 100 : null
      if (pct !== null) percentages.push(Number(pct))
      if (points !== null) pointsArray.push(Number(points))
      return {
        id: r.id,
        student_id: r.student_id || r.student?.id || null,
        student_name: r.student?.full_name || null,
        class_id: r.class_id || r.class?.id || null,
        class_name: r.class?.name || null,
        assignment_id: r.assignment_id || r.assignment?.id || null,
        assignment_title: r.assignment?.title || null,
        points: points,
        max_points: maxPoints,
        percentage: pct,
        created_at: r.created_at
      }
    })

    // Aggregates
    const avgPoints = pointsArray.length ? (pointsArray.reduce((s, v) => s + v, 0) / pointsArray.length) : null
    const medianPct = median(percentages)

    // Build distribution buckets for percentages (0-100)
    const buckets: Record<string, number> = {}
    const bucketCount = Math.ceil(100 / bucketSize)
    for (let i = 0; i < bucketCount; i++) {
      const low = i * bucketSize
      const high = Math.min(100, (i + 1) * bucketSize)
      buckets[`${low}-${high}`] = 0
    }

    percentages.forEach(p => {
      const idx = Math.min(bucketCount - 1, Math.floor(p / bucketSize))
      const low = idx * bucketSize
      const high = Math.min(100, (idx + 1) * bucketSize)
      buckets[`${low}-${high}`] = (buckets[`${low}-${high}`] || 0) + 1
    })

    const aggregates = {
      total_records: rows.length,
      average_points: avgPoints !== null ? Number(avgPoints.toFixed(2)) : null,
      median_percentage: medianPct !== null ? Number(medianPct.toFixed(2)) : null,
      buckets,
    }

    if (format === 'csv') {
      // Build CSV with required columns
      const headers = ['student_id', 'student_name', 'class_id', 'class_name', 'assignment_id', 'assignment_title', 'points', 'max_points', 'percentage']
      const csvRows = processed.map(p => [
        p.student_id ?? '',
        (p.student_name ?? '').replace(/"/g, '""'),
        p.class_id ?? '',
        (p.class_name ?? '').replace(/"/g, '""'),
        p.assignment_id ?? '',
        (p.assignment_title ?? '').replace(/"/g, '""'),
        p.points !== null ? Number(p.points).toFixed(2) : '',
        p.max_points !== null ? Number(p.max_points).toFixed(2) : '',
        p.percentage !== null ? Number(p.percentage).toFixed(2) : ''
      ])

      const csv = [headers.join(','), ...csvRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')

      const res = NextResponse.next()
      res.headers.set('Content-Type', 'text/csv; charset=utf-8')
      res.headers.set('Content-Disposition', `attachment; filename="grades_report_${new Date().toISOString().split('T')[0]}.csv"`)
      return new NextResponse(csv, { status: 200, headers: res.headers })
    }

    return NextResponse.json({ success: true, aggregates, sample_rows: processed.slice(0, 200) })
  } catch (error) {
    return handleApiError(error)
  }
}

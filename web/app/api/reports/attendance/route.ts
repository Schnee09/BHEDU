import { NextResponse } from 'next/server'
// Note: removed unused local fs/os/path imports used by older streaming implementation
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'
import { enforceRateLimit } from '@/lib/api/rateLimit'
import { rateLimitConfigs } from '@/lib/auth/rateLimit'
import { handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/attendance
 * Query params:
 * - format=csv -> download CSV
 * - date_from, date_to -> ISO date strings to filter attendance.date
 * - academic_year_id, class_id, course_id -> optional filters
 * - limit -> max rows for CSV (default 5000)
 */
export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, { bucketConfig: rateLimitConfigs.apiBucket, keyPrefix: 'reports-attendance' })
    if (limited) return limited.response

    const authResult = await adminAuth(request, rateLimitConfigs.auth)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')
    const academicYearId = url.searchParams.get('academic_year_id')
    const classId = url.searchParams.get('class_id')
    const courseId = url.searchParams.get('course_id')
    const limit = Math.min(10000, Math.max(100, parseInt(url.searchParams.get('limit') || '5000', 10)))

    const { supabase } = await getDataClient(request)

    let query: any = supabase
      .from('attendance')
      .select(`id, date, status, notes, class_id, student_id`)
      .order('date', { ascending: false })

    if (dateFrom) query = query.gte('date', dateFrom)
    if (dateTo) query = query.lte('date', dateTo)
    if (classId) query = query.eq('class_id', classId)

    // Some schemas link class -> academic_year or course -> academic_year; apply basic filters when provided
  if (academicYearId) {
      // try to filter attendance by joining class -> academic_year via in-memory workaround
      // We'll fetch class ids for that academic year and filter by them
  const classesForYearResp: any = await supabase.from('classes').select('id').eq('academic_year_id', academicYearId)
  const classIds = (classesForYearResp?.data || []).map((c: any) => c.id)
      if (classIds.length > 0) query = query.in('class_id', classIds)
      else {
        // no classes in that academic year -> empty result
        if (format === 'csv') {
          const headers = ['student_id','student_name','class_id','class_name','date','status','notes']
          const csv = [headers.join(',')].join('\n')
          const res = NextResponse.next()
          res.headers.set('Content-Type', 'text/csv; charset=utf-8')
          res.headers.set('Content-Disposition', `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.csv"`)
          return new NextResponse(csv, { status: 200, headers: res.headers })
        }
        return NextResponse.json({ success: true, records: [], aggregates: {} })
      }
    }

    // If course filter provided, find matching class ids then filter
    if (courseId) {
      const classesForCourseResp: any = await supabase.from('classes').select('id').eq('course_id', courseId)
      const classIds = (classesForCourseResp?.data || []).map((c: any) => c.id)
      if (classIds.length > 0) query = query.in('class_id', classIds)
    }

    if (format === 'csv') query = query.limit(limit)

    const { data: attendanceRows, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ success: true, records: [], aggregates: {}, note: 'attendance table not available' })
      }
      throw error
    }

    const rows = attendanceRows || []

    // Fetch student names and class names for the rows
    const studentIds = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))]
    const classIds = [...new Set(rows.map((r: any) => r.class_id).filter(Boolean))]

    const studentMap: Record<string, any> = {}
    if (studentIds.length > 0) {
      const studentsResp: any = await supabase.from('profiles').select('id, full_name').in('id', studentIds)
  const studentsData = (studentsResp?.data as any[]) || []
  studentsData.forEach((s: any) => { studentMap[s.id] = s })
    }

    const classMap: Record<string, any> = {}
    if (classIds.length > 0) {
      const classesResp: any = await supabase.from('classes').select('id, name').in('id', classIds)
  const classesData = (classesResp?.data as any[]) || []
  classesData.forEach((c: any) => { classMap[c.id] = c })
    }

    const processed = rows.map((r: any) => ({
      id: r.id,
      date: r.date,
      status: r.status,
      notes: r.notes || '',
      student_id: r.student_id || '',
      student_name: studentMap[r.student_id]?.full_name || '',
      class_id: r.class_id || '',
      class_name: classMap[r.class_id]?.name || ''
    }))

    // Aggregates
    const total = processed.length
    const present = processed.filter((p: any) => p.status === 'present').length
    const absent = processed.filter((p: any) => p.status === 'absent').length
    const late = processed.filter((p: any) => p.status === 'late').length
    const excused = processed.filter((p: any) => p.status === 'excused').length

    const aggregates = { total, present, absent, late, excused }

    if (format === 'csv') {
      const headers = ['student_id','student_name','class_id','class_name','date','status','notes']
      const csvRows = processed.map((p: any) => [
        p.student_id,
        (p.student_name || '').replace(/"/g, '""'),
        p.class_id,
        (p.class_name || '').replace(/"/g, '""'),
        p.date,
        p.status,
        (p.notes || '').replace(/"/g, '""')
      ])

      // Stream to a temporary file and upload to storage when large to avoid high memory usage
      const STREAM_THRESHOLD = 2000
  const _bucket = process.env.REPORTS_STORAGE_BUCKET || 'reports'
  const _signedExpiry = Math.max(60, parseInt(process.env.REPORTS_STORAGE_SIGNED_EXPIRES || '3600', 10))

      if (processed.length > STREAM_THRESHOLD) {
        // Enqueue a background export job instead of writing a local temp file here.
        // The worker will pick up this job, stream the CSV and upload to storage.
        try {
          const jobParams = {
            filters: { dateFrom, dateTo, academicYearId, classId, courseId },
            headers,
            // include a lightweight preview/limit to help the worker
            requestedAt: new Date().toISOString(),
            rowCount: processed.length,
          }

          // Insert job using service (supabase client from getDataClient should be admin/service for admin routes)
          const insertResp: any = await (supabase as any).from('report_exports').insert({
            type: 'attendance',
            params: jobParams,
            status: 'pending'
          }).select('id').single()

          const jobId = insertResp?.data?.id || null
          if (jobId) {
            return NextResponse.json({ success: true, jobId })
          }
          // If insert failed, continue to fallback to inline CSV below
          console.error('Failed to enqueue export job, falling back to inline CSV', insertResp?.error || null)
        } catch (_err) {
          console.error('Enqueue attempt failed, falling back to direct CSV')
        }
      }

      // Fallback: return inline CSV
      const csv = [headers.join(','), ...csvRows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))].join('\n')
      const res = NextResponse.next()
      res.headers.set('Content-Type', 'text/csv; charset=utf-8')
      res.headers.set('Content-Disposition', `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.csv"`)
      return new NextResponse(csv, { status: 200, headers: res.headers })
    }

    return NextResponse.json({ success: true, aggregates, records: processed })
  } catch (error) {
    return handleApiError(error)
  }
}

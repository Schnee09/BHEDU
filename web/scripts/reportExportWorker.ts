#!/usr/bin/env node
import fs from 'fs'
import os from 'os'
import path from 'path'
import { finished as streamFinished } from 'stream/promises'
import { createServiceClient } from '@/lib/supabase/server'

// Simple polling worker to process pending report_exports jobs.
// Usage: run from project root: `node ./web/scripts/reportExportWorker.js` or use ts-node.

const POLL_INTERVAL_MS = parseInt(process.env.REPORTS_WORKER_POLL_MS || '3000', 10)
const BUCKET = process.env.REPORTS_STORAGE_BUCKET || 'reports'
const SIGNED_EXPIRES = Math.max(60, parseInt(process.env.REPORTS_STORAGE_SIGNED_EXPIRES || '3600', 10))

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function processJob(job: any, supabase: any) {
  const id = job.id
  console.log(`Processing job ${id} type=${job.type}`)
  try {
    // mark started
    await supabase.from('report_exports').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', id)

    const params = job.params || {}
    if (job.type === 'attendance') {
      // Build attendance query similar to API route
      const filters = params.filters || {}
      let query: any = supabase.from('attendance').select(`id, date, status, notes, class_id, student_id`).order('date', { ascending: false })
      if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('date', filters.dateTo)
      if (filters.classId) query = query.eq('class_id', filters.classId)

      // Apply academicYearId / courseId by resolving classes
      if (filters.academicYearId) {
        const classesForYear: any = await supabase.from('classes').select('id').eq('academic_year_id', filters.academicYearId)
        const classIds = (classesForYear?.data || []).map((c: any) => c.id)
        if (classIds.length > 0) query = query.in('class_id', classIds)
      }
      if (filters.courseId) {
        const classesForCourse: any = await supabase.from('classes').select('id').eq('course_id', filters.courseId)
        const classIds = (classesForCourse?.data || []).map((c: any) => c.id)
        if (classIds.length > 0) query = query.in('class_id', classIds)
      }

      const limit = job.params?.limit || 10000
      query = query.limit(limit)

      const { data: attendanceRows, error } = await query
      if (error) throw error
      const rows = attendanceRows || []

      // Resolve names
      const studentIds = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))]
      const classIds = [...new Set(rows.map((r: any) => r.class_id).filter(Boolean))]

      const studentMap: Record<string, any> = {}
      if (studentIds.length > 0) {
        const studentsResp: any = await supabase.from('profiles').select('id, full_name').in('id', studentIds)
        const studentsData = (studentsResp?.data || [])
        studentsData.forEach((s: any) => { studentMap[s.id] = s })
      }

      const classMap: Record<string, any> = {}
      if (classIds.length > 0) {
        const classesResp: any = await supabase.from('classes').select('id, name').in('id', classIds)
        const classesData = (classesResp?.data || [])
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

      const headers = job.params?.headers || ['student_id','student_name','class_id','class_name','date','status','notes']
      const csvRows = processed.map((p: any) => [
        p.student_id,
        (p.student_name || '').replace(/"/g, '""'),
        p.class_id,
        (p.class_name || '').replace(/"/g, '""'),
        p.date,
        p.status,
        (p.notes || '').replace(/"/g, '""')
      ])

      // write to temp file then upload
      const filename = `attendance_report_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
      const relPath = `reports/${filename}`
      const tmpDir = process.env.TMPDIR || os.tmpdir()
      const tmpPath = path.join(tmpDir, `attendance-${Date.now()}.csv`)

      const stream = fs.createWriteStream(tmpPath, { encoding: 'utf-8' })
      try {
        stream.write(headers.join(',') + '\n')
        for (const r of csvRows) {
          const line = r.map((c: any) => `"${String(c).replace(/"/g,'""')}"`).join(',') + '\n'
          if (!stream.write(line)) {
            await new Promise<void>((res) => stream.once('drain', () => res()))
          }
        }
        stream.end()
        await streamFinished(stream)

        const storage = (supabase as any).storage
        if (storage && storage.from) {
          const rs = fs.createReadStream(tmpPath)
          const { error: uploadErr } = await storage.from(BUCKET).upload(relPath, rs, { upsert: true } as any)
          if (uploadErr) throw uploadErr

          const { data: signedData, error: signedErr } = await storage.from(BUCKET).createSignedUrl(relPath, SIGNED_EXPIRES)
          if (signedErr) throw signedErr

          // update job with result_url and finish
          await supabase.from('report_exports').update({ status: 'succeeded', finished_at: new Date().toISOString(), result_url: signedData?.signedUrl }).eq('id', id)
          console.log(`Job ${id} completed, url=${signedData?.signedUrl}`)
          return
        }
        throw new Error('Storage client unavailable')
      } finally {
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath) } catch (_e) { /* ignore */ }
      }
    }

    // Unknown job type
    await supabase.from('report_exports').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: 'Unknown job type' }).eq('id', id)
  } catch (err: any) {
    console.error('Job processing failed', err)
    await supabase.from('report_exports').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: String(err.message || err) }).eq('id', id)
  }
}

async function main() {
  console.log('Starting report export worker...')
  const supabase = createServiceClient()

  while (true) {
    try {
      // pick one pending job
      const resp: any = await supabase.from('report_exports').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(1)
      const jobs = resp?.data || []
      if (jobs.length === 0) {
        await sleep(POLL_INTERVAL_MS)
        continue
      }
      const job = jobs[0]
      await processJob(job, supabase)
    } catch (e) {
      console.error('Worker iteration failed', e)
      await sleep(POLL_INTERVAL_MS)
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error('Worker failed', e)
    process.exit(1)
  })
}

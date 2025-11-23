import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

function computeHmac(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex')
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const internalKey = process.env.INTERNAL_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  }

  const raw = await req.text()
  const sig = req.headers.get('x-internal-signature')
  if (!sig) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 })

  const expected = computeHmac(internalKey, raw)
  try {
    const providedBuf = Buffer.from(sig, 'hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid signature format' }), { status: 400 })
  }

  let body: { title?: unknown; description?: unknown; subject_id?: unknown; teacher_id?: unknown; academic_year_id?: unknown } = {}
  try { body = raw ? JSON.parse(raw) : {} } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }

  const updates: Record<string, unknown> = {}
  if (typeof body.title !== 'undefined') {
    if (typeof body.title !== 'string') return new Response(JSON.stringify({ error: 'title must be string' }), { status: 400 })
    updates.name = body.title // Map title to name for database
  }
  if (typeof body.description !== 'undefined') {
    if (body.description !== null && typeof body.description !== 'string') return new Response(JSON.stringify({ error: 'description must be string|null' }), { status: 400 })
    updates.description = body.description
  }
  if (typeof body.subject_id !== 'undefined') {
    if (body.subject_id !== null && typeof body.subject_id !== 'string') return new Response(JSON.stringify({ error: 'subject_id must be string|null' }), { status: 400 })
    updates.subject_id = body.subject_id
  }
  if (typeof body.teacher_id !== 'undefined') {
    if (body.teacher_id !== null && typeof body.teacher_id !== 'string') return new Response(JSON.stringify({ error: 'teacher_id must be string|null' }), { status: 400 })
    updates.teacher_id = body.teacher_id
  }
  if (typeof body.academic_year_id !== 'undefined') {
    if (body.academic_year_id !== null && typeof body.academic_year_id !== 'string') return new Response(JSON.stringify({ error: 'academic_year_id must be string|null' }), { status: 400 })
    updates.academic_year_id = body.academic_year_id
  }

  if (Object.keys(updates).length === 0) return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400 })

  const sb = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await sb.from('courses').update(updates).eq('id', id).select().single()
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  // Map name back to title for frontend
  const courseWithTitle = data ? { ...data, title: data.name } : data;
  return new Response(JSON.stringify({ data: courseWithTitle }), { status: 200 })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const internalKey = process.env.INTERNAL_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  }

  const sig = req.headers.get('x-internal-signature')
  if (!sig) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 })

  const expected = computeHmac(internalKey, '')
  try {
    const providedBuf = Buffer.from(sig, 'hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid signature format' }), { status: 400 })
  }

  const sb = createClient(supabaseUrl, serviceRoleKey)
  const { error } = await sb.from('courses').delete().eq('id', id)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

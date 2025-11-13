import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

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

  let body: { title?: unknown; content?: unknown; video_url?: unknown; order_index?: unknown; is_published?: unknown } = {}
  try { body = raw ? JSON.parse(raw) : {} } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }

  const updates: Record<string, unknown> = {}
  if (typeof body.title !== 'undefined') {
    if (typeof body.title !== 'string') return new Response(JSON.stringify({ error: 'title must be string' }), { status: 400 })
    updates.title = body.title
  }
  if (typeof body.content !== 'undefined') {
    if (body.content !== null && typeof body.content !== 'string') return new Response(JSON.stringify({ error: 'content must be string|null' }), { status: 400 })
    updates.content = body.content
  }
  if (typeof body.video_url !== 'undefined') {
    if (body.video_url !== null && typeof body.video_url !== 'string') return new Response(JSON.stringify({ error: 'video_url must be string|null' }), { status: 400 })
    updates.video_url = body.video_url
  }
  if (typeof body.order_index !== 'undefined') {
    if (typeof body.order_index !== 'number') return new Response(JSON.stringify({ error: 'order_index must be number' }), { status: 400 })
    updates.order_index = body.order_index
  }
  if (typeof body.is_published !== 'undefined') {
    if (typeof body.is_published !== 'boolean') return new Response(JSON.stringify({ error: 'is_published must be boolean' }), { status: 400 })
    updates.is_published = body.is_published
  }

  if (Object.keys(updates).length === 0) return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400 })

  const sb = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await sb.from('lessons').update(updates).eq('id', id).select().single()
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ data }), { status: 200 })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const internalKey = process.env.INTERNAL_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  }

  // Signature: DELETE uses empty payload
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
  const { error } = await sb.from('lessons').delete().eq('id', id)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

/**
 * Admin Data Viewer: Generic Table CRUD API
 * GET    /api/admin/data/[table]?page=&limit=&q=    - List rows with pagination (q is optional, client-side fallback)
 * POST   /api/admin/data/[table]                    - Insert row (JSON body)
 * PUT    /api/admin/data/[table]                    - Update row (requires { id, ...updates })
 * DELETE /api/admin/data/[table]?id=                - Delete row by id
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createServiceClient } from '@/lib/supabase/server'
import { ALLOWED_TABLES } from '../tables/route'

type Params = { params: Promise<{ table: string }> }

function validateTable(table: string) {
  return ALLOWED_TABLES.includes(table as (typeof ALLOWED_TABLES)[number])
}

export async function GET(request: Request, ctx: Params) {
  const authResult = await adminAuth(request)
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await ctx.params
  if (!validateTable(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  // Use service client to bypass RLS (admin already authenticated)
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '25', 10)
  const offset = (page - 1) * limit
  // For MVP, we won’t server-filter by q (it varies by columns). Client can filter the JSON.

  // Try ordering by created_at then fall back to id
  let data: unknown[] | null = null
  let count: number | null = null
  let error: unknown = null

  const query = supabase.from(table).select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  const res = await query
  if (res.error) {
    // Retry with id order
    const res2 = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1)
    data = res2.data
    count = res2.count
    error = res2.error
  } else {
    data = res.data
    count = res.count
    error = res.error
  }

  if (error) {
    console.error('Admin Data Viewer GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}

export async function POST(request: Request, ctx: Params) {
  const authResult = await adminAuth(request)
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await ctx.params
  if (!validateTable(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const body = await request.json()
  const { data, error } = await supabase.from(table).insert(body).select().single()
  if (error) {
    console.error('Admin Data Viewer POST error:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
}

export async function PUT(request: Request, ctx: Params) {
  const authResult = await adminAuth(request)
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await ctx.params
  if (!validateTable(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const body = await request.json()
  const { id, ...updates } = body as { id?: string | number; [k: string]: unknown }
  if (id === undefined || id === null) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) {
    console.error('Admin Data Viewer PUT error:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
}

export async function DELETE(request: Request, ctx: Params) {
  const authResult = await adminAuth(request)
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await ctx.params
  if (!validateTable(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    console.error('Admin Data Viewer DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

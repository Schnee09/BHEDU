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
import { handleApiError, ValidationError } from '@/lib/api/errors'

type Params = { params: Promise<{ table: string }> }

function validateTable(table: string) {
  return ALLOWED_TABLES.includes(table as (typeof ALLOWED_TABLES)[number])
}

export async function GET(request: Request, ctx: Params) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { table } = await ctx.params
    if (!validateTable(table)) {
      throw new ValidationError(`Table '${table}' is not allowed or does not exist`)
    }

    // Use service client to bypass RLS (admin already authenticated)
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)))
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
      throw new Error(`Failed to fetch data from table '${table}'`)
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
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request, ctx: Params) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { table } = await ctx.params
    if (!validateTable(table)) {
      throw new ValidationError(`Table '${table}' is not allowed or does not exist`)
    }

    const supabase = createServiceClient()
    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Request body must be a valid JSON object')
    }

    const { data, error } = await supabase.from(table).insert(body).select().single()
    if (error) {
      console.error('Admin Data Viewer POST error:', error)
      throw new Error(`Failed to create record in table '${table}': ${error.message}`)
    }
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, ctx: Params) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { table } = await ctx.params
    if (!validateTable(table)) {
      throw new ValidationError(`Table '${table}' is not allowed or does not exist`)
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body as { id?: string | number; [k: string]: unknown }
    
    if (id === undefined || id === null) {
      throw new ValidationError('Missing required field: id')
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No fields to update')
    }

    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
    if (error) {
      console.error('Admin Data Viewer PUT error:', error)
      throw new Error(`Failed to update record in table '${table}': ${error.message}`)
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, ctx: Params) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { table } = await ctx.params
    if (!validateTable(table)) {
      throw new ValidationError(`Table '${table}' is not allowed or does not exist`)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      throw new ValidationError('Missing required query parameter: id')
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    
    if (error) {
      console.error('Admin Data Viewer DELETE error:', error)
      throw new Error(`Failed to delete record from table '${table}': ${error.message}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

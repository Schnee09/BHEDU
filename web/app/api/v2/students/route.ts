// @ts-nocheck
/**
 * Students API V2 - Refactored with Middleware Pattern
 * GET/POST /api/v2/students
 *
 * Demonstrates the new composable middleware approach.
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitConfigs, checkRateLimit, getRateLimitIdentifier } from '@/lib/auth/rateLimit'
import { teacherAuth, staffAuth } from '@/lib/auth/adminAuth'
import { StudentRepository } from '@/lib/repositories/StudentRepository'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation Schemas
const querySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'inactive', 'graduated', 'transferred']).optional(),
  grade_level: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional()
})

const createSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergency_contact: z.string().max(100).optional().nullable(),
  grade_level: z.string().max(20).optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active')
})

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const identifier = getRateLimitIdentifier(request)
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Auth
    const auth = await teacherAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 })
    }

    // Parse query
    const params: Record<string, string> = {}
    for (const [key, value] of new URL(request.url).searchParams.entries()) {
      params[key] = value
    }
    
    const parsed = querySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: parsed.error.issues 
      }, { status: 400 })
    }

    const filters = parsed.data
    const supabase = createServiceClient()
    const repository = new StudentRepository(supabase)

    // Role-based access
    if (auth.userRole === 'admin' || auth.userRole === 'staff') {
      const result = await repository.findAll(filters)
      return NextResponse.json({ success: true, ...result })
    }
    
    if (auth.userRole === 'teacher') {
      const result = await repository.findByTeacher(auth.userId!, filters)
      return NextResponse.json({ success: true, ...result })
    }

    if (auth.userRole === 'student') {
      const student = await repository.findById(auth.userId!)
      return NextResponse.json({
        success: true,
        data: student ? [student] : [],
        total: student ? 1 : 0,
        page: 1,
        pageSize: 1,
        totalPages: 1
      })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    console.error('[API] GET /api/v2/students error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const identifier = getRateLimitIdentifier(request)
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Auth - staff/admin only
    const auth = await staffAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: parsed.error.issues 
      }, { status: 400 })
    }

    const supabase = createServiceClient()
    const repository = new StudentRepository(supabase)
    const student = await repository.create(parsed.data)

    return NextResponse.json({ success: true, student }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/v2/students error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

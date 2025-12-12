/**
 * Guardians Management API
 * GET /api/admin/students/[id]/guardians - List all guardians for a student
 * POST /api/admin/students/[id]/guardians - Add a new guardian
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const { id } = await params
  const { supabase } = await getDataClient(req)

    // Verify student exists
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle()

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    const { data: guardians, error } = await supabase
      .from('guardians')
      .select('*')
      .eq('student_id', id)
      .order('is_primary_contact', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch guardians:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch guardians' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: guardians })
  } catch (error) {
    logger.error('Failed to fetch guardians:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const { id } = await params
  const { supabase } = await getDataClient(req)
    const body = await req.json()

    // Verify student exists
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle()

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Guardian name is required' },
        { status: 400 }
      )
    }

    if (!body.relationship) {
      return NextResponse.json(
        { error: 'Relationship is required' },
        { status: 400 }
      )
    }

    // If setting as primary contact, unset existing primary
    if (body.is_primary_contact) {
      await supabase
        .from('guardians')
        .update({ is_primary_contact: false })
        .eq('student_id', id)
        .eq('is_primary_contact', true)
    }

    // Create guardian
    const { data: newGuardian, error: insertError } = await supabase
      .from('guardians')
      .insert({
        student_id: id,
        name: body.name,
        relationship: body.relationship,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        is_primary_contact: body.is_primary_contact || false,
        is_emergency_contact: body.is_emergency_contact || false,
        occupation: body.occupation || null,
        workplace: body.workplace || null,
        work_phone: body.work_phone || null,
        notes: body.notes || null
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Failed to create guardian:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to create guardian' },
        { status: 500 }
      )
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'create',
      resource_type: 'guardian',
      resource_id: newGuardian.id,
      details: { student_id: id, guardian_name: body.name }
    })

    logger.info('Guardian created successfully', { 
      guardianId: newGuardian.id, 
      studentId: id,
      userId: authResult.userId 
    })

    return NextResponse.json({
      success: true,
      data: newGuardian,
      message: 'Guardian added successfully'
    })
  } catch (error) {
    logger.error('Failed to create guardian:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

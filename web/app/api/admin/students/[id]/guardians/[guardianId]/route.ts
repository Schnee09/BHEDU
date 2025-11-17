/**
 * Individual Guardian API
 * PUT /api/admin/students/[id]/guardians/[guardianId] - Update guardian
 * DELETE /api/admin/students/[id]/guardians/[guardianId] - Delete guardian
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string; guardianId: string }>
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, guardianId } = await params
    const supabase = createClientFromRequest(req as any)
    const body = await req.json()

    // Verify guardian exists and belongs to student
    const { data: existingGuardian } = await supabase
      .from('guardians')
      .select('id, student_id')
      .eq('id', guardianId)
      .eq('student_id', id)
      .maybeSingle()

    if (!existingGuardian) {
      return NextResponse.json(
        { error: 'Guardian not found' },
        { status: 404 }
      )
    }

    // If setting as primary contact, unset existing primary
    if (body.is_primary_contact) {
      await supabase
        .from('guardians')
        .update({ is_primary_contact: false })
        .eq('student_id', id)
        .eq('is_primary_contact', true)
        .neq('id', guardianId)
    }

    // Build update object
    const updateData: Record<string, any> = {}
    const allowedFields = [
      'name', 'relationship', 'phone', 'email', 'address',
      'is_primary_contact', 'is_emergency_contact',
      'occupation', 'workplace', 'work_phone', 'notes'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Update guardian
    const { data: updatedGuardian, error: updateError } = await supabase
      .from('guardians')
      .update(updateData)
      .eq('id', guardianId)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update guardian:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update guardian' },
        { status: 500 }
      )
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'update',
      resource_type: 'guardian',
      resource_id: guardianId,
      details: { student_id: id, updated_fields: Object.keys(updateData) }
    })

    logger.info('Guardian updated successfully', { 
      guardianId, 
      studentId: id,
      userId: authResult.userId 
    })

    return NextResponse.json({
      success: true,
      data: updatedGuardian,
      message: 'Guardian updated successfully'
    })
  } catch (error) {
    logger.error('Failed to update guardian:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, guardianId } = await params
    const supabase = createClientFromRequest(req as any)

    // Verify guardian exists and belongs to student
    const { data: existingGuardian } = await supabase
      .from('guardians')
      .select('id, student_id, name')
      .eq('id', guardianId)
      .eq('student_id', id)
      .maybeSingle()

    if (!existingGuardian) {
      return NextResponse.json(
        { error: 'Guardian not found' },
        { status: 404 }
      )
    }

    // Delete guardian
    const { error: deleteError } = await supabase
      .from('guardians')
      .delete()
      .eq('id', guardianId)

    if (deleteError) {
      logger.error('Failed to delete guardian:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete guardian' },
        { status: 500 }
      )
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'delete',
      resource_type: 'guardian',
      resource_id: guardianId,
      details: { 
        student_id: id,
        guardian_name: existingGuardian.name
      }
    })

    logger.info('Guardian deleted successfully', { 
      guardianId, 
      studentId: id,
      userId: authResult.userId 
    })

    return NextResponse.json({
      success: true,
      message: 'Guardian deleted successfully'
    })
  } catch (error) {
    logger.error('Failed to delete guardian:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Single Tutor API
 * PUT /api/tutors/[id] - Update tutor
 * DELETE /api/tutors/[id] - Delete tutor
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { staffAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await staffAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { 
      full_name, 
      email, 
      phone, 
      specialization, 
      teaching_subjects,
      hourly_rate,
      bio 
    } = body

    if (!full_name) {
      return NextResponse.json({ success: false, error: 'Tên gia sư là bắt buộc' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        email: email || null,
        phone: phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (profileError) {
      logger.error('Error updating tutor profile', profileError)
      return NextResponse.json({ success: false, error: 'Không thể cập nhật gia sư' }, { status: 500 })
    }

    // Update teacher_profile
    const { error: teacherError } = await supabase
      .from('teacher_profiles')
      .update({
        specialization: specialization || null,
        teaching_subjects: teaching_subjects || [],
        hourly_rate: hourly_rate || null,
        bio: bio || null,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', id)

    if (teacherError) {
      logger.error('Error updating teacher_profile', teacherError)
      return NextResponse.json({ success: false, error: 'Không thể cập nhật thông tin gia sư' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error updating tutor', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await staffAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createServiceClient()

    // Delete teacher_profile first (cascade should handle this, but being explicit)
    await supabase.from('teacher_profiles').delete().eq('profile_id', id)

    // Delete profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting tutor', error)
      return NextResponse.json({ success: false, error: 'Không thể xóa gia sư' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting tutor', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

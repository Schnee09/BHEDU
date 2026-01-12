/**
 * Tutors API
 * GET /api/tutors - List all tutors
 * POST /api/tutors - Create new tutor
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { staffAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Fetch tutors with their teaching subjects
    const { data: tutors, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        photo_url,
        teacher_profiles!inner (
          teacher_type,
          specialization,
          teaching_subjects,
          hourly_rate,
          bio
        )
      `)
      .eq('role', 'teacher')
      .eq('teacher_profiles.teacher_type', 'tutor')
      .order('full_name')

    if (error) {
      logger.warn('Tutors fetch error', { error: error.message })
      return NextResponse.json({ success: true, tutors: [] })
    }

    // Transform data
    const transformedTutors = (tutors || []).map((tutor: any) => ({
      id: tutor.id,
      full_name: tutor.full_name,
      email: tutor.email,
      phone: tutor.phone,
      photo_url: tutor.photo_url,
      teacher_type: tutor.teacher_profiles?.teacher_type,
      specialization: tutor.teacher_profiles?.specialization,
      teaching_subjects: tutor.teacher_profiles?.teaching_subjects || [],
      hourly_rate: tutor.teacher_profiles?.hourly_rate,
      bio: tutor.teacher_profiles?.bio
    }))

    return NextResponse.json({ success: true, tutors: transformedTutors })
  } catch (error) {
    logger.error('Error fetching tutors', error)
    return NextResponse.json({ success: true, tutors: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require staff/admin auth
    const authResult = await staffAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

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

    // Create profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        full_name,
        email: email || null,
        phone: phone || null,
        role: 'teacher',
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      logger.error('Error creating tutor profile', profileError)
      return NextResponse.json({ success: false, error: 'Không thể tạo gia sư' }, { status: 500 })
    }

    // Create teacher_profile with type 'tutor'
    const { error: teacherError } = await supabase
      .from('teacher_profiles')
      .insert({
        profile_id: profile.id,
        teacher_type: 'tutor',
        specialization: specialization || null,
        teaching_subjects: teaching_subjects || [],
        hourly_rate: hourly_rate || null,
        bio: bio || null
      })

    if (teacherError) {
      logger.error('Error creating teacher_profile', teacherError)
      // Rollback profile creation
      await supabase.from('profiles').delete().eq('id', profile.id)
      return NextResponse.json({ success: false, error: 'Không thể tạo thông tin gia sư' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      tutor: { ...profile, teacher_type: 'tutor', specialization, teaching_subjects }
    })
  } catch (error) {
    logger.error('Error creating tutor', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

/**
 * User Management API
 * GET /api/admin/users - List all users with filtering
 * POST /api/admin/users - Create new user
 * PUT /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Deactivate user
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, generateWelcomeEmail } from '@/lib/email/emailService'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        last_login_at,
        created_at,
        phone,
        department,
        notes,
        student_id,
        grade_level
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true')
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await supabase
      .rpc('get_user_statistics')
      .single()

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      statistics: stats || {}
    })

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      phone,
      department,
      student_id,
      grade_level,
      notes,
      is_active = true
    } = body

    // Validation
    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, first_name, last_name, role' },
        { status: 400 }
      )
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: admin, teacher, or student' },
        { status: 400 }
      )
    }

    // Use service client to create user (bypasses RLS)
    const supabase = createServiceClient()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    // Update profile with additional fields
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        role,
        phone,
        department,
        student_id,
        grade_level,
        notes,
        is_active,
        created_by: authResult.userId
      })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Try to clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authData.user.id,
        action: 'user_created',
        description: `User created by admin: ${authResult.userEmail}`,
        metadata: { created_by: authResult.userId, role }
      })

   // Send welcome email
   const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
   const emailContent = generateWelcomeEmail({
     firstName: first_name,
     email,
     password,
     role,
     loginUrl
   })

   await sendEmail({
     to: email,
     subject: 'Welcome to BH-EDU - Your Account Details',
     ...emailContent
   })

    return NextResponse.json({
      success: true,
      data: profile,
     message: 'User created successfully. Welcome email sent.'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Individual User Management API
 * GET /api/admin/users/[id] - Get user details
 * PUT /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Deactivate user
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createServiceClient()

    // Get user details
    const { data: user, error } = await supabase
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
        grade_level,
        created_by
      `)
      .eq('id', id)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get recent activity
    const { data: activities } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        recent_activities: activities || []
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      email,
      first_name,
      last_name,
      role,
      phone,
      department,
      student_id,
      grade_level,
      notes,
      is_active
    } = body

    const supabase = createServiceClient()

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
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
        is_active
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // If email changed, update auth user
    if (email && email !== existingUser.email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(
        id,
        { email }
      )
      
      if (emailError) {
        console.error('Error updating email:', emailError)
        return NextResponse.json(
          { error: 'Failed to update email' },
          { status: 500 }
        )
      }
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: id,
        action: 'user_updated',
        description: `User updated by admin: ${authResult.userEmail}`,
        metadata: { updated_by: authResult.userId, changes: body }
      })

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    const supabase = createServiceClient()

    if (permanent) {
      // Permanent deletion (use with caution)
      const { error } = await supabase.auth.admin.deleteUser(id)
      
      if (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'User permanently deleted'
      })
    } else {
      // Soft delete (deactivate)
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        console.error('Error deactivating user:', error)
        return NextResponse.json(
          { error: 'Failed to deactivate user' },
          { status: 500 }
        )
      }

      // Log activity
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: id,
          action: 'user_deactivated',
          description: `User deactivated by admin: ${authResult.userEmail}`,
          metadata: { deactivated_by: authResult.userId }
        })

      return NextResponse.json({
        success: true,
        message: 'User deactivated successfully'
      })
    }

  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

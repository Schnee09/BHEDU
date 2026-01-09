/**
 * Individual User Management API
 * GET /api/admin/users/[id] - Get user details
 * PUT /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Deactivate user
 */

import { NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'
import { createServiceClient } from '@/lib/supabase/server'
import { staffAuth } from '@/lib/auth/adminAuth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await staffAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
  const { supabase } = await getDataClient(request)

    // Get user details
    const { data: user, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
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
    const authResult = await staffAuth(request)
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
      full_name,
      role,
      phone,
      department,
      student_id,
      grade_level,
      notes,
      is_active
    } = body

  const { supabase } = await getDataClient(request)

    // Check if user exists and get current role
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only admin can change role to admin or staff
    if (role && (role === 'admin' || role === 'staff') && authResult.userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can assign admin or staff roles' },
        { status: 403 }
      )
    }

    // Only admin can modify admin/staff users
    if ((existingUser.role === 'admin' || existingUser.role === 'staff') && authResult.userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can modify admin or staff accounts' },
        { status: 403 }
      )
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name,
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
    const authResult = await staffAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

  const { supabase } = await getDataClient(request)

    // Check if target user is admin/staff - only admin can delete those
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single()

    if (targetUser && (targetUser.role === 'admin' || targetUser.role === 'staff') && authResult.userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete admin or staff accounts' },
        { status: 403 }
      )
    }

    if (permanent) {
      // Permanent deletion - need to get the auth user_id first
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('id', id)
        .single()
      
      if (!profile || !profile.user_id) {
        return NextResponse.json(
          { error: 'User not found or has no auth account' },
          { status: 404 }
        )
      }

      // Use service client explicitly for auth admin operations
      const adminClient = createServiceClient()

      // Delete from Supabase Auth (requires service role key)
      console.log('[DELETE USER] Deleting auth user:', profile.user_id)
      const { error: authError } = await adminClient.auth.admin.deleteUser(profile.user_id)
      
      if (authError) {
        console.error('[DELETE USER] Error deleting auth user:', authError)
        // If auth delete fails, try deleting just the profile
        const { error: profileError } = await adminClient
          .from('profiles')
          .delete()
          .eq('id', id)
        
        if (profileError) {
          console.error('[DELETE USER] Error deleting profile:', profileError)
          return NextResponse.json(
            { error: 'Failed to delete user', details: authError.message },
            { status: 500 }
          )
        }
      }

      // Log activity
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: id,
          action: 'user_deleted',
          description: `User ${profile.full_name} (${profile.email}) permanently deleted by admin: ${authResult.userEmail}`,
          metadata: { deleted_by: authResult.userId }
        })

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

/**
 * User Password Reset API
 * POST /api/admin/users/[id]/reset-password - Reset user password
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { new_password, send_email = false } = body

    if (!new_password || new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Update user password
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      id,
      { password: new_password }
    )

    if (passwordError) {
      console.error('Error resetting password:', passwordError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: id,
        action: 'password_reset',
        description: `Password reset by admin: ${authResult.userEmail}`,
        metadata: { reset_by: authResult.userId }
      })

    // TODO: If send_email is true, send email notification to user
    // This would require email service integration

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

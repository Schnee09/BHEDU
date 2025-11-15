/**
 * User Password Reset API
 * POST /api/admin/users/[id]/reset-password - Reset user password
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email/emailService'

export async function POST(
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
    const { new_password } = body
    // TODO: Implement email notification
    // const { send_email = false } = body

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

     // Send email notification to user
     const { data: userProfile } = await supabase
       .from('profiles')
       .select('first_name, email')
       .eq('id', id)
       .single()

     if (userProfile?.email) {
       const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
       const emailContent = generatePasswordResetEmail({
         firstName: userProfile.first_name || 'User',
         newPassword: new_password,
         loginUrl
       })

       await sendEmail({
         to: userProfile.email,
         subject: 'Your Password Has Been Reset - BH-EDU',
         ...emailContent
       })
     }

    return NextResponse.json({
      success: true,
       message: 'Password reset successfully. Notification email sent.'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

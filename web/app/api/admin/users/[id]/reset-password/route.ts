/**
 * User Password Reset API
 * POST /api/admin/users/[id]/reset-password - Reset user password
 */

import { NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { getAuthContext } from '@/lib/auth/guard';
import { generatePasswordResetEmail, sendEmail } from '@/lib/email/emailService';
import { logger } from '@/lib/logger';

const PROTECTED_ROLES = new Set(['owner', 'super_admin']);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(request, 'users.edit');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { new_password, send_email = true } = body;

    if (!new_password || new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const { supabase } = await getDataClient(request);

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, role, full_name, email, is_managed')
      .eq('id', id)
      .maybeSingle();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (auth.role !== 'super_admin' && PROTECTED_ROLES.has(userProfile.role)) {
      return NextResponse.json(
        { error: 'Only a super administrator can reset this account' },
        { status: 403 }
      );
    }
    if (!userProfile.user_id) {
      return NextResponse.json(
        { error: 'User profile is not linked to a login account' },
        { status: 409 }
      );
    }

    // Update user password
    const { error: passwordError } = await supabase.auth.admin.updateUserById(userProfile.user_id, {
      password: new_password,
    });

    if (passwordError) {
      logger.error('Error resetting password', passwordError);
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    // Log activity
    await supabase.from('user_activity_logs').insert({
      user_id: id,
      action: 'password_reset',
      description: `Password reset by admin: ${auth.profile.email}`,
      metadata: { reset_by: auth.profile.id },
    });

    // Send email notification to user if requested and valid email exists
    if (send_email && userProfile?.email && !userProfile.is_managed) {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
      const emailContent = generatePasswordResetEmail({
        firstName: userProfile.full_name || 'User',
        newPassword: new_password,
        loginUrl,
      });

      await sendEmail({
        to: userProfile.email,
        subject: 'Your Password Has Been Reset - BH-EDU',
        ...emailContent,
      });
    }

    return NextResponse.json({
      success: true,
      message: send_email
        ? 'Password reset successfully. Notification email sent.'
        : 'Password reset successfully.',
      new_password: new_password, // Return to admin for on-screen display
    });
  } catch (error) {
    logger.error('Error in POST /api/admin/users/[id]/reset-password', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

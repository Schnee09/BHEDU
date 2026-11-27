/**
 * User Password Reset API
 * POST /api/admin/users/[id]/reset-password - Reset user password
 */

import { NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { getAuthContext } from '@/lib/auth/guard';
import { generatePasswordResetEmail, sendEmail } from '@/lib/email/emailService';
import { logger } from '@/lib/logger';
import { canManageUserPermissions } from '@/lib/auth/permissionManagement';
import type { UserRole } from '@/lib/auth/core';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(request, 'users.edit');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { new_password, send_email = true } = body;

    if (typeof new_password !== 'string' || new_password.length < 8 || new_password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 128 characters long' },
        { status: 400 }
      );
    }
    if (typeof send_email !== 'boolean') {
      return NextResponse.json({ error: 'Invalid send_email value' }, { status: 400 });
    }

    const { supabase } = await getDataClient(request);

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, role, full_name, email, is_managed')
      .eq('id', id)
      .maybeSingle();

    if (profileError) {
      logger.error('Error loading password reset target', profileError);
      return NextResponse.json({ error: 'Failed to load user account' }, { status: 500 });
    }
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (
      !canManageUserPermissions({
        actorId: auth.profile.id,
        actorRole: auth.role,
        targetId: userProfile.id,
        targetRole: userProfile.role as UserRole,
      })
    ) {
      return NextResponse.json(
        { error: 'Cannot reset the password of this account' },
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

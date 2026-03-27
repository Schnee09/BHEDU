import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        {
          status: 400,
        }
      );
    }

    const supabase = createServiceClient();

    // Fetch invitation details
    const { data: invite, error } = await supabase
      .from('user_invitations')
      .select(
        `
        id,
        email,
        phone,
        role,
        expires_at,
        used_at,
        metadata,
        invited_by (
          full_name
        )
      `
      )
      .eq('token', token)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        {
          error: 'Lời mời không tồn tại hoặc đã hết hạn',
        },
        { status: 404 }
      );
    }

    // Check if used
    if (invite.used_at) {
      return NextResponse.json(
        { error: 'Lời mời này đã được sử dụng' },
        {
          status: 400,
        }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Lời mời đã hết hạn' },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        phone: invite.phone,
        role: invite.role,
        invitedBy: Array.isArray(invite.invited_by)
          ? (invite.invited_by[0] as { full_name?: string })?.full_name
          : (invite.invited_by as { full_name?: string } | null)?.full_name,
        metadata: invite.metadata
          ? {
              note: (invite.metadata as any).note,
              student_code: (invite.metadata as any).student_code,
            }
          : undefined,
      },
    });
  } catch (error) {
    console.error('Verify invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
      }
    );
  }
}

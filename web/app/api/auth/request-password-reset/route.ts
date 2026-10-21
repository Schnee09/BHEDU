import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/emailService';
import { z } from 'zod';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/auth/rateLimit';

const resetRequestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập Email, Mã định danh (UID) hoặc Số điện thoại')
    .max(200)
    .regex(/^[A-Za-z0-9@._+\-]+$/, 'Thông tin tài khoản chứa ký tự không hợp lệ'),
});

const GENERIC_RESET_MESSAGE =
  'Nếu thông tin khớp với một tài khoản hợp lệ, hướng dẫn khôi phục mật khẩu sẽ được gửi tới email đã đăng ký.';
const PASSWORD_RESET_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
};

function genericResetResponse() {
  return apiSuccess({ requiresAdminContact: false, message: GENERIC_RESET_MESSAGE });
}

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  };
  return value.replace(/[&<>'"]/g, (char) => replacements[char] || char);
}

export const POST = createApiHandler(
  {
    requireAuth: false,
    bodySchema: resetRequestSchema,
  },
  async ({ body, request }) => {
    const rateCheck = checkRateLimit(
      `password-reset:${getRateLimitIdentifier(request)}`,
      PASSWORD_RESET_RATE_LIMIT
    );
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const raw = body.identifier.trim();
    const supabase = createServiceClient();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://bhedu.vn').replace(/\/$/, '');

    // 1. Find profile by identifier (email, personal_email, student_code, teacher_code, student_id, phone)
    let profile: any = null;

    if (raw.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, email, personal_email, full_name, role, is_active')
        .or(`email.eq.${raw.toLowerCase()},personal_email.eq.${raw.toLowerCase()}`)
        .maybeSingle();
      profile = data;
    } else {
      const upper = raw.toUpperCase();
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, email, personal_email, full_name, role, is_active')
        .or(
          `student_code.ilike.${upper},teacher_code.ilike.${upper},student_id.ilike.${raw},phone.eq.${raw},email.ilike.${raw.toLowerCase()}@%`
        )
        .maybeSingle();
      profile = data;
    }

    if (!profile || !profile.email) {
      return genericResetResponse();
    }

    if (!profile.is_active) {
      return genericResetResponse();
    }

    // 2. Check destination email (priority: personal_email if email is virtual/managed)
    const isManagedVirtualDomain =
      profile.email.endsWith('@student.bhedu.vn') ||
      profile.email.endsWith('@id.bhedu.vn') ||
      profile.email.endsWith('@fake.bhedu.vn');

    const targetRecipientEmail = isManagedVirtualDomain
      ? profile.personal_email
      : profile.personal_email || profile.email;

    if (!targetRecipientEmail) {
      return genericResetResponse();
    }

    // 3. Generate Supabase Password Recovery Link
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: profile.email,
        options: {
          redirectTo: `${appUrl}/reset-password`,
        },
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error('Failed to generate recovery link:', linkError);
        return genericResetResponse();
      }

      const recoveryUrl = linkData.properties.action_link;
      const safeRecoveryUrl = escapeHtml(recoveryUrl);

      // 4. Send email to recipient
      const safeName = escapeHtml(profile.full_name || 'Quý học sinh / Phụ huynh');
      const safeAccountEmail = escapeHtml(profile.email);
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1C1917; color: #F59E0B; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #fff; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #D97706; color: white !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 11px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">TRUNG TÂM GIÁO DỤC BÙI HOÀNG (BH-EDU)</h2>
      <p style="margin: 6px 0 0 0; color: #D6D3D1; font-size: 13px;">Yêu cầu đặt lại mật khẩu tài khoản học vụ</p>
    </div>
    <div class="content">
      <p>Kính gửi <strong>${safeName}</strong>,</p>
      <p>Hệ thống BH-EDU vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản: <strong>${safeAccountEmail}</strong>.</p>
      <p>Vui lòng bấm vào nút bên dưới để tiến hành tạo mật khẩu mới:</p>
      <div style="text-align: center;">
        <a href="${safeRecoveryUrl}" class="button">Đặt Lại Mật Khẩu Ngay</a>
      </div>
      <p style="font-size: 12px; color: #78716C;">* Liên kết có hiệu lực trong vòng 24 giờ. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.</p>
      <p>Hotline hỗ trợ kỹ thuật học vụ: <strong>0899 060 686</strong></p>
      <p style="margin-top: 24px;">Trân trọng,<br><strong>Ban Quản trị BH-EDU</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Trung tâm Giáo dục Bùi Hoàng. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      await sendEmail({
        to: targetRecipientEmail,
        subject: '[BH-EDU] Hướng dẫn đặt lại mật khẩu tài khoản học vụ',
        html: emailHtml,
        text: `Kính gửi ${profile.full_name}, vui lòng truy cập liên kết sau để đặt lại mật khẩu: ${recoveryUrl}`,
      });

      return genericResetResponse();
    } catch (err: any) {
      console.error('Password reset process error:', err);
      return genericResetResponse();
    }
  }
);

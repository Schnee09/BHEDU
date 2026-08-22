import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/emailService';
import { z } from 'zod';

const resetRequestSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập Email, Mã định danh (UID) hoặc Số điện thoại'),
});

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0] || '';
  const domain = parts[1] || '';
  if (!name || !domain) return email;
  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`;
  }
  return `${name.charAt(0)}***${name.charAt(name.length - 1)}@${domain}`;
}

export const POST = createApiHandler(
  {
    requireAuth: false,
    bodySchema: resetRequestSchema,
  },
  async ({ body, request }) => {
    const raw = body.identifier.trim();
    const supabase = createServiceClient();
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://bhedu.vn';

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
      return NextResponse.json(
        {
          success: false,
          error: 'Không tìm thấy tài khoản phù hợp với thông tin đã nhập.',
        },
        { status: 404 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản này đang trong trạng thái tạm khóa. Vui lòng liên hệ trung tâm để được hỗ trợ.',
        },
        { status: 403 }
      );
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
      return apiSuccess({
        requiresAdminContact: true,
        message:
          'Tài khoản của bạn chưa đăng ký Email cá nhân nhận tin. Vui lòng liên hệ Văn phòng Trung tâm để được cấp lại mật khẩu.',
        hotline: '0899 060 686',
      });
    }

    // 3. Generate Supabase Password Recovery Link
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: profile.email,
        options: {
          redirectTo: `${origin}/reset-password`,
        },
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error('Failed to generate recovery link:', linkError);
        return NextResponse.json(
          {
            success: false,
            error: 'Không thể tạo liên kết khôi phục mật khẩu. Vui lòng thử lại sau hoặc liên hệ trung tâm.',
          },
          { status: 500 }
        );
      }

      const recoveryUrl = linkData.properties.action_link;

      // 4. Send email to recipient
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
      <p>Kính gửi <strong>${profile.full_name || 'Quý học sinh / Phụ huynh'}</strong>,</p>
      <p>Hệ thống BH-EDU vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản: <strong>${profile.email}</strong>.</p>
      <p>Vui lòng bấm vào nút bên dưới để tiến hành tạo mật khẩu mới:</p>
      <div style="text-align: center;">
        <a href="${recoveryUrl}" class="button">Đặt Lại Mật Khẩu Ngay</a>
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

      return apiSuccess({
        requiresAdminContact: false,
        maskedEmail: maskEmail(targetRecipientEmail),
        message: `Đã gửi hướng dẫn khôi phục mật khẩu tới email "${maskEmail(targetRecipientEmail)}". Vui lòng kiểm tra hộp thư.`,
      });
    } catch (err: any) {
      console.error('Password reset process error:', err);
      return NextResponse.json(
        {
          success: false,
          error: err.message || 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu.',
        },
        { status: 500 }
      );
    }
  }
);

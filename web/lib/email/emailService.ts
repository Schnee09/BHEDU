/**
 * Email Service
 * Handles sending emails using Resend or fallback to console logging
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, text } = options

  // Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.log('📧 Email not sent (Resend API key not configured)')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${text || html}`)
    return { success: false, reason: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@bh-edu.com',
        to,
        subject,
        html,
        text
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Failed to send email:', data)
      return { success: false, reason: data.message || 'Failed to send email' }
    }

    console.log('✅ Email sent successfully to:', to)
    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function generateWelcomeEmail(data: {
  firstName: string
  email: string
  password: string
  role: string
  loginUrl: string
}) {
  const { firstName, email, password, role, loginUrl } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #d97706, #eab308); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .credentials { background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Welcome to BH-EDU</h1>
      <p style="margin: 10px 0 0 0;">Bui Hoang Education</p>
    </div>
    <div class="content">
      <p>Hello <strong>${firstName}</strong>,</p>
      
      <p>Your account has been created successfully! You now have access to the BH-EDU Management System as a <strong>${role}</strong>.</p>
      
      <div class="credentials">
        <h3 style="margin-top: 0;">Your Login Credentials</h3>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
      </div>
      
      <p><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.</p>
      
      <a href="${loginUrl}" class="button">Login to Your Account</a>
      
      <h3>What's Next?</h3>
      <ul>
        <li>Log in using the credentials above</li>
        <li>Update your profile information</li>
        <li>Change your password</li>
        ${role === 'teacher' ? '<li>View your assigned classes</li><li>Start marking attendance</li>' : ''}
        ${role === 'student' ? '<li>View your class schedule</li><li>Check your grades and attendance</li>' : ''}
        ${role === 'admin' ? '<li>Explore the admin dashboard</li><li>Manage students, teachers, and courses</li>' : ''}
      </ul>
      
      <p>If you have any questions or need assistance, please contact your administrator.</p>
      
      <p>Best regards,<br><strong>BH-EDU Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 Bui Hoang Education. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Welcome to BH-EDU, ${firstName}!

Your account has been created successfully as a ${role}.

Login Credentials:
Email: ${email}
Password: ${password}

Please log in at: ${loginUrl}

Important: Change your password after your first login for security.

Best regards,
BH-EDU Team
  `

  return { html, text }
}

export function generatePasswordResetEmail(data: {
  firstName: string
  newPassword: string
  loginUrl: string
}) {
  const { firstName, newPassword, loginUrl } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #d97706, #eab308); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .credentials { background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Password Reset</h1>
      <p style="margin: 10px 0 0 0;">BH-EDU Management System</p>
    </div>
    <div class="content">
      <p>Hello <strong>${firstName}</strong>,</p>
      
      <p>Your password has been reset by an administrator.</p>
      
      <div class="credentials">
        <h3 style="margin-top: 0;">Your New Password</h3>
        <p style="margin: 5px 0; font-size: 18px; font-family: monospace;"><strong>${newPassword}</strong></p>
      </div>
      
      <p><strong>⚠️ Important:</strong> Please change this password immediately after logging in for security purposes.</p>
      
      <a href="${loginUrl}" class="button">Login Now</a>
      
      <p>If you did not request this password reset, please contact your administrator immediately.</p>
      
      <p>Best regards,<br><strong>BH-EDU Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 Bui Hoang Education. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Password Reset - BH-EDU

Hello ${firstName},

Your password has been reset by an administrator.

Your new password: ${newPassword}

Please log in at: ${loginUrl}

Important: Change this password immediately after logging in.

If you did not request this, contact your administrator.

Best regards,
BH-EDU Team
  `

  return { html, text }
}

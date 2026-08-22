/**
 * BH-EDU Print Helper
 * Renders isolated, high-resolution printable documents (A4/A5)
 * without background UI leaking or viewport truncation.
 */

export interface AccountSlipData {
  centerName?: string;
  roleNameVi: string;
  fullName: string;
  loginId: string;
  password?: string;
  email?: string;
  qrDataUrl?: string;
  loginUrl: string;
  issueDate?: string;
  hotline?: string;
  address?: string;
}

export function printAccountSlip(data: AccountSlipData) {
  const issueDate = data.issueDate || new Date().toLocaleDateString('vi-VN');
  const hotline = data.hotline || '0899 060 686';
  const address = data.address || '76 Ngô Quyền, TP. Thủ Đức, TP. Hồ Chí Minh';
  const centerName = data.centerName || 'TRUNG TÂM GIÁO DỤC BÙI HOÀNG';

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Thẻ Tài Khoản Học Vụ - ${data.fullName}</title>
  <style>
    @page {
      size: auto;
      margin: 6mm 8mm;
    }
    @media print {
      html, body {
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background: #ffffff;
      color: #1c1917;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      padding: 6px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .slip-container {
      width: 100%;
      max-width: 680px;
      border: 1.5px solid #1c1917;
      border-radius: 12px;
      padding: 16px 20px;
      background: #ffffff;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e7e5e4;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #b45309;
    }
    .slip-title {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1c1917;
      margin-top: 1px;
    }
    .meta-text {
      font-size: 10px;
      color: #78716c;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      margin-top: 1px;
    }
    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    /* Grid */
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 12px;
      margin-bottom: 12px;
    }
    .info-box {
      background: #fafaf9;
      border: 1px solid #d6d3d1;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .info-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #78716c;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 800;
      color: #1c1917;
      word-break: break-all;
    }
    .info-value.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      color: #0f172a;
    }
    /* QR Section */
    .qr-section {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .qr-box {
      width: 72px;
      height: 72px;
      background: #ffffff;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      padding: 3px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .guide-box {
      font-size: 10.5px;
      line-height: 1.45;
    }
    .guide-title {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .guide-list {
      list-style-type: disc;
      padding-left: 14px;
      color: #334155;
    }
    .guide-list li {
      margin-bottom: 1px;
    }
    .highlight {
      font-weight: 700;
      color: #0f172a;
    }
    /* Signatures */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      text-align: center;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      margin-bottom: 10px;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 52px;
    }
    .sig-title {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #1c1917;
    }
    .sig-hint {
      font-size: 9.5px;
      color: #64748b;
      font-style: italic;
    }
    /* Footer */
    .footer {
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">${centerName}</div>
        <div class="slip-title">Thẻ Tài Khoản Học Vụ</div>
        <div class="meta-text">BH-EDU • Ngày cấp: ${issueDate}</div>
      </div>
      <div>
        <span class="role-badge">${data.roleNameVi}</span>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="grid">
      <div class="info-box">
        <div class="info-label">Họ và tên</div>
        <div class="info-value">${data.fullName}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Tên đăng nhập (Mã UID)</div>
        <div class="info-value mono">${data.loginId}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Mật khẩu ban đầu</div>
        <div class="info-value mono">${data.password || '******'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Email hệ thống</div>
        <div class="info-value mono" style="font-size: 11px;">${data.email || data.loginId}</div>
      </div>
    </div>

    <!-- QR & Security Notice -->
    <div class="qr-section">
      <div class="qr-box">
        ${
          data.qrDataUrl
            ? `<img src="${data.qrDataUrl}" alt="QR Đăng nhập" />`
            : `<div style="font-size: 8px; text-align:center;">QR CODE</div>`
        }
      </div>
      <div class="guide-box">
        <div class="guide-title">🛡️ Hướng dẫn đăng nhập & Lưu ý bảo mật:</div>
        <ul class="guide-list">
          <li>Quét mã QR bằng điện thoại hoặc truy cập: <span class="highlight">${data.loginUrl}</span></li>
          <li>Đăng nhập bằng <span class="highlight">Tên đăng nhập (Mã UID)</span> hoặc <span class="highlight">Email</span> với mật khẩu ở trên.</li>
          <li><span class="highlight">Vui lòng đổi mật khẩu mới</span> sau lần đăng nhập đầu tiên để bảo mật tài khoản.</li>
          <li>Hotline hỗ trợ kỹ thuật học vụ: <span class="highlight">${hotline}</span></li>
        </ul>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-col">
        <div class="sig-title">Học sinh / Người nhận</div>
        <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Giáo vụ trung tâm</div>
        <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Địa chỉ: ${address} • Hotline: ${hotline} • Cổng thông tin: bhedu.vn
    </div>
  </div>
</body>
</html>
  `.trim();

  // Create isolated invisible iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    document.body.removeChild(iframe);
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  // Allow images/styles to load before printing
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up iframe after user completes print dialog
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 250);
}

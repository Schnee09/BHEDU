/**
 * Report Card Generation Service
 * Generates printable PDF report cards for students
 */

export interface StudentGrades {
  studentId: string;
  studentName: string;
  className: string;
  semester: string;
  subjects: SubjectGrade[];
  attendance: AttendanceStats;
  overallAverage: number;
  rank?: number;
  teacherComments?: string;
}

interface SubjectGrade {
  subject: string;
  midterm: number;
  final: number;
  average: number;
  letterGrade: string;
}

interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

/**
 * Generate HTML content for a report card
 */
function generateReportCardHTML(data: StudentGrades): string {
  const now = new Date();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Phiếu Điểm - ${data.studentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      padding: 40px;
      background: white;
    }
    .report-card {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #4f46e5;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.9; }
    .logo { font-size: 48px; margin-bottom: 16px; }
    
    .student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-group { }
    .info-group label { 
      font-size: 12px; 
      color: #64748b; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-group p { 
      font-size: 18px; 
      font-weight: 600; 
      color: #1e293b;
      margin-top: 4px;
    }
    
    .grades-section { padding: 24px; }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #4f46e5;
    }
    
    .grades-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .grades-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
    }
    .grades-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .grade-cell {
      font-weight: 600;
      text-align: center;
    }
    .grade-a { color: #16a34a; }
    .grade-b { color: #2563eb; }
    .grade-c { color: #ca8a04; }
    .grade-d { color: #ea580c; }
    .grade-f { color: #dc2626; }
    
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .summary-card.highlight {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
    }
    .summary-value {
      font-size: 32px;
      font-weight: 700;
    }
    .summary-label {
      font-size: 12px;
      margin-top: 4px;
      opacity: 0.8;
    }
    
    .attendance {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .attendance-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 12px;
    }
    .attendance-item {
      text-align: center;
    }
    .attendance-item .value {
      font-size: 24px;
      font-weight: 600;
    }
    .attendance-item .label {
      font-size: 12px;
      color: #64748b;
    }
    
    .comments {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 20px;
    }
    .comments p {
      font-style: italic;
      color: #92400e;
      line-height: 1.6;
    }
    
    .footer {
      padding: 24px;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      text-align: center;
    }
    .signature-line {
      width: 150px;
      border-top: 1px solid #94a3b8;
      margin: 40px auto 8px;
    }
    .signature p { font-size: 12px; color: #64748b; }
    
    .print-date {
      text-align: center;
      padding: 16px;
      color: #94a3b8;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <div class="logo">🎓</div>
      <h1>BH-EDU EDUCATION</h1>
      <p>Phiếu Báo Cáo Học Tập - ${data.semester}</p>
    </div>
    
    <div class="student-info">
      <div class="info-group">
        <label>Họ và tên học sinh</label>
        <p>${data.studentName}</p>
      </div>
      <div class="info-group">
        <label>Lớp</label>
        <p>${data.className}</p>
      </div>
    </div>
    
    <div class="grades-section">
      <h2 class="section-title">Kết Quả Học Tập</h2>
      
      <table class="grades-table">
        <thead>
          <tr>
            <th>Môn học</th>
            <th style="text-align: center">Giữa kỳ</th>
            <th style="text-align: center">Cuối kỳ</th>
            <th style="text-align: center">Trung bình</th>
            <th style="text-align: center">Xếp loại</th>
          </tr>
        </thead>
        <tbody>
          ${data.subjects.map(subject => `
            <tr>
              <td>${subject.subject}</td>
              <td class="grade-cell">${subject.midterm.toFixed(1)}</td>
              <td class="grade-cell">${subject.final.toFixed(1)}</td>
              <td class="grade-cell">${subject.average.toFixed(1)}</td>
              <td class="grade-cell grade-${subject.letterGrade.toLowerCase().charAt(0)}">${subject.letterGrade}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-card highlight">
          <div class="summary-value">${data.overallAverage.toFixed(1)}</div>
          <div class="summary-label">Điểm trung bình</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${data.rank ? '#' + data.rank : '-'}</div>
          <div class="summary-label">Xếp hạng lớp</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${data.attendance.rate}%</div>
          <div class="summary-label">Tỉ lệ chuyên cần</div>
        </div>
      </div>
      
      <div class="attendance">
        <h3 class="section-title">Thống Kê Điểm Danh</h3>
        <div class="attendance-grid">
          <div class="attendance-item">
            <div class="value">${data.attendance.totalDays}</div>
            <div class="label">Tổng số buổi</div>
          </div>
          <div class="attendance-item">
            <div class="value" style="color: #16a34a">${data.attendance.present}</div>
            <div class="label">Có mặt</div>
          </div>
          <div class="attendance-item">
            <div class="value" style="color: #dc2626">${data.attendance.absent}</div>
            <div class="label">Vắng mặt</div>
          </div>
          <div class="attendance-item">
            <div class="value" style="color: #ca8a04">${data.attendance.late}</div>
            <div class="label">Đi trễ</div>
          </div>
        </div>
      </div>
      
      ${data.teacherComments ? `
        <div class="comments">
          <h3 class="section-title">Nhận Xét Của Giáo Viên</h3>
          <p>${data.teacherComments}</p>
        </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <p>Phụ huynh ký tên</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>Giáo viên chủ nhiệm</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>Hiệu trưởng</p>
      </div>
    </div>
    
    <div class="print-date">
      In ngày: ${now.toLocaleDateString('vi-VN')} | BH-EDU Education Management System
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate and print a report card
 */
export function printReportCard(data: StudentGrades): void {
  const html = generateReportCardHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Download report card as HTML file (can be opened and printed)
 */
export function downloadReportCard(data: StudentGrades): void {
  const html = generateReportCardHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `phieu-diem-${data.studentName.replace(/\s+/g, '-')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get letter grade from numeric average
 */
export function getLetterGrade(average: number): string {
  if (average >= 9) return 'A';
  if (average >= 8) return 'B+';
  if (average >= 7) return 'B';
  if (average >= 6) return 'C+';
  if (average >= 5) return 'C';
  if (average >= 4) return 'D';
  return 'F';
}

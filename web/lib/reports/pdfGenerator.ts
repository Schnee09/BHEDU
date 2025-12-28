/**
 * PDF Generator Service
 * 
 * Generates PDF documents for various report types using browser print-to-PDF.
 * This approach is more compatible and doesn't require external dependencies.
 * 
 * Supported report types:
 * - Student Report Card (Học bạ)
 * - Attendance Summary (Báo cáo điểm danh)
 * - Class Performance Report (Báo cáo lớp học)
 * - Transcript (Bảng điểm)
 */

import { StudentTranscript } from '@/lib/grades/transcriptService';

export interface ReportConfig {
  title: string;
  subtitle?: string;
  schoolName: string;
  schoolAddress?: string;
  academicYear: string;
  semester?: string;
  generatedBy?: string;
  generatedAt: Date;
}

export interface ReportCardData {
  studentName: string;
  studentCode: string;
  className: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  parentName?: string;
  subjects: Array<{
    name: string;
    oralScore?: number;
    fifteenMinScore?: number;
    fortyFiveMinScore?: number;
    midtermScore?: number;
    finalScore?: number;
    averageScore: number;
    letterGrade: string;
  }>;
  semesterGPA: number;
  classRank?: number;
  classSize?: number;
  attendanceRate: number;
  conductGrade: string;
  teacherComment?: string;
}

export interface AttendanceReportData {
  reportPeriod: { start: string; end: string };
  students: Array<{
    studentName: string;
    studentCode: string;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    totalDays: number;
    attendanceRate: number;
  }>;
  classSummary: {
    averageAttendanceRate: number;
    totalStudents: number;
    perfectAttendance: number;
  };
}

/**
 * Generate HTML for Report Card
 */
export function generateReportCardHTML(
  data: ReportCardData,
  config: ReportConfig
): string {
  const subjectsRows = data.subjects.map((subject, i) => `
    <tr class="${i % 2 === 0 ? 'bg-gray-50' : ''}">
      <td class="border px-3 py-2 text-left">${subject.name}</td>
      <td class="border px-3 py-2 text-center">${subject.oralScore?.toFixed(1) || '-'}</td>
      <td class="border px-3 py-2 text-center">${subject.fifteenMinScore?.toFixed(1) || '-'}</td>
      <td class="border px-3 py-2 text-center">${subject.fortyFiveMinScore?.toFixed(1) || '-'}</td>
      <td class="border px-3 py-2 text-center">${subject.midtermScore?.toFixed(1) || '-'}</td>
      <td class="border px-3 py-2 text-center">${subject.finalScore?.toFixed(1) || '-'}</td>
      <td class="border px-3 py-2 text-center font-semibold">${subject.averageScore.toFixed(2)}</td>
      <td class="border px-3 py-2 text-center">${subject.letterGrade}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Học Bạ - ${data.studentName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4;
      margin: 1cm;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body { font-family: 'Times New Roman', Times, serif; }
  </style>
</head>
<body class="p-8 max-w-4xl mx-auto bg-white">
  <!-- Header -->
  <div class="text-center mb-6">
    <h1 class="text-xl font-bold uppercase">${config.schoolName}</h1>
    ${config.schoolAddress ? `<p class="text-sm text-gray-600">${config.schoolAddress}</p>` : ''}
    <h2 class="text-2xl font-bold mt-4 text-blue-800">HỌC BẠ</h2>
    <p class="text-lg">${config.academicYear} ${config.semester ? `- ${config.semester}` : ''}</p>
  </div>

  <!-- Student Info -->
  <div class="mb-6 border-2 border-gray-300 rounded-lg p-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p><strong>Họ và tên:</strong> ${data.studentName}</p>
        <p><strong>Mã học sinh:</strong> ${data.studentCode}</p>
        <p><strong>Lớp:</strong> ${data.className}</p>
      </div>
      <div>
        <p><strong>Ngày sinh:</strong> ${data.dateOfBirth}</p>
        <p><strong>Giới tính:</strong> ${data.gender}</p>
        ${data.parentName ? `<p><strong>Phụ huynh:</strong> ${data.parentName}</p>` : ''}
      </div>
    </div>
  </div>

  <!-- Grades Table -->
  <div class="mb-6">
    <h3 class="text-lg font-bold mb-2 text-blue-800">BẢNG ĐIỂM</h3>
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-blue-100">
          <th class="border px-3 py-2 text-left">Môn học</th>
          <th class="border px-3 py-2 text-center">Miệng</th>
          <th class="border px-3 py-2 text-center">15 phút</th>
          <th class="border px-3 py-2 text-center">1 tiết</th>
          <th class="border px-3 py-2 text-center">Giữa kỳ</th>
          <th class="border px-3 py-2 text-center">Cuối kỳ</th>
          <th class="border px-3 py-2 text-center">TB Môn</th>
          <th class="border px-3 py-2 text-center">Xếp loại</th>
        </tr>
      </thead>
      <tbody>
        ${subjectsRows}
      </tbody>
    </table>
  </div>

  <!-- Summary -->
  <div class="grid grid-cols-2 gap-6 mb-6">
    <div class="border-2 border-gray-300 rounded-lg p-4">
      <h4 class="font-bold text-blue-800 mb-2">KẾT QUẢ HỌC TẬP</h4>
      <p><strong>Điểm trung bình:</strong> <span class="text-2xl font-bold text-blue-600">${data.semesterGPA.toFixed(2)}</span></p>
      ${data.classRank && data.classSize ? `<p><strong>Xếp hạng:</strong> ${data.classRank}/${data.classSize}</p>` : ''}
      <p><strong>Hạnh kiểm:</strong> ${data.conductGrade}</p>
    </div>
    <div class="border-2 border-gray-300 rounded-lg p-4">
      <h4 class="font-bold text-blue-800 mb-2">CHUYÊN CẦN</h4>
      <p><strong>Tỷ lệ đi học:</strong> <span class="text-xl font-bold ${data.attendanceRate >= 90 ? 'text-green-600' : data.attendanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'}">${data.attendanceRate.toFixed(1)}%</span></p>
    </div>
  </div>

  <!-- Teacher Comment -->
  ${data.teacherComment ? `
  <div class="mb-6 border-2 border-gray-300 rounded-lg p-4">
    <h4 class="font-bold text-blue-800 mb-2">NHẬN XÉT CỦA GIÁO VIÊN</h4>
    <p class="italic">${data.teacherComment}</p>
  </div>
  ` : ''}

  <!-- Signatures -->
  <div class="grid grid-cols-3 gap-4 mt-8 text-center">
    <div>
      <p class="font-bold">PHỤ HUYNH</p>
      <p class="text-sm text-gray-500">(Ký và ghi rõ họ tên)</p>
      <div class="h-20"></div>
    </div>
    <div>
      <p class="font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
      <p class="text-sm text-gray-500">(Ký và ghi rõ họ tên)</p>
      <div class="h-20"></div>
    </div>
    <div>
      <p class="font-bold">HIỆU TRƯỞNG</p>
      <p class="text-sm text-gray-500">(Ký, đóng dấu)</p>
      <div class="h-20"></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="mt-8 text-center text-sm text-gray-500">
    <p>Ngày xuất: ${config.generatedAt.toLocaleDateString('vi-VN')}</p>
    ${config.generatedBy ? `<p>Người tạo: ${config.generatedBy}</p>` : ''}
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for Attendance Report
 */
export function generateAttendanceReportHTML(
  data: AttendanceReportData,
  config: ReportConfig
): string {
  const studentRows = data.students.map((student, i) => `
    <tr class="${i % 2 === 0 ? 'bg-gray-50' : ''}">
      <td class="border px-3 py-2">${i + 1}</td>
      <td class="border px-3 py-2">${student.studentName}</td>
      <td class="border px-3 py-2 text-center">${student.studentCode}</td>
      <td class="border px-3 py-2 text-center text-green-600">${student.presentDays}</td>
      <td class="border px-3 py-2 text-center text-red-600">${student.absentDays}</td>
      <td class="border px-3 py-2 text-center text-yellow-600">${student.lateDays}</td>
      <td class="border px-3 py-2 text-center text-blue-600">${student.excusedDays}</td>
      <td class="border px-3 py-2 text-center">${student.totalDays}</td>
      <td class="border px-3 py-2 text-center font-semibold ${student.attendanceRate >= 90 ? 'text-green-600' : student.attendanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'}">${student.attendanceRate.toFixed(1)}%</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Điểm Danh - ${config.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 landscape; margin: 1cm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body class="p-8 bg-white">
  <!-- Header -->
  <div class="text-center mb-6">
    <h1 class="text-xl font-bold uppercase">${config.schoolName}</h1>
    <h2 class="text-2xl font-bold mt-4 text-blue-800">BÁO CÁO ĐIỂM DANH</h2>
    <p class="text-lg">${config.title}</p>
    <p class="text-sm text-gray-600">Từ ${data.reportPeriod.start} đến ${data.reportPeriod.end}</p>
  </div>

  <!-- Summary -->
  <div class="grid grid-cols-3 gap-4 mb-6">
    <div class="bg-blue-50 rounded-lg p-4 text-center">
      <p class="text-3xl font-bold text-blue-600">${data.classSummary.totalStudents}</p>
      <p class="text-sm text-gray-600">Tổng số học sinh</p>
    </div>
    <div class="bg-green-50 rounded-lg p-4 text-center">
      <p class="text-3xl font-bold text-green-600">${data.classSummary.averageAttendanceRate.toFixed(1)}%</p>
      <p class="text-sm text-gray-600">Tỷ lệ đi học TB</p>
    </div>
    <div class="bg-purple-50 rounded-lg p-4 text-center">
      <p class="text-3xl font-bold text-purple-600">${data.classSummary.perfectAttendance}</p>
      <p class="text-sm text-gray-600">Đi học đầy đủ</p>
    </div>
  </div>

  <!-- Table -->
  <table class="w-full border-collapse text-sm">
    <thead>
      <tr class="bg-blue-100">
        <th class="border px-3 py-2">STT</th>
        <th class="border px-3 py-2 text-left">Họ và tên</th>
        <th class="border px-3 py-2">Mã HS</th>
        <th class="border px-3 py-2">Có mặt</th>
        <th class="border px-3 py-2">Vắng</th>
        <th class="border px-3 py-2">Đi muộn</th>
        <th class="border px-3 py-2">Có phép</th>
        <th class="border px-3 py-2">Tổng ngày</th>
        <th class="border px-3 py-2">Tỷ lệ</th>
      </tr>
    </thead>
    <tbody>
      ${studentRows}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="mt-8 grid grid-cols-2 gap-4">
    <div class="text-sm text-gray-500">
      <p>Ngày xuất: ${config.generatedAt.toLocaleDateString('vi-VN')}</p>
    </div>
    <div class="text-right">
      <p class="font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
      <p class="text-sm text-gray-500">(Ký và ghi rõ họ tên)</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for Transcript
 */
export function generateTranscriptHTML(
  transcript: StudentTranscript,
  config: ReportConfig
): string {
  const semesterBlocks = transcript.semesters.map(semester => {
    const courseRows = semester.courses.map((course, i) => `
      <tr class="${i % 2 === 0 ? 'bg-gray-50' : ''}">
        <td class="border px-2 py-1">${course.courseName}</td>
        <td class="border px-2 py-1 text-center">${course.credits}</td>
        <td class="border px-2 py-1 text-center">${course.averageScore?.toFixed(2) || '-'}</td>
        <td class="border px-2 py-1 text-center">${course.letterGrade}</td>
        <td class="border px-2 py-1 text-center ${course.status === 'passed' ? 'text-green-600' : 'text-red-600'}">${course.status === 'passed' ? 'Đạt' : course.status === 'failed' ? 'Chưa đạt' : 'Đang học'}</td>
      </tr>
    `).join('');

    return `
      <div class="mb-6">
        <h4 class="font-bold bg-blue-100 px-3 py-2">${semester.semesterName} - ${semester.academicYear}</h4>
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-gray-100">
              <th class="border px-2 py-1 text-left">Môn học</th>
              <th class="border px-2 py-1 w-20">Tín chỉ</th>
              <th class="border px-2 py-1 w-20">Điểm</th>
              <th class="border px-2 py-1 w-20">Xếp loại</th>
              <th class="border px-2 py-1 w-24">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${courseRows}
          </tbody>
          <tfoot>
            <tr class="bg-blue-50 font-semibold">
              <td class="border px-2 py-1">Điểm TB học kỳ</td>
              <td class="border px-2 py-1 text-center">${semester.semesterCredits}</td>
              <td class="border px-2 py-1 text-center text-blue-600">${semester.semesterGPA.toFixed(2)}</td>
              <td class="border px-2 py-1" colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Bảng Điểm - ${transcript.fullName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 1cm; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body class="p-8 max-w-4xl mx-auto bg-white text-sm">
  <!-- Header -->
  <div class="text-center mb-6">
    <h1 class="text-xl font-bold uppercase">${config.schoolName}</h1>
    <h2 class="text-2xl font-bold mt-4 text-blue-800">BẢNG ĐIỂM TOÀN KHÓA</h2>
  </div>

  <!-- Student Info -->
  <div class="grid grid-cols-2 gap-4 mb-6 border-2 rounded-lg p-4">
    <div>
      <p><strong>Họ và tên:</strong> ${transcript.fullName}</p>
      <p><strong>Mã học sinh:</strong> ${transcript.studentCode}</p>
      <p><strong>Lớp:</strong> ${transcript.className}</p>
    </div>
    <div>
      <p><strong>Ngày sinh:</strong> ${transcript.dateOfBirth}</p>
      <p><strong>Ngày nhập học:</strong> ${transcript.enrollmentDate}</p>
    </div>
  </div>

  <!-- Semesters -->
  ${semesterBlocks}

  <!-- Summary -->
  <div class="bg-blue-100 rounded-lg p-4 mt-6">
    <h4 class="font-bold mb-2">TỔNG KẾT</h4>
    <div class="grid grid-cols-4 gap-4">
      <div>
        <p class="text-sm text-gray-600">Điểm TB tích lũy</p>
        <p class="text-2xl font-bold text-blue-600">${transcript.cumulativeGPA.toFixed(2)}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Điểm GPA (4.0)</p>
        <p class="text-2xl font-bold text-purple-600">${transcript.cumulativeGPA4.toFixed(2)}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Tín chỉ tích lũy</p>
        <p class="text-2xl font-bold">${transcript.totalCreditsEarned}/${transcript.totalCredits}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Học lực</p>
        <p class="text-2xl font-bold text-green-600">${transcript.academicStanding}</p>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="mt-8 text-center text-xs text-gray-500">
    <p>Ngày xuất: ${config.generatedAt.toLocaleDateString('vi-VN')}</p>
  </div>
</body>
</html>
  `;
}

/**
 * Open print dialog for PDF export
 */
export function printReport(htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Download HTML as file (for server-side PDF conversion)
 */
export function downloadHTML(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

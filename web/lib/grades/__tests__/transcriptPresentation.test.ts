import { generateTranscriptHTML } from '@/lib/reports/pdfGenerator';
import { formatTranscriptSummary, type StudentTranscript } from '@/lib/grades/transcriptService';

const transcript: StudentTranscript = {
  studentId: 'student-1',
  studentCode: 'HS001',
  fullName: 'Nguyễn Văn An',
  dateOfBirth: '2010-01-01',
  className: 'Toán 9A',
  enrollmentDate: '2026-09-01',
  semesters: [
    {
      semesterId: 'semester-1',
      semesterName: 'Học kỳ 1',
      academicYear: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2027-01-15',
      semesterGPA: 8.25,
      semesterCredits: 2,
      semesterCreditsEarned: 2,
      courses: [
        {
          courseId: 'math',
          courseCode: 'MATH',
          courseName: 'Toán',
          credits: 2,
          averageScore: 8.25,
          letterGrade: 'Giỏi',
          status: 'passed',
        },
      ],
    },
  ],
  cumulativeGPA: 8.25,
  cumulativeGPA4: 3.5,
  totalCredits: 2,
  totalCreditsEarned: 2,
  academicStanding: 'Giỏi',
  generatedAt: '2026-11-16T00:00:00.000Z',
};

describe('transcript presentation', () => {
  it('uses terminology suitable for a secondary education center in text summaries', () => {
    const summary = formatTranscriptSummary(transcript);

    expect(summary).toContain('Điểm trung bình: 8.25');
    expect(summary).toContain('Số môn có kết quả: 1');
    expect(summary).not.toMatch(/GPA|tín chỉ/i);
  });

  it('does not expose university grading concepts in printable reports', () => {
    const html = generateTranscriptHTML(transcript, {
      title: 'Kết quả học tập',
      schoolName: 'BH-EDU',
      academicYear: '2026-2027',
      generatedAt: new Date('2026-11-16T00:00:00.000Z'),
    });

    expect(html).toContain('Điểm trung bình');
    expect(html).toContain('Số kỳ đã tổng hợp');
    expect(html).not.toMatch(/GPA|tín chỉ/i);
  });
});

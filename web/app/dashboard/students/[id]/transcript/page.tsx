'use client';

/**
 * Student Transcript (Học bạ) Page
 * Modernized with Strict Ban design system
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { Icons } from '@/components/ui/Icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';
import { QRCode } from '@/components/ui/QRCode';

// Lazy-loaded PDF components - @react-pdf only loads when needed
import {
  LazyPDFViewer as PDFViewer,
  LazyPDFDownloadLink as PDFDownloadLink,
  LazyHocBaDocument as HocBaDocument,
  type TranscriptData,
} from '@/components/pdf/LazyPDF';
import { toast } from 'react-hot-toast';

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Student {
  id: string;
  full_name: string;
  student_code: string;
  date_of_birth: string;
  gender: string;
  grade_level: string;
  email: string;
}

const SEMESTERS = [
  { value: 'HK1', label: 'Học kỳ 1' },
  { value: 'HK2', label: 'Học kỳ 2' },
  { value: 'CN', label: 'Cả năm' },
];

export default function TranscriptPageGuarded({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PageGuard permissions="students.view">
      <TranscriptPage params={params} />
    </PageGuard>
  );
}

function TranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('HK1');
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch student info
  useEffect(() => {
    fetchStudent();
    fetchAcademicYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch transcript data when selections change
  useEffect(() => {
    if (selectedYear && selectedSemester) {
      fetchTranscriptData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester]);

  const fetchStudent = async () => {
    try {
      const res = await apiFetch(`/api/students/${resolvedParams.id}`);
      const data = await res.json();
      if (data.success) {
        setStudent(data.data || data.student);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      setError('Không thể tải thông tin học sinh');
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await apiFetch('/api/admin/academic-years');
      const data = await res.json();
      if (data.success) {
        setAcademicYears(data.data || []);
        const currentYear = data.data?.find((y: AcademicYear) => y.is_current);
        if (currentYear) {
          setSelectedYear(currentYear.id);
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchTranscriptData = async () => {
    if (!selectedYear || !selectedSemester) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(
        `/api/students/${resolvedParams.id}/transcript?academic_year_id=${selectedYear}&semester=${selectedSemester}`
      );
      const data = await res.json();

      if (data.success && data.data) {
        setTranscriptData(data.data);
      } else {
        setError(data.error || 'Không có dữ liệu kết quả học tập');
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setError('Lỗi khi tải dữ liệu kết quả học tập');
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-stone-500 font-serif italic">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-stone-50 dark:bg-stone-950 min-h-screen animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl shadow-sm p-5 sm:p-6 border border-stone-200 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-5 relative z-10">
          <div className="flex-1 space-y-3">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-600 dark:text-stone-400 font-medium text-xs hover:bg-amber-500 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <Icons.Back className="w-3.5 h-3.5" />
              Quay lại danh mục
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Hồ sơ học thuật
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                Phiếu kết quả học tập
              </h1>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <p className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100">
                  {student.full_name}
                </p>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Mã HS:
                  </span>
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                    {student.student_code}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto">
            <div className="p-3.5 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200/60 dark:border-white/5">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Năm học</p>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-transparent font-semibold text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-none cursor-pointer"
              >
                <option value="" className="text-stone-900">
                  -- Chọn năm học --
                </option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id} className="text-stone-900">
                    {year.name} {year.is_current && ' (HIỆN TẠI)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200/60 dark:border-white/5">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Học kỳ</p>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-transparent font-semibold text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-none cursor-pointer"
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem.value} value={sem.value} className="text-stone-900">
                    {sem.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* States */}
      {loading && (
        <Card className="p-12 sm:p-16 text-center animate-pulse border-none shadow-xs bg-white dark:bg-stone-900">
          <Icons.Refresh className="w-10 h-10 text-amber-500 mx-auto animate-spin mb-3" />
          <p className="font-semibold text-xs sm:text-sm text-stone-500">
            Đang khởi tạo dữ liệu kết quả học tập...
          </p>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-8 sm:p-12 text-center border-rose-500/20 bg-rose-500/5">
          <Icons.Error className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="font-bold text-stone-800 dark:text-white mb-1">Lỗi hệ thống</p>
          <p className="text-rose-600 text-xs sm:text-sm">{error}</p>
        </Card>
      )}

      {/* Content */}
      {transcriptData && !loading && !error && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            <Card className="p-4 sm:p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs border-none rounded-2xl">
              <p className="text-xs font-medium opacity-90 mb-1">Điểm trung bình (GPA)</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">
                {transcriptData.gpa.toFixed(2)}
              </p>
            </Card>
            <Card className="p-4 sm:p-5 bg-emerald-600 shadow-xs border-none text-white rounded-2xl">
              <p className="text-xs font-medium opacity-90 mb-1">Hạnh kiểm</p>
              <p className="text-2xl sm:text-3xl font-bold">{transcriptData.conduct}</p>
            </Card>
            <Card className="p-4 sm:p-5 bg-stone-900 shadow-xs border-none text-white rounded-2xl">
              <p className="text-xs font-medium opacity-90 mb-1">Chuyên cần</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">
                {transcriptData.attendance_rate.toFixed(1)}%
              </p>
            </Card>
            <Card className="p-4 sm:p-5 bg-white dark:bg-stone-800 shadow-xs border-stone-200/80 dark:border-white/5 rounded-2xl">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                Số môn học
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white font-mono">
                {transcriptData.subjects.length}
              </p>
            </Card>
          </div>

          {/* Subjects Grid */}
          <Card className="p-0 overflow-hidden border border-stone-200/80 dark:border-white/5 shadow-xs rounded-2xl">
            <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                Chi tiết kết quả môn học
              </h2>
              <Badge
                variant="default"
                className="px-2.5 py-0.5 font-medium text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800"
              >
                Học kỳ {selectedSemester}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50/90 dark:bg-stone-800/80 border-b border-stone-100 dark:border-white/5">
                  <tr className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    <th className="px-5 py-3.5">Môn học</th>
                    <th className="px-5 py-3.5 text-center text-blue-700 dark:text-blue-300 bg-blue-500/5">
                      Giữa kỳ (50%)
                    </th>
                    <th className="px-5 py-3.5 text-center text-emerald-700 dark:text-emerald-300 bg-emerald-500/5">
                      Cuối kỳ (50%)
                    </th>
                    <th className="px-5 py-3.5 text-right">Điểm Tổng kết (TBM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                  {transcriptData.subjects.map((subject, index) => (
                    <tr
                      key={index}
                      className="group hover:bg-stone-50/70 dark:hover:bg-amber-500/5 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-sm sm:text-base text-stone-900 dark:text-white">
                          {subject.subject_name}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-500/5 text-sm sm:text-base">
                        {subject.component_grades?.midterm != null
                          ? Number(subject.component_grades.midterm).toFixed(1)
                          : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/5 text-sm sm:text-base">
                        {subject.component_grades?.final != null
                          ? Number(subject.component_grades.final).toFixed(1)
                          : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-mono font-bold text-base sm:text-lg text-amber-700 dark:text-amber-400">
                          {subject.final_grade.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 rounded-2xl shadow-xs border border-stone-200/80 dark:border-white/5 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Icons.Save className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Xuất dữ liệu & Tương tác
                </p>
                <p className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                  Bản sao kết quả & Báo cáo Zalo
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (!student || !transcriptData) return;
                  const semLabel =
                    SEMESTERS.find((s) => s.value === selectedSemester)?.label || selectedSemester;
                  const yearName = academicYears.find((y) => y.id === selectedYear)?.name || '';
                  const reportUrl = typeof window !== 'undefined' ? window.location.href : '';

                  const textToCopy = `[TRUNG TÂM GIÁO DỤC BÙI HOÀNG - KẾT QUẢ HỌC TẬP]
Kính gửi Quý Phụ huynh học sinh ${student.full_name},
Trung tâm xin gửi phiếu kết quả học tập kỳ ${semLabel} (${yearName}):
- Điểm trung bình (GPA): ${transcriptData.gpa}
- Hạnh kiểm: ${transcriptData.conduct}
- Tỷ lệ chuyên cần: ${transcriptData.attendance_rate}%
- Số môn học: ${transcriptData.subjects.length} môn
- Tra cứu chi tiết kết quả tại: ${reportUrl}
(Mọi thắc mắc xin vui lòng liên hệ Hotline trung tâm: 0899 060 686).`;

                  navigator.clipboard.writeText(textToCopy);
                  toast.success('Đã sao chép mẫu tin nhắn Zalo gửi phụ huynh!');
                }}
                className="px-5 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-amber-100 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Sao chép Zalo/SMS</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-stone-100 dark:bg-white/5 text-stone-900 dark:text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-200 dark:hover:bg-white/10 transition-all shadow-xs cursor-pointer"
              >
                In phiếu kết quả
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-5 py-2.5 bg-stone-100 dark:bg-white/5 text-stone-900 dark:text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-200 dark:hover:bg-white/10 transition-all shadow-xs cursor-pointer"
              >
                {showPreview ? 'Đóng PDF' : 'Xem trước PDF'}
              </button>

              <PDFDownloadLink
                document={<HocBaDocument data={transcriptData} />}
                fileName={`ket-qua-hoc-tap-${student.student_code}-${selectedSemester}-${selectedYear}.pdf`}
              >
                {({ loading }) => (
                  <button
                    disabled={loading}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Đang chuẩn bị...' : 'Tải PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>

          {/* Printable Official Signatures & QR Section for Print View */}
          <div className="hidden print:block space-y-6 pt-6 border-t-2 border-black">
            <div className="flex justify-between items-center bg-stone-50 p-4 border border-stone-300 rounded-xl">
              <div className="space-y-1 text-xs">
                <p className="font-bold text-black uppercase">
                  Tra cứu phiếu kết quả học tập & Xác thực:
                </p>
                <p className="text-[11px] text-stone-700">
                  Quét mã QR bằng điện thoại để đối soát trực tiếp trên hệ thống BH-EDU
                </p>
                <p className="text-[10px] text-stone-500 font-mono">
                  Ngày xuất phiếu: {new Date().toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="w-20 h-20 bg-white p-1 border border-stone-400 rounded-lg shrink-0 flex items-center justify-center">
                <QRCode
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  size={72}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-center pt-8">
              <div className="space-y-16">
                <p className="text-xs font-bold uppercase text-black">Phụ huynh học sinh</p>
                <p className="text-[11px] text-stone-600 italic">(Ký và ghi rõ họ tên)</p>
              </div>
              <div className="space-y-16">
                <p className="text-xs font-bold uppercase text-black">Cán bộ phụ trách / Giáo vụ</p>
                <p className="text-[11px] text-stone-600 italic">(Ký, ghi rõ họ tên & đóng dấu)</p>
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          {showPreview && (
            <Card className="p-0 overflow-hidden border-none shadow-2xl bg-stone-100 animate-in zoom-in-95 duration-500 print:hidden">
              <div className="p-4 bg-stone-900 text-white border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Preview Mode (PDF Rendering)
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="hover:text-amber-500 transition-colors"
                >
                  <Icons.Close className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-[#525659] p-4 sm:p-8">
                <PDFViewer width="100%" height="800" className="rounded-lg shadow-2xl border-none">
                  <HocBaDocument data={transcriptData} />
                </PDFViewer>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

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

// Lazy-loaded PDF components - @react-pdf only loads when needed
import {
  LazyPDFViewer as PDFViewer,
  LazyPDFDownloadLink as PDFDownloadLink,
  LazyHocBaDocument as HocBaDocument,
  type TranscriptData,
} from '@/components/pdf/LazyPDF';

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

export default function TranscriptPage({ params }: { params: Promise<{ id: string }> }) {
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
        setStudent(data.student);
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
        setError(data.error || 'Không có dữ liệu học bạ');
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setError('Lỗi khi tải dữ liệu học bạ');
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
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl p-8 border border-stone-200 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
          <div className="flex-1 space-y-6">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-600 dark:text-stone-400 font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all duration-300"
            >
              <Icons.Back className="w-3 h-3" />
              Quay lại hồ sơ
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">
                  Hồ sơ học thuật
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Học bạ chính thức
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <p className="font-serif text-2xl font-black text-stone-800 dark:text-white uppercase">
                  {student.full_name}
                </p>
                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    CID
                  </span>
                  <span className="font-black text-emerald-600 tracking-tight">
                    {student.student_code}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">
                Năm học
              </p>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-transparent font-black text-stone-900 dark:text-white uppercase tracking-tight focus:outline-none cursor-pointer"
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

            <div className="p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">
                Học kỳ
              </p>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-transparent font-black text-stone-900 dark:text-white uppercase tracking-tight focus:outline-none cursor-pointer"
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem.value} value={sem.value} className="text-stone-900">
                    {sem.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* States */}
      {loading && (
        <Card className="p-20 text-center animate-pulse border-none shadow-2xl bg-white dark:bg-stone-900">
          <Icons.Refresh className="w-12 h-12 text-amber-500 mx-auto animate-spin mb-4" />
          <p className="font-serif italic text-stone-500">Đang khởi tạo dữ liệu học bạ...</p>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-12 text-center border-rose-500/20 bg-rose-500/5">
          <Icons.Error className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="font-black text-stone-800 dark:text-white uppercase tracking-widest mb-2">
            Lỗi hệ thống
          </p>
          <p className="text-rose-600 font-serif italic">{error}</p>
        </Card>
      )}

      {/* Content */}
      {transcriptData && !loading && !error && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl border-none">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
                Điểm trung bình
              </p>
              <p className="text-4xl font-serif font-black">{transcriptData.gpa.toFixed(2)}</p>
            </Card>
            <Card className="p-6 bg-emerald-500 shadow-xl border-none text-white">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
                Hạnh kiểm
              </p>
              <p className="text-3xl font-serif font-black uppercase">{transcriptData.conduct}</p>
            </Card>
            <Card className="p-6 bg-stone-900 shadow-xl border-none text-white">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
                Chuyên cần
              </p>
              <p className="text-3xl font-serif font-black">
                {transcriptData.attendance_rate.toFixed(1)}%
              </p>
            </Card>
            <Card className="p-6 bg-white dark:bg-stone-800 shadow-xl border-stone-100 dark:border-white/5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">
                Số môn học
              </p>
              <p className="text-3xl font-serif font-black text-stone-900 dark:text-white">
                {transcriptData.subjects.length}
              </p>
            </Card>
          </div>

          {/* Subjects Grid */}
          <Card className="p-0 overflow-hidden border border-stone-200 dark:border-white/5 shadow-2xl">
            <div className="p-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Chi tiết kết quả
              </h2>
              <Badge
                variant="default"
                className="px-3 py-1 font-black text-[9px] uppercase tracking-widest opacity-50"
              >
                Dữ liệu phân tích
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 dark:bg-stone-900/50">
                  <tr className="uppercase tracking-[0.2em] text-[9px] font-black text-stone-400 border-b border-stone-100 dark:border-white/5">
                    <th className="px-8 py-4">Môn học</th>
                    <th className="px-4 py-4 text-center">Miệng</th>
                    <th className="px-4 py-4 text-center">15 phút</th>
                    <th className="px-4 py-4 text-center">1 tiết</th>
                    <th className="px-4 py-4 text-center">Giữa kỳ</th>
                    <th className="px-4 py-4 text-center">Cuối kỳ</th>
                    <th className="px-8 py-4 text-right">Tổng kết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                  {transcriptData.subjects.map((subject, index) => (
                    <tr
                      key={index}
                      className="group hover:bg-stone-50 dark:hover:bg-amber-500/5 transition-all"
                    >
                      <td className="px-8 py-5">
                        <p className="font-serif font-black text-stone-800 dark:text-white uppercase tracking-tight">
                          {subject.subject_name}
                        </p>
                      </td>
                      <td className="px-4 py-5 text-center font-black text-stone-400 group-hover:text-stone-600 transition-colors">
                        {subject.component_grades?.oral?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-5 text-center font-black text-stone-400 group-hover:text-stone-600 transition-colors">
                        {subject.component_grades?.fifteen_min?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-5 text-center font-black text-stone-400 group-hover:text-stone-600 transition-colors">
                        {subject.component_grades?.one_period?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-5 text-center font-black text-stone-400 group-hover:text-stone-600 transition-colors">
                        {subject.component_grades?.midterm?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-5 text-center font-black text-stone-400 group-hover:text-stone-600 transition-colors">
                        {subject.component_grades?.final?.toFixed(1) || '-'}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Badge className="px-4 py-1.5 font-serif font-black text-lg bg-amber-500 hover:bg-amber-600 border-none">
                          {subject.final_grade.toFixed(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl border border-stone-200 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                <Icons.Save className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
                  Xuất dữ liệu
                </p>
                <p className="font-serif font-black text-stone-900 dark:text-white uppercase">
                  Cung cấp bản sao pháp lý
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 sm:flex-none px-8 py-3 bg-stone-100 dark:bg-white/5 text-stone-900 dark:text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-200 dark:hover:bg-white/10 transition-all shadow-lg"
              >
                {showPreview ? 'Đóng xem trước' : 'Xem trước PDF'}
              </button>

              <PDFDownloadLink
                document={<HocBaDocument data={transcriptData} />}
                fileName={`hoc-ba-${student.student_code}-${selectedSemester}-${selectedYear}.pdf`}
                className="flex-1 sm:flex-none"
              >
                {({ loading }) => (
                  <button
                    disabled={loading}
                    className="w-full px-8 py-3 bg-amber-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Đang chuẩn bị...' : 'Tải học bạ (.PDF)'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>

          {/* PDF Preview */}
          {showPreview && (
            <Card className="p-0 overflow-hidden border-none shadow-2xl bg-stone-100 animate-in zoom-in-95 duration-500">
              <div className="p-4 bg-stone-900 text-white border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Preview Mode (PDF Rendering)
                </span>
                <button
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

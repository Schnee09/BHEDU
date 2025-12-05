'use client';

/**
 * Student Transcript (Học bạ) Page
 * Generates Vietnamese-format student transcripts with selectors
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import dynamic from 'next/dynamic';

// Dynamically import PDF viewer to avoid SSR issues
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

import { HocBaDocument, TranscriptData } from '@/components/pdf/HocBaTemplate';

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
  }, []);

  // Fetch transcript data when selections change
  useEffect(() => {
    if (selectedYear && selectedSemester) {
      fetchTranscriptData();
    }
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (!student) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Quay lại
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Học bạ học sinh</h1>
        <p className="text-gray-600 mt-2">
          {student.full_name} - {student.student_code}
        </p>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Chọn thông tin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Academic Year Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Năm học
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Chọn năm học --</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_current && '(Hiện tại)'}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Học kỳ
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem.value} value={sem.value}>
                  {sem.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Data Preview & Actions */}
      {transcriptData && !loading && !error && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tóm tắt kết quả</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Điểm TB</p>
                <p className="text-2xl font-bold text-blue-600">
                  {transcriptData.gpa.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Hạnh kiểm</p>
                <p className="text-lg font-semibold text-green-600">
                  {transcriptData.conduct}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Chuyên cần</p>
                <p className="text-lg font-semibold text-amber-600">
                  {transcriptData.attendance_rate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Số môn học</p>
                <p className="text-2xl font-bold text-purple-600">
                  {transcriptData.subjects.length}
                </p>
              </div>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Kết quả chi tiết</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Môn học
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Miệng
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      15 phút
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      1 tiết
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Giữa kỳ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Cuối kỳ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      TB môn
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transcriptData.subjects.map((subject, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {subject.subject_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {subject.component_grades?.oral?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {subject.component_grades?.fifteen_min?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {subject.component_grades?.one_period?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {subject.component_grades?.midterm?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {subject.component_grades?.final?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                        {subject.final_grade.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
            >
              {showPreview ? 'Ẩn xem trước' : '👁 Xem trước PDF'}
            </button>
            <PDFDownloadLink
              document={<HocBaDocument data={transcriptData} />}
              fileName={`hoc-ba-${student.student_code}-${selectedSemester}-${selectedYear}.pdf`}
            >
              {({ loading }) => (
                <button
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Đang tạo...' : '📥 Tải xuống PDF'}
                </button>
              )}
            </PDFDownloadLink>
          </div>

          {/* PDF Preview */}
          {showPreview && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Xem trước học bạ</h2>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <PDFViewer width="100%" height="800" showToolbar={true}>
                  <HocBaDocument data={transcriptData} />
                </PDFViewer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

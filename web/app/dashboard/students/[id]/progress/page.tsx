"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";

interface SubjectGrade {
  subject_name: string;
  subject_code: string;
  semester_1_grade: number | null;
  semester_2_grade: number | null;
  final_grade: number | null;
  credits: number;
}

interface SemesterData {
  semester: string;
  academic_year: string;
  gpa: number;
  conduct: string;
  attendance_rate: number;
  subjects: SubjectGrade[];
  rank_in_class?: number;
  total_students?: number;
}

interface StudentProgress {
  student_id: string;
  student_name: string;
  student_code: string;
  class_name: string;
  grade_level: string;
  semesters: SemesterData[];
}

// Enhanced chart color palette
const CHART_COLORS = {
  primary: '#d97706',
  secondary: '#3b82f6',
  success: '#10b981',
  purple: '#8b5cf6',
  pink: '#ec4899',
  grades: ['#10b981', '#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'],
};

export default function StudentProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear] = useState<string>("all");

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id, selectedYear]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const yearParam = selectedYear !== "all" ? `?academic_year=${selectedYear}` : "";
      const res = await apiFetch(`/api/v2/students/${resolvedParams.id}/progress${yearParam}`);
      const data = await res.json();

      if (data.success) {
        setProgress(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch student progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeClassification = (grade: number): { label: string; color: string } => {
    if (grade >= 8) return { label: "Giỏi", color: "text-green-600 bg-green-50" };
    if (grade >= 6.5) return { label: "Khá", color: "text-blue-600 bg-blue-50" };
    if (grade >= 5) return { label: "Trung bình", color: "text-yellow-600 bg-yellow-50" };
    return { label: "Yếu", color: "text-red-600 bg-red-50" };
  };

  const calculateGPATrend = () => {
    if (!progress || progress.semesters.length < 2) return null;

    const gpas = progress.semesters.map(s => s.gpa);
    const trend = gpas[gpas.length - 1] - gpas[0];

    return {
      value: trend,
      direction: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
      percentage: ((Math.abs(trend) / gpas[0]) * 100).toFixed(1)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Không tìm thấy dữ liệu học sinh</p>
        </div>
      </div>
    );
  }

  const trend = calculateGPATrend();

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                ← Quay lại
              </button>
              <button
                onClick={() => router.push(routes.students.transcript(resolvedParams.id))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
              >
                📄 In học bạ
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Theo dõi Tiến độ Học tập</h1>
            <div className="mt-4 space-y-2">
              <p className="text-lg">
                <span className="font-semibold">Học sinh:</span> {progress.student_name}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Mã số:</span> {progress.student_code} |
                <span className="ml-2 font-semibold">Lớp:</span> {progress.class_name} |
                <span className="ml-2 font-semibold">Khối:</span> {progress.grade_level}
              </p>
            </div>
          </div>

          {/* Overall Trend Card */}
          {trend && (
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg p-4 border border-blue-200 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-2">Xu hướng tổng thể</p>
              <div className="flex items-center gap-2">
                <span className={`text-3xl ${trend.direction === "up" ? "text-green-600" :
                  trend.direction === "down" ? "text-red-600" :
                    "text-gray-600"
                  }`}>
                  {trend.direction === "up" ? "↗" : trend.direction === "down" ? "↘" : "→"}
                </span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {trend.value > 0 ? "+" : ""}{trend.value.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">{trend.percentage}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semester Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {progress.semesters.map((semester, index) => {
          const classification = getGradeClassification(semester.gpa);

          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{semester.semester}</h3>
                  <p className="text-sm text-gray-500">{semester.academic_year}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classification.color}`}>
                  {classification.label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Điểm TB:</span>
                  <span className="text-2xl font-bold text-blue-600">{semester.gpa.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hạnh kiểm:</span>
                  <span className="font-semibold text-gray-800">{semester.conduct}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Chuyên cần:</span>
                  <span className="font-semibold text-gray-800">{semester.attendance_rate}%</span>
                </div>

                {semester.rank_in_class && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Xếp hạng:</span>
                    <span className="font-semibold text-gray-800">
                      {semester.rank_in_class}/{semester.total_students}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subject-wise Performance */}
      <div className="bg-white dark:bg-stone-900 rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">Chi tiết Điểm theo Môn học</h2>

        {progress.semesters.map((semester, semIndex) => (
          <div key={semIndex} className="mb-6 sm:mb-8 last:mb-0">
            <h3 className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400 mb-3 sm:mb-4 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
              {semester.semester} - {semester.academic_year}
            </h3>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 mobile-card-list">
              {semester.subjects.map((subject, subIndex) => {
                const finalGrade = subject.final_grade || 0;
                const classification = getGradeClassification(finalGrade);

                return (
                  <div
                    key={subIndex}
                    className="bg-gray-50 dark:bg-stone-800 rounded-xl p-4 border border-gray-200 dark:border-stone-700"
                  >
                    {/* Subject Name & Classification */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {subject.subject_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {subject.subject_code}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${classification.color}`}>
                        {classification.label}
                      </span>
                    </div>

                    {/* Grades Grid */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white dark:bg-stone-900 rounded-lg p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">HK1</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {subject.semester_1_grade !== null ? subject.semester_1_grade.toFixed(1) : '-'}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-stone-900 rounded-lg p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">HK2</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {subject.semester_2_grade !== null ? subject.semester_2_grade.toFixed(1) : '-'}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Cả năm</p>
                        <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {subject.final_grade !== null ? subject.final_grade.toFixed(1) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto table-scroll-container">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-stone-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Môn học</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">HK1</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">HK2</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Cả năm</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
                  {semester.subjects.map((subject, subIndex) => {
                    const finalGrade = subject.final_grade || 0;
                    const classification = getGradeClassification(finalGrade);

                    return (
                      <tr key={subIndex} className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                          {subject.subject_name}
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({subject.subject_code})</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {subject.semester_1_grade !== null ? (
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{subject.semester_1_grade.toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {subject.semester_2_grade !== null ? (
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{subject.semester_2_grade.toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {subject.final_grade !== null ? (
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {subject.final_grade.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classification.color}`}>
                            {classification.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts - Enhanced */}
      <div className="space-y-6">
        {/* GPA Trend with Area Chart - Enhanced */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📈 Xu hướng Điểm Trung Bình (GPA)</h2>
          <p className="text-sm text-gray-500 mb-6">Theo dõi sự tiến bộ qua các học kỳ</p>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={progress.semesters.map((s) => ({
                name: `${s.semester} ${s.academic_year}`,
                gpa: parseFloat(s.gpa.toFixed(2)),
                attendance: s.attendance_rate,
                semester: s.semester
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <defs>
                <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="gpa"
                stroke="#d97706"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#gpaGradient)"
                name="Điểm TB"
                dot={{ fill: '#d97706', r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 10, stroke: '#d97706', strokeWidth: 2, fill: '#fff' }}
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              {/* Reference lines */}
              <Line
                type="monotone"
                dataKey={() => 8}
                stroke="#10b981"
                strokeDasharray="8 4"
                strokeWidth={2}
                name="Giỏi (8.0)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={() => 6.5}
                stroke="#3b82f6"
                strokeDasharray="8 4"
                strokeWidth={2}
                name="Khá (6.5)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Comparison - ComposedChart with Bar + Line */}
        {progress.semesters.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 So sánh Điểm theo Môn học</h2>
            <p className="text-sm text-gray-500 mb-6">Học kỳ gần nhất - So sánh HK1, HK2 và Cả năm</p>
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart
                data={progress.semesters[progress.semesters.length - 1].subjects
                  .filter(s => s.final_grade !== null)
                  .map(s => ({
                    subject: s.subject_name.length > 12 ? s.subject_name.substring(0, 10) + '...' : s.subject_name,
                    'HK1': s.semester_1_grade || 0,
                    'HK2': s.semester_2_grade || 0,
                    'Cả năm': s.final_grade || 0,
                  }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 100 }}
              >
                <defs>
                  <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="HK1"
                  fill="url(#barGradientBlue)"
                  radius={[6, 6, 0, 0]}
                  animationBegin={0}
                  animationDuration={1200}
                />
                <Bar
                  dataKey="HK2"
                  fill="url(#barGradientGreen)"
                  radius={[6, 6, 0, 0]}
                  animationBegin={200}
                  animationDuration={1200}
                />
                <Line
                  type="monotone"
                  dataKey="Cả năm"
                  stroke="#d97706"
                  strokeWidth={3}
                  dot={{ fill: '#d97706', r: 5, stroke: '#fff', strokeWidth: 2 }}
                  animationBegin={400}
                  animationDuration={1200}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Two-column layout for Radar and Pie */}
        {progress.semesters.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Radar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-2">🎯 Phân tích Đa chiều</h2>
              <p className="text-sm text-gray-500 mb-4">Điểm các môn học chính</p>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart
                  data={progress.semesters[progress.semesters.length - 1].subjects
                    .filter(s => s.final_grade !== null)
                    .slice(0, 6)
                    .map(s => ({
                      subject: s.subject_name.length > 10
                        ? s.subject_name.substring(0, 8) + '...'
                        : s.subject_name,
                      grade: s.final_grade || 0,
                      fullMark: 10
                    }))}
                >
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                  />
                  <Radar
                    name="Điểm số"
                    dataKey="grade"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#radarGradient)"
                    fillOpacity={0.7}
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Legend iconType="circle" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                    }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)} điểm`, 'Điểm số']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* NEW: Donut Pie Chart for Performance Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-2">🥧 Phân bố Điểm Môn học</h2>
              <p className="text-sm text-gray-500 mb-4">Tỷ lệ điểm theo xếp loại</p>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <defs>
                    <linearGradient id="pieGreenGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="pieBlueGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="pieYellowGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id="pieRedGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={(() => {
                      const subjects = progress.semesters[progress.semesters.length - 1]?.subjects || [];
                      const gioi = subjects.filter(s => (s.final_grade || 0) >= 8).length;
                      const kha = subjects.filter(s => (s.final_grade || 0) >= 6.5 && (s.final_grade || 0) < 8).length;
                      const tb = subjects.filter(s => (s.final_grade || 0) >= 5 && (s.final_grade || 0) < 6.5).length;
                      const yeu = subjects.filter(s => (s.final_grade || 0) > 0 && (s.final_grade || 0) < 5).length;
                      return [
                        { name: 'Giỏi (≥8)', value: gioi, fill: 'url(#pieGreenGrad)' },
                        { name: 'Khá (6.5-8)', value: kha, fill: 'url(#pieBlueGrad)' },
                        { name: 'TB (5-6.5)', value: tb, fill: 'url(#pieYellowGrad)' },
                        { name: 'Yếu (<5)', value: yeu, fill: 'url(#pieRedGrad)' },
                      ].filter(d => d.value > 0);
                    })()}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {(() => {
                      const subjects = progress.semesters[progress.semesters.length - 1]?.subjects || [];
                      const gioi = subjects.filter(s => (s.final_grade || 0) >= 8).length;
                      const kha = subjects.filter(s => (s.final_grade || 0) >= 6.5 && (s.final_grade || 0) < 8).length;
                      const tb = subjects.filter(s => (s.final_grade || 0) >= 5 && (s.final_grade || 0) < 6.5).length;
                      const yeu = subjects.filter(s => (s.final_grade || 0) > 0 && (s.final_grade || 0) < 5).length;
                      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                      return [gioi, kha, tb, yeu]
                        .map((val, idx) => ({ val, idx }))
                        .filter(d => d.val > 0)
                        .map((d) => (
                          <Cell key={`cell-${d.idx}`} stroke="white" strokeWidth={3} />
                        ));
                    })()}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                    }}
                    formatter={(value: any) => [`${value} môn`, '']}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Attendance & Conduct Trend - Enhanced Area Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📅 Chuyên cần & Điểm TB</h2>
          <p className="text-sm text-gray-500 mb-6">Mối tương quan giữa chuyên cần và kết quả học tập</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={progress.semesters.map((s) => ({
                name: `${s.semester}`,
                'Chuyên cần (%)': s.attendance_rate,
                'GPA': s.gpa * 10 // Scale to fit on same axis
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="gpaGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                }}
                formatter={(value: any, name: any) => [
                  name === 'GPA' ? `${(Number(value) / 10).toFixed(1)}` : `${value}%`,
                  name === 'GPA' ? 'Điểm TB' : name
                ]}
              />
              <Legend wrapperStyle={{ paddingTop: '15px' }} />
              <Area
                type="monotone"
                dataKey="Chuyên cần (%)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#attendanceGradient)"
                dot={{ fill: '#10b981', r: 5, stroke: '#fff', strokeWidth: 2 }}
                animationBegin={0}
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="GPA"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gpaGradient2)"
                dot={{ fill: '#8b5cf6', r: 5, stroke: '#fff', strokeWidth: 2 }}
                animationBegin={300}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

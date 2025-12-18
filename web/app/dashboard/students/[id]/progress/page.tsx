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
  ResponsiveContainer
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
      const res = await apiFetch(`/api/students/${resolvedParams.id}/progress${yearParam}`);
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
                <span className={`text-3xl ${
                  trend.direction === "up" ? "text-green-600" : 
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Chi tiết Điểm theo Môn học</h2>
        
        {progress.semesters.map((semester, semIndex) => (
          <div key={semIndex} className="mb-8 last:mb-0">
            <h3 className="text-xl font-semibold text-blue-600 mb-4 pb-2 border-b-2 border-blue-200">
              {semester.semester} - {semester.academic_year}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Môn học</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">HK1</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">HK2</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Cả năm</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {semester.subjects.map((subject, subIndex) => {
                    const finalGrade = subject.final_grade || 0;
                    const classification = getGradeClassification(finalGrade);
                    
                    return (
                      <tr key={subIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {subject.subject_name}
                          <span className="ml-2 text-xs text-gray-500">({subject.subject_code})</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {subject.semester_1_grade !== null ? (
                            <span className="font-semibold">{subject.semester_1_grade.toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {subject.semester_2_grade !== null ? (
                            <span className="font-semibold">{subject.semester_2_grade.toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {subject.final_grade !== null ? (
                            <span className="text-lg font-bold text-blue-600">
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

      {/* Performance Charts */}
      <div className="space-y-6">
        {/* GPA Trend Line Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Xu hướng Điểm Trung Bình (GPA)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={progress.semesters.map((s) => ({
                name: `${s.semester} ${s.academic_year}`,
                gpa: parseFloat(s.gpa.toFixed(2)),
                semester: s.semester
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="gpa" 
                stroke="#d97706" 
                strokeWidth={3}
                name="Điểm TB"
                dot={{ fill: '#d97706', r: 6 }}
                activeDot={{ r: 8 }}
              />
              {/* Reference lines for classifications */}
              <Line 
                type="monotone" 
                dataKey={() => 8} 
                stroke="#10b981" 
                strokeDasharray="5 5"
                strokeWidth={1}
                name="Giỏi (8.0)"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey={() => 6.5} 
                stroke="#3b82f6" 
                strokeDasharray="5 5"
                strokeWidth={1}
                name="Khá (6.5)"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey={() => 5} 
                stroke="#eab308" 
                strokeDasharray="5 5"
                strokeWidth={1}
                name="TB (5.0)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Comparison Bar Chart */}
        {progress.semesters.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">So sánh Điểm theo Môn học (Học kỳ gần nhất)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={progress.semesters[progress.semesters.length - 1].subjects
                  .filter(s => s.final_grade !== null)
                  .map(s => ({
                    subject: s.subject_name,
                    'Học kỳ 1': s.semester_1_grade || 0,
                    'Học kỳ 2': s.semester_2_grade || 0,
                    'Cả năm': s.final_grade || 0,
                  }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} interval={0} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Học kỳ 1" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Học kỳ 2" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Cả năm" fill="#d97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radar Chart for Multi-dimensional Performance */}
        {progress.semesters.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Phân tích Đa chiều (Radar Chart)</h2>
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart
                data={progress.semesters[progress.semesters.length - 1].subjects
                  .filter(s => s.final_grade !== null)
                  .slice(0, 8) // Limit to 8 subjects for readability
                  .map(s => ({
                    subject: s.subject_name.length > 15 
                      ? s.subject_name.substring(0, 12) + '...' 
                      : s.subject_name,
                    grade: s.final_grade || 0,
                    fullMark: 10
                  }))}
              >
                <PolarGrid stroke="#ddd" />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar 
                  name="Điểm số" 
                  dataKey="grade" 
                  stroke="#d97706" 
                  fill="#d97706" 
                  fillOpacity={0.6}
                />
                <Legend />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Attendance & Conduct Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Chuyên cần & Hạnh kiểm</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={progress.semesters.map((s) => ({
                name: `${s.semester}`,
                'Chuyên cần (%)': s.attendance_rate,
                'GPA': s.gpa
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="Chuyên cần (%)" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 5 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="GPA" 
                stroke="#d97706" 
                strokeWidth={2}
                dot={{ fill: '#d97706', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

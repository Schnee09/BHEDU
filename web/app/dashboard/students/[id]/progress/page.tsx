'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { routes } from '@/lib/routes';
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
  ComposedChart,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';

import { AcademicMatrix } from '@/components/Academic/AcademicMatrix';

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
  student_id: string; // CID
  student_code: string; // UID
  student_name: string;
  class_name: string;
  grade_level: string;
  semesters: SemesterData[];
}

// Enhanced chart color palette
const CHART_COLORS = {
  primary: '#d97706',
  secondary: '#3b82f6',
  success: '#10b981',
  amber: '#f59e0b',
  pink: '#ec4899',
  grades: ['#10b981', '#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'],
};

export default function StudentProgressPageGuarded({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <PageGuard permissions="students.view">
      <StudentProgressPage params={params} />
    </PageGuard>
  );
}

function StudentProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [grades, setGrades] = useState<any[]>([]); // Detailed grades for matrix
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const [progressRes, gradesRes] = await Promise.all([
        apiFetch(`/api/students/${resolvedParams.id}/progress`),
        apiFetch(`/api/grades?student_id=${resolvedParams.id}`),
      ]);

      const progressData = await progressRes.json();
      const gradesData = await gradesRes.json();

      if (progressData.success) {
        setProgress(progressData.data);
      }
      setGrades(gradesData.data || []);
    } catch (error) {
      console.error('Failed to fetch student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeClassification = (grade: number): { label: string; color: string } => {
    if (grade >= 8) return { label: 'Giỏi', color: 'text-green-600 bg-green-50' };
    if (grade >= 6.5) return { label: 'Khá', color: 'text-blue-600 bg-blue-50' };
    if (grade >= 5) return { label: 'Trung bình', color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'Yếu', color: 'text-red-600 bg-red-50' };
  };

  const calculateGPATrend = () => {
    if (!progress || progress.semesters.length < 2) return null;

    const gpas = progress.semesters.map((s) => s.gpa);
    const lastIndex = gpas.length - 1;
    const lastGpa = gpas[lastIndex];
    const firstGpa = gpas[0];

    if (lastGpa === undefined || firstGpa === undefined || firstGpa === 0) return null;

    const trend = lastGpa - firstGpa;

    return {
      value: trend,
      direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      percentage: ((Math.abs(trend) / firstGpa) * 100).toFixed(1),
    };
  };

  const pieChartData = useMemo(() => {
    if (!progress || progress.semesters.length === 0) return [];
    const subjects = progress.semesters[progress.semesters.length - 1]?.subjects || [];
    const gioi = subjects.filter((s) => (s.final_grade || 0) >= 8).length;
    const kha = subjects.filter(
      (s) => (s.final_grade || 0) >= 6.5 && (s.final_grade || 0) < 8
    ).length;
    const tb = subjects.filter(
      (s) => (s.final_grade || 0) >= 5 && (s.final_grade || 0) < 6.5
    ).length;
    const yeu = subjects.filter((s) => (s.final_grade || 0) > 0 && (s.final_grade || 0) < 5).length;
    return [
      { name: 'Giỏi (≥8)', value: gioi, fill: 'url(#pieGreenGrad)' },
      { name: 'Khá (6.5-8)', value: kha, fill: 'url(#pieBlueGrad)' },
      { name: 'TB (5-6.5)', value: tb, fill: 'url(#pieYellowGrad)' },
      { name: 'Yếu (<5)', value: yeu, fill: 'url(#pieRedGrad)' },
    ].filter((d) => d.value > 0);
  }, [progress]);

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
    <div className="p-4 sm:p-8 space-y-8 bg-stone-50 dark:bg-stone-950 min-h-screen animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl p-8 border border-stone-200 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-600 dark:text-stone-400 font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all duration-300"
              >
                <Icons.History className="w-3 h-3" />
                Quay lại
              </button>
              <button
                onClick={() => router.push(routes.students.transcript(resolvedParams.id))}
                className="group flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Icons.Grades className="w-3 h-3" />
                Xem phiếu kết quả
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">
                  Phân tích kết quả
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Tiến độ học tập
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                  <Icons.Students className="w-6 h-6 font-black" />
                </div>
                <div>
                  <Badge
                    variant="success"
                    className="px-3 py-1 font-black text-[9px] uppercase tracking-widest"
                  >
                    Hoàn thành
                  </Badge>
                  <p className="font-serif font-black text-stone-800 dark:text-white uppercase truncate max-w-[200px]">
                    {progress.student_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                  <Icons.Magic className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                    UID (Mã truy cập)
                  </p>
                  <p className="font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                    {progress.student_code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                  <Icons.Users className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                    CID (Mã định danh)
                  </p>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                    {progress.student_id}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Badge
                variant="default"
                className="px-4 py-1.5 border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-[10px]"
              >
                Lớp:{' '}
                <span className="text-stone-900 dark:text-white ml-1">{progress.class_name}</span>
              </Badge>
              <Badge
                variant="default"
                className="px-4 py-1.5 border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-[10px]"
              >
                Khối:{' '}
                <span className="text-stone-900 dark:text-white ml-1">{progress.grade_level}</span>
              </Badge>
            </div>
          </div>

          {/* Overall Trend Card */}
          {trend && (
            <div className="w-full lg:w-72 bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Icons.Progress className="w-24 h-24" />
              </div>

              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-6">
                Xu hướng tổng thể
              </p>

              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl',
                    trend.direction === 'up'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : trend.direction === 'down'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-stone-500/20 text-stone-400'
                  )}
                >
                  {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
                </div>
                <div>
                  <div className="text-4xl font-serif font-black tracking-tighter">
                    {trend.value > 0 ? '+' : ''}
                    {trend.value.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                    {trend.percentage}% Cải thiện
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semester Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progress.semesters.map((semester, index) => {
          const classification = getGradeClassification(semester.gpa);

          return (
            <Card
              key={index}
              className="p-6 border-l-4 border-amber-500 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif font-black text-xl text-stone-900 dark:text-white uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                    {semester.semester}
                  </h3>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                    Năm học {semester.academic_year}
                  </p>
                </div>
                <Badge
                  className={cn(
                    'px-3 py-1 font-black uppercase tracking-widest text-[9px]',
                    classification.color
                  )}
                >
                  {classification.label}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Điểm TB học kỳ
                  </span>
                  <span className="text-2xl font-serif font-black text-amber-600">
                    {semester.gpa.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-100 dark:border-white/5 text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">
                      Hạnh kiểm
                    </p>
                    <p className="font-black text-stone-800 dark:text-white uppercase text-sm">
                      {semester.conduct}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-100 dark:border-white/5 text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">
                      Chuyên cần
                    </p>
                    <p className="font-black text-emerald-600 uppercase text-sm">
                      {semester.attendance_rate}%
                    </p>
                  </div>
                </div>

                {semester.rank_in_class && (
                  <div className="pt-4 border-t border-stone-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      Xếp hạng lớp
                    </span>
                    <span className="font-black text-stone-900 dark:text-white">
                      {semester.rank_in_class}{' '}
                      <span className="text-stone-400 text-xs font-medium">
                        / {semester.total_students}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Subject-wise Performance Table - Now Using AcademicMatrix */}
      <div className="space-y-6">{!loading && <AcademicMatrix grades={grades} />}</div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GPA Trend Chart */}
        <Card className="p-8 shadow-2xl overflow-hidden group">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
              <Icons.TrendUp className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Xu hướng điểm TB (GPA)
              </h2>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                Sự tiến bộ qua các kỳ học
              </p>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progress.semesters.map((s) => ({
                  name: s.semester,
                  gpa: parseFloat(s.gpa.toFixed(2)),
                }))}
              >
                <defs>
                  <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderRadius: '1rem',
                    border: 'none',
                    padding: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{
                    color: '#f59e0b',
                    fontWeight: 900,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                  }}
                  labelStyle={{
                    color: '#a8a29e',
                    fontSize: '10px',
                    fontWeight: 900,
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gpa"
                  stroke="#d97706"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#gpaGradient)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subjects Radar Chart */}
        <Card className="p-8 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
              <Icons.Magic className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Thế mạnh môn học
              </h2>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                Phân tích đa chiều học kỳ cuối
              </p>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={(progress.semesters[progress.semesters.length - 1]?.subjects ?? [])
                  .filter((s) => s.final_grade !== null)
                  .slice(0, 7)
                  .map((s) => ({
                    subject:
                      s.subject_name.length > 8
                        ? s.subject_name.substring(0, 6) + '..'
                        : s.subject_name,
                    grade: s.final_grade,
                  }))}
              >
                <PolarGrid stroke="#e7e5e4" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#78716c', fontSize: 10, fontWeight: 900 }}
                />
                <PolarRadiusAxis domain={[0, 10]} ticks={[0, 5, 10] as any} tick={false} />
                <Radar
                  name="Điểm môn"
                  dataKey="grade"
                  stroke="#d97706"
                  fill="#d97706"
                  fillOpacity={0.6}
                  animationDuration={2500}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Breakdown Chart */}
        <Card className="p-8 lg:col-span-2 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-stone-900/10 dark:bg-white/10 rounded-xl flex items-center justify-center text-stone-900 dark:text-stone-300">
              <Icons.Chart className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Phân bổ điểm theo xếp loại
              </h2>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                Tỉ lệ phần trăm các nhóm điểm
              </p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name.includes('Giỏi')
                          ? '#10b981'
                          : entry.name.includes('Khá')
                            ? '#d97706'
                            : entry.name.includes('TB')
                              ? '#78716c'
                              : '#ef4444'
                      }
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderRadius: '1rem',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '2rem', fontStyle: 'italic' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

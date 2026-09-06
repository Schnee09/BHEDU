'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import {
  AreaChart,
  Area,
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
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';
import { AcademicMatrix } from '@/components/Academic/AcademicMatrix';
import { ArrowLeftIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';

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
  student_uu_id?: string;
  student_id: string; // CID
  student_code: string; // UID
  student_name: string;
  class_name: string;
  grade_level: string;
  semesters: SemesterData[];
}

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
  const [grades, setGrades] = useState<any[]>([]);
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

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        if (progressData.success) {
          setProgress(progressData.data);
        }
      }

      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(gradesData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeClassification = (
    grade: number | null | undefined
  ): { label: string; color: string } => {
    if (grade === null || grade === undefined) {
      return {
        label: 'Chưa xếp loại',
        color: 'text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400',
      };
    }
    if (grade >= 8)
      return { label: 'Giỏi', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' };
    if (grade >= 6.5)
      return { label: 'Khá', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' };
    if (grade >= 5)
      return { label: 'Trung bình', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' };
    return { label: 'Yếu', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' };
  };

  const calculateGPATrend = () => {
    if (!progress || progress.semesters.length < 2) return null;

    const validGpas = progress.semesters
      .map((s) => s.gpa)
      .filter((g): g is number => g !== null && g !== undefined);
    if (validGpas.length < 2) return null;

    const lastGpa = validGpas[validGpas.length - 1];
    const firstGpa = validGpas[0];

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
      { name: 'Giỏi (≥8.0)', value: gioi },
      { name: 'Khá (6.5-7.9)', value: kha },
      { name: 'TB (5.0-6.4)', value: tb },
      { name: 'Yếu (<5.0)', value: yeu },
    ].filter((d) => d.value > 0);
  }, [progress]);

  const radarData = useMemo(() => {
    if (!progress || progress.semesters.length === 0) return [];
    const lastSem = progress.semesters[progress.semesters.length - 1];
    return (lastSem?.subjects ?? [])
      .filter((s) => s.final_grade !== null && s.final_grade > 0)
      .slice(0, 7)
      .map((s) => ({
        subject: s.subject_name.length > 8 ? s.subject_name.substring(0, 7) + '..' : s.subject_name,
        grade: s.final_grade,
      }));
  }, [progress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-amber-500/20 border-t-amber-500 mx-auto" />
          <p className="text-xs font-bold text-stone-400">Đang tải tiến độ học tập...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto">
          <Icons.Warning className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-base text-stone-900 dark:text-white">
            Không tìm thấy dữ liệu
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Không thể nạp hồ sơ tiến độ của học sinh này.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-stone-900 dark:bg-amber-500 text-white rounded-xl text-xs font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const trend = calculateGPATrend();

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen pb-32 sm:pb-12 animate-in fade-in duration-300">
      {/* Navigation Top */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Quay lại hồ sơ</span>
        </button>

        <button
          onClick={() => router.push(routes.students.transcript(resolvedParams.id))}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black shadow-xs cursor-pointer"
        >
          <DocumentChartBarIcon className="w-4 h-4" />
          <span>Xem phiếu điểm</span>
        </button>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                Phân tích học tập
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                {progress.student_name}
              </h1>
              {progress.grade_level && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 uppercase">
                  {progress.grade_level}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                Mã HS: {progress.student_code}
              </span>
              {progress.student_id && (
                <span className="font-mono font-bold text-[11px] text-stone-400">
                  Định danh cá nhân (CCCD): {progress.student_id}
                </span>
              )}
              <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                Lớp: {progress.class_name}
              </span>
            </div>
          </div>

          {/* Overall Trend Card */}
          {trend && (
            <div className="w-full lg:w-64 bg-stone-950 dark:bg-stone-800 rounded-2xl p-4 text-white shadow-sm flex items-center gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0',
                  trend.direction === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : trend.direction === 'down'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-stone-500/20 text-stone-400'
                )}
              >
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                  Xu hướng GPA
                </p>
                <p className="text-xl font-black tabular-nums">
                  {trend.value > 0 ? '+' : ''}
                  {trend.value.toFixed(2)}
                </p>
                <p className="text-[10px] text-stone-400">{trend.percentage}% biến động</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semester Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {progress.semesters.map((semester, index) => {
          const classification = getGradeClassification(semester.gpa);

          return (
            <div
              key={index}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-sm text-stone-900 dark:text-white uppercase tracking-tight">
                    {semester.semester}
                  </h3>
                  <p className="text-[10px] font-bold text-stone-400 mt-0.5">
                    Năm học {semester.academic_year}
                  </p>
                </div>
                <Badge
                  className={cn(
                    'px-2 py-0.5 font-black uppercase text-[9px]',
                    classification.color
                  )}
                >
                  {classification.label}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
                <div className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30 text-center">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">
                    Điểm TB
                  </span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    {semester.gpa !== null && semester.gpa !== undefined
                      ? semester.gpa.toFixed(1)
                      : '—'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 text-center">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">
                    Chuyên cần
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {semester.attendance_rate}%
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 text-center">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">
                    Hạnh kiểm
                  </span>
                  <span className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase">
                    {semester.conduct}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subject-wise Academic Matrix */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs">
        <AcademicMatrix grades={grades} />
      </div>

      {/* Performance Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GPA Trend Chart */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Icons.TrendUp className="w-4 h-4" />
              </span>
              Xu hướng điểm TB (GPA)
            </h2>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Diễn biến điểm số học kỳ theo thời gian
            </p>
          </div>

          {progress.semesters.some((s) => s.gpa !== null && s.gpa !== undefined) ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={progress.semesters
                    .filter((s) => s.gpa !== null && s.gpa !== undefined)
                    .map((s) => ({
                      name: s.semester,
                      gpa: parseFloat((s.gpa as number).toFixed(2)),
                    }))}
                >
                  <defs>
                    <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2.5, 5, 7.5, 10]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderRadius: '0.75rem',
                      border: 'none',
                      padding: '0.5rem 0.75rem',
                    }}
                    itemStyle={{
                      color: '#f59e0b',
                      fontWeight: 800,
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gpa"
                    stroke="#d97706"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gpaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400">
                <Icons.TrendUp className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-500">
                Chưa có dữ liệu điểm trung bình để vẽ biểu đồ
              </p>
            </div>
          )}
        </div>

        {/* Subjects Radar Chart */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Icons.Magic className="w-4 h-4" />
              </span>
              Thế mạnh môn học
            </h2>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Phân bố năng lực các môn trong kỳ gần nhất
            </p>
          </div>

          <div className="h-[280px]">
            {radarData.length >= 3 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e7e5e4" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#78716c', fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} />
                  <Radar
                    name="Điểm môn"
                    dataKey="grade"
                    stroke="#d97706"
                    fill="#d97706"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400">
                  <Icons.Grades className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-stone-500">
                  Cần tối thiểu 3 môn có điểm để vẽ biểu đồ năng lực
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Grade Distribution Pie Chart */}
        {pieChartData.length > 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <Icons.Chart className="w-4 h-4" />
                </span>
                Phân bổ xếp loại môn học
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Tỷ lệ các nhóm điểm Giỏi, Khá, Trung bình, Yếu
              </p>
            </div>

            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="value"
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
                                ? '#64748b'
                                : '#ef4444'
                        }
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderRadius: '0.75rem',
                      border: 'none',
                    }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

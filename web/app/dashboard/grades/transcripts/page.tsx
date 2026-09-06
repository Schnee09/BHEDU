'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfile } from '@/hooks/useProfile';
import {
  GraduationCap,
  TrendingUp,
  Award,
  Users,
  BookOpen,
  RefreshCw,
  ArrowLeft,
  FileText,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { AcademicMatrix } from '@/components/Academic/AcademicMatrix';

export default function TranscriptsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const { isStudent, loading: permsLoading } = usePermissions();

  // State
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // 1. Initial Load: Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await apiFetch('/api/classes?limit=100');
        const data = await response.json();
        setClasses(data.data || []);
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };
    if (!permsLoading) loadClasses();
  }, [permsLoading]);

  // 2. Load Students when Class changes
  useEffect(() => {
    const loadStudentsInClass = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      try {
        const response = await apiFetch(`/api/classes/${selectedClass}/students`);
        const data = await response.json();
        setStudents(data.students || data.data || []);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    loadStudentsInClass();
  }, [selectedClass]);

  // 3. Load Grades when Student changes
  useEffect(() => {
    const loadGrades = async () => {
      if (!selectedStudent) {
        setGrades([]);
        return;
      }
      setLoading(true);
      try {
        // Fetch full history (no class_id filter to see all years)
        const response = await apiFetch(`/api/grades?student_id=${selectedStudent}`);
        const data = await response.json();
        setGrades(data.data || []);
      } catch (error) {
        console.error('Failed to load grades:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGrades();
  }, [selectedStudent]);

  // Handle URL Parameters & Student auto-select
  useEffect(() => {
    if (!permsLoading) {
      const qStudentId = searchParams.get('student_id');
      const qClassId = searchParams.get('class_id');
      if (qClassId) setSelectedClass(qClassId);
      if (qStudentId) setSelectedStudent(qStudentId);

      // Student Role Auto-selection
      if (isStudent && profile?.id) {
        setSelectedStudent(profile.id);
      }
    }
  }, [searchParams, permsLoading, isStudent, profile?.id]);

  // Stats Calculations
  const averageScore = useMemo(() => {
    if (grades.length === 0) return 0;
    const scores = grades
      .map((g) => g.score ?? g.points_earned)
      .filter((s) => typeof s === 'number');
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [grades]);

  const maxScore = useMemo(() => {
    if (grades.length === 0) return 0;
    const scores = grades
      .map((g) => g.score ?? g.points_earned)
      .filter((s) => typeof s === 'number');
    return Math.max(...scores, 0);
  }, [grades]);

  if (permsLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full shadow-lg" />
      </div>
    );
  }

  const currentStudentObj = selectedStudent
    ? students.find((s) => s.id === selectedStudent) ||
      (isStudent && profile
        ? { full_name: profile.full_name, student_code: (profile as any).student_code || 'BH-ID' }
        : null)
    : isStudent && profile
      ? { full_name: profile.full_name, student_code: (profile as any).student_code || 'BH-ID' }
      : null;

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-6 px-3 sm:px-6 lg:px-8 pb-28 md:pb-16 font-Be_Vietnam_Pro">
      <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* ── HEADER CARD ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => router.push('/dashboard/grades')}
                className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-stone-600 dark:text-stone-300 transition-all cursor-pointer shrink-0"
                title="Quay lại danh mục Điểm số"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold text-stone-900 dark:text-white leading-tight">
                    Phiếu kết quả học tập
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                    Hệ thống tra cứu bảng điểm học tập (GK 50% & CK 50%)
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Official PDF Link */}
            {selectedStudent && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Link
                  href={`/dashboard/students/${selectedStudent}/transcript`}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer w-full sm:w-auto"
                >
                  <FileText className="w-4 h-4" />
                  <span>Xem học bạ & Xuất PDF</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </Link>
              </div>
            )}
          </div>

          {/* KPI Summary Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-stone-100 dark:border-white/5 text-xs font-medium no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {currentStudentObj ? (
              <>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Học sinh:{' '}
                    <strong className="font-semibold">{currentStudentObj.full_name}</strong>
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0 border border-stone-200/40 dark:border-white/5 whitespace-nowrap">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  <span>
                    Tổng bản ghi điểm:{' '}
                    <strong className="font-mono font-semibold text-stone-900 dark:text-white">
                      {grades.length}
                    </strong>
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Điểm TB (GPA):{' '}
                    <strong className="font-mono font-bold text-emerald-900 dark:text-emerald-100">
                      {averageScore > 0 ? averageScore.toFixed(2) : '-'}
                    </strong>
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Điểm cao nhất:{' '}
                    <strong className="font-mono font-bold text-blue-900 dark:text-blue-100">
                      {maxScore > 0 ? maxScore.toFixed(1) : '-'}
                    </strong>
                  </span>
                </div>
              </>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center gap-1.5 shrink-0">
                <Users className="w-3.5 h-3.5 text-stone-500" />
                <span>Trạng thái: Vui lòng chọn lớp học và học sinh để xem kết quả</span>
              </div>
            )}
          </div>
        </div>

        {/* ── SELECTION INTERFACE (FOR TEACHER / ADMIN) ── */}
        {!isStudent && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-5 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 ml-0.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" /> 1. Chọn lớp học
                </label>
                <Select
                  value={selectedClass}
                  onChange={(e: any) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent('');
                    setGrades([]);
                  }}
                  className="h-10 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl text-xs sm:text-sm font-medium"
                >
                  <option value="">-- Chọn lớp học để xem danh sách --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Student Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 ml-0.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" /> 2. Chọn học sinh
                </label>
                <Select
                  value={selectedStudent}
                  onChange={(e: any) => setSelectedStudent(e.target.value)}
                  disabled={!selectedClass}
                  className="h-10 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl text-xs sm:text-sm font-medium disabled:opacity-50"
                >
                  <option value="">
                    {!selectedClass
                      ? '-- Vui lòng chọn lớp học trước --'
                      : '-- Chọn học sinh trong lớp --'}
                  </option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.name}{' '}
                      {student.student_code ? `(${student.student_code})` : ''}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ── ACADEMIC MATRIX RESULTS SECTION ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              Bảng điểm chi tiết (GK 50% & CK 50%)
            </h2>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>Đang tải...</span>
              </div>
            )}
          </div>

          {!selectedStudent && !isStudent ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-dashed border-stone-200 dark:border-white/10 p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white">
                  Vui lòng chọn Lớp học và Học sinh
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Chọn lớp học và học sinh ở bảng điều khiển phía trên để tra cứu bảng điểm và xuất
                  phiếu kết quả học tập.
                </p>
              </div>
            </div>
          ) : (
            <AcademicMatrix
              grades={grades}
              emptyMessage={
                isStudent
                  ? 'Bạn chưa có bản ghi điểm nào trong hệ thống.'
                  : 'Học sinh này chưa có bản ghi điểm nào.'
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

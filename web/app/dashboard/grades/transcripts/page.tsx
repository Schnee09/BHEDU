'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/select';
import { Icons } from '@/components/ui/Icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import {
  GraduationCap,
  Award,
  TrendingUp,
  Printer,
  BookOpen,
  ChevronRight,
  Star,
} from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface GradeRecord {
  id: string;
  score: number;
  component_type: string;
  semester: number;
  graded_at: string;
  notes?: string;
}

export default function TranscriptsPage() {
  const { isStudent, loading: permsLoading } = usePermissions();
  const { profile } = useProfile();

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Initial load
  useEffect(() => {
    if (!permsLoading) {
      loadClasses();
      if (isStudent && profile?.id) {
        setSelectedStudent(profile.id);
      }
    }
  }, [permsLoading, isStudent, profile?.id]);

  // Load students when class changes (admin/teacher only)
  useEffect(() => {
    if (selectedClass && !isStudent) {
      loadStudentsInClass();
    } else if (!selectedClass) {
      setStudents([]);
      if (!isStudent) setGrades([]);
    }
  }, [selectedClass, isStudent]);

  // Load grades when selection complete
  useEffect(() => {
    if (selectedStudent && selectedClass) {
      loadGrades();
    }
  }, [selectedStudent, selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await apiFetch('/api/classes/my-classes');
      if (response.ok) {
        const data = await response.json();
        const classList = data.classes || data.data || [];
        setClasses(classList);
        // If student and only one class, auto-select it
        if (isStudent && classList.length > 0 && !selectedClass) {
          setSelectedClass(classList[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadStudentsInClass = async () => {
    try {
      setLoadingStudents(true);
      const response = await apiFetch(`/api/classes/${selectedClass}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || data.data || []);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(
        `/api/grades?studentId=${selectedStudent}&classId=${selectedClass}`
      );
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || data.data || []);
      }
    } catch (error) {
      console.error('Failed to load grades:', error);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const getGradeColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 6.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getGradeLabel = (score: number) => {
    if (score >= 8) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    if (score >= 5) return 'Trung bình';
    return 'Yếu';
  };

  const averageScore = useMemo(
    () => (grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0),
    [grades]
  );

  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const selectedStudentData = isStudent ? profile : students.find((s) => s.id === selectedStudent);

  if (permsLoading) return null;

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
              <GraduationCap className="w-3.5 h-3.5" />
              Học thuật
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight uppercase">
              {isStudent ? 'Bảng Điểm Cá Nhân' : 'Hồ Sơ Điểm Số'}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">
              {isStudent
                ? 'Chi tiết kết quả học tập và đánh giá năng lực của bạn.'
                : 'Tra cứu và phân tích bảng điểm chi tiết của từng học sinh theo lớp.'}
            </p>
          </div>

          {grades.length > 0 && (
            <Button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 rounded-2xl h-12 px-6 print:hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              In kết quả
            </Button>
          )}
        </div>

        {/* Selection Panel */}
        <Card className="border-none shadow-2xl shadow-stone-200/50 dark:shadow-none bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-[2rem] overflow-visible print:hidden">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  Môn học / Lớp
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <Select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      if (!isStudent) {
                        setSelectedStudent('');
                        setGrades([]);
                      }
                    }}
                    className="pl-11 h-12 bg-stone-100/50 dark:bg-stone-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  >
                    <option value="">Chọn lớp học...</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {!isStudent && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                    Học sinh
                  </label>
                  <Select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={!selectedClass || loadingStudents}
                    className="h-12 bg-stone-100/50 dark:bg-stone-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="">
                      {loadingStudents ? 'Đang tải danh sách...' : 'Chọn học sinh...'}
                    </option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} ({student.student_id})
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">
              Đang truy xuất bảng điểm...
            </p>
          </div>
        ) : !selectedStudent || !selectedClass ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
              <Icons.Grades className="w-10 h-10 text-stone-300" />
            </div>
            <div className="text-center">
              <h3 className="text-stone-900 dark:text-white font-black uppercase tracking-tight">
                Vui lòng chọn thông tin
              </h3>
              <p className="text-stone-400 text-sm font-medium mt-1">
                Chọn lớp học để xem chi tiết kết quả học tập.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Status Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] opacity-20 blur-2xl" />
              <Card className="border-none shadow-2xl bg-indigo-600 dark:bg-indigo-900 rounded-[2rem] overflow-hidden text-white relative">
                <CardBody className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black">
                        {selectedStudentData?.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight">
                          {selectedStudentData?.full_name}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-white/70 font-bold uppercase tracking-widest text-xs">
                          <span>
                            Mã HS:{' '}
                            {(selectedStudentData as any)?.student_id ||
                              (selectedStudentData as any)?.username ||
                              '-'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-white/30" />
                          <span>Lớp: {selectedClassData?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 flex items-center gap-8 border border-white/10">
                      <div className="text-center space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
                          Trung bình
                        </div>
                        <div className="text-4xl font-black">
                          {averageScore > 0 ? averageScore.toFixed(1) : '-'}
                        </div>
                      </div>
                      <div className="w-px h-12 bg-white/10" />
                      <div className="text-center space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
                          Xếp loại
                        </div>
                        <div className="text-xl font-black uppercase tracking-tight">
                          {averageScore > 0 ? getGradeLabel(averageScore) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Analytic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  label: 'Số đầu điểm',
                  value: grades.length,
                  icon: TrendingUp,
                  color: 'text-blue-500',
                  bg: 'bg-blue-500/10',
                },
                {
                  label: 'Điểm cao nhất',
                  value:
                    grades.length > 0 ? Math.max(...grades.map((g) => g.score)).toFixed(1) : '-',
                  icon: Award,
                  color: 'text-amber-500',
                  bg: 'bg-amber-500/10',
                },
                {
                  label: 'Tiến độ học',
                  value: '100%',
                  icon: Star,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-500/10',
                },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="border-none shadow-xl shadow-stone-200/50 dark:shadow-none bg-white dark:bg-stone-900 rounded-3xl"
                >
                  <CardBody className="p-6 flex items-center gap-5">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center',
                        stat.bg
                      )}
                    >
                      <stat.icon className={cn('w-6 h-6', stat.color)} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                        {stat.value}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                        {stat.label}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Grades Table */}
            <Card className="border-none shadow-2xl shadow-stone-200/50 dark:shadow-none bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden relative">
              <CardBody className="p-0">
                <div className="p-8 border-b border-stone-100 dark:border-stone-800">
                  <h3 className="text-base font-black uppercase tracking-widest text-stone-900 dark:text-white flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                    Chi tiết điểm số
                  </h3>
                </div>

                {grades.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-stone-400">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      Chưa có bản ghi điểm nào cho môn học này
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50/50 dark:bg-stone-800/50">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                            STT
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                            Hình thức đánh giá
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">
                            Điểm số
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                            Ngày ghi nhận
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                            Ghi chú
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {grades.map((grade, index) => (
                          <tr
                            key={grade.id}
                            className="group/row hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                          >
                            <td className="px-8 py-6 text-stone-400 font-bold text-xs">
                              {(index + 1).toString().padStart(2, '0')}
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500">
                                  <Icons.Grades className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-black text-stone-900 dark:text-white tracking-tight uppercase">
                                  {grade.component_type || 'Kiểm tra thường xuyên'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div
                                className={cn(
                                  'inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 font-black text-lg transition-transform group-hover/row:scale-110',
                                  getGradeColor(grade.score)
                                )}
                              >
                                {grade.score.toFixed(1)}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                                {grade.graded_at
                                  ? new Date(grade.graded_at).toLocaleDateString('vi-VN')
                                  : '-'}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-xs font-medium text-stone-400 italic max-w-xs truncate">
                                {grade.notes || 'Không có ghi chú'}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { GraduationCap, Search, TrendingUp, Award, Star, Users, BookOpen, RefreshCw } from 'lucide-react';
import { AcademicMatrix } from '@/components/Academic/AcademicMatrix';

export default function TranscriptsPage() {
  const searchParams = useSearchParams();
  const { isAdmin, isStudent, isParent, profile, loading: permsLoading } = usePermissions();
  
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

  // Handle URL Parameters
  useEffect(() => {
    if (!permsLoading) {
      const qStudentId = searchParams.get('student_id');
      const qClassId = searchParams.get('class_id');
      if (qClassId) setSelectedClass(qClassId);
      if (qStudentId) setSelectedStudent(qStudentId);

      // Student/Parent Role Auto-selection
      if (isStudent && profile?.id) {
        setSelectedStudent(profile.id);
      }
    }
  }, [searchParams, permsLoading, isStudent, profile?.id]);

  // Stats Calculations
  const averageScore = useMemo(() => {
    if (grades.length === 0) return 0;
    const scores = grades.map(g => g.score ?? g.points_earned).filter(s => typeof s === 'number');
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [grades]);

  const maxScore = useMemo(() => {
    if (grades.length === 0) return 0;
    const scores = grades.map(g => g.score ?? g.points_earned).filter(s => typeof s === 'number');
    return Math.max(...scores, 0);
  }, [grades]);

  if (permsLoading) return null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-6 lg:px-12">
      <div className="max-w-[1100px] mx-auto space-y-10 relative">
        
        {/* Simplified Top Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-500" />
              Học bạ điện tử
            </h1>
            {selectedStudent && (
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-sm font-black text-stone-600 dark:text-stone-300 uppercase tracking-tighter">
                   {students.find(s => s.id === selectedStudent)?.full_name || profile?.full_name || 'Học sinh đang chọn'}
                 </p>
              </div>
            )}
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 mt-1">
              Hệ thống quản lý kết quả học tập tập trung
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 overflow-hidden">
               {/* Quick stats badges */}
               <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  Điểm TB: {averageScore > 0 ? averageScore.toFixed(1) : '-'}
               </div>
               <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                  <Award className="w-3 h-3" />
                  Max: {maxScore > 0 ? maxScore.toFixed(1) : '-'}
               </div>
            </div>
          </div>
        </div>

        {/* Selection Interface - "Grades Entry" Style */}
        <Card className="border-none shadow-ultra bg-white dark:bg-stone-900 rounded-[2.5rem] overflow-visible print:hidden">
          <CardBody className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 px-1">
                  1. Chọn lớp học
                </label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
                  <Select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudent('');
                      setGrades([]);
                    }}
                    className="pl-12 h-14 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-stone-700 dark:text-stone-200"
                  >
                    <option value="">Chọn lớp để xem danh sách...</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 px-1">
                  2. Chọn học sinh
                </label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={!selectedClass && !isStudent}
                    className="pl-12 h-14 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-stone-700 dark:text-stone-200 disabled:opacity-50"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name || student.name || student.student_code}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Global Academic Matrix Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black uppercase tracking-widest text-stone-800 dark:text-white flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  Kết quả học tập chi tiết
              </h2>
              {loading && <RefreshCw className="w-5 h-5 text-stone-300 animate-spin" />}
           </div>

           <AcademicMatrix grades={grades} />
        </div>

      </div>
    </div>
  );
}

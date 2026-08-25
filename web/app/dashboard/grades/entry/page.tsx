'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  apiFetch,
  getClasses,
  getClassStudents,
  getGrades,
  bulkCreateGrades,
} from '@/lib/api/client';
import { useToast } from '@/hooks';
import {
  EvaluationType,
  GradeRow,
  Semester,
  calculateAverageGrade,
  GRADE_LABELS,
} from '@/lib/grades/types';
import { validateGrade } from '@/lib/grades/validation';
import PageGuard from '@/components/PageGuard';
import BulkGradeImport from '@/components/grades/BulkGradeImport';
import { Icons } from '@/components/ui/Icons';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// Types
interface Student {
  id: string;
  name?: string;
  full_name?: string;
}

interface ClassOption {
  id: string;
  name: string;
  subject_id?: string;
  subject_code?: string;
}

interface GradeError {
  field: string;
  message: string;
}

// Main component
export default function GradeEntryPage() {
  return (
    <PageGuard permissions="grades.entry">
      <GradeEntryPageContent />
    </PageGuard>
  );
}

function GradeEntryPageContent() {
  const toast = useToast();

  // State - Classes
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // State - Semester
  const [selectedSemester, setSelectedSemester] = useState<Semester>('1');

  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, Partial<GradeRow>>>({});
  const [errors, setErrors] = useState<Record<string, GradeError[]>>({});
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<string>('');

  // State - UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<
    { name: string; midterm: number | null; final: number | null }[]
  >([]);

  // Helper: Handle grade input change
  const handleGradeChange = React.useCallback(
    (studentId: string, field: EvaluationType, value: string) => {
      const numValue = value === '' ? null : Number(value);

      // Update grade and calculate average
      setGrades((prev) => {
        const studentGrades = { ...prev[studentId], [field]: numValue };
        const average = calculateAverageGrade(
          studentGrades[EvaluationType.MIDTERM],
          studentGrades[EvaluationType.FINAL]
        );
        return {
          ...prev,
          [studentId]: { ...studentGrades, average },
        };
      });

      // Validate and update errors
      const validation = validateGrade(numValue);
      setErrors((prev) => {
        const studentErrors = prev[studentId] || [];
        if (validation.valid) {
          return {
            ...prev,
            [studentId]: studentErrors.filter((e) => e.field !== field),
          };
        } else {
          const filtered = studentErrors.filter((e) => e.field !== field);
          return {
            ...prev,
            [studentId]: [...filtered, { field, message: validation.error || 'Invalid' }],
          };
        }
      });
    },
    []
  );

  // Load initial data (classes)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading initial data (classes, semesters, academic years)...');
        const [classesRes, semestersRes, ayRes] = await Promise.all([
          getClasses({ limit: 100 }),
          apiFetch('/api/semesters').then((res) => res.json()),
          apiFetch('/api/admin/academic-years').then((res) => res.json()),
        ]);

        const classList = (classesRes.data || []) as ClassOption[];
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0]?.id ?? '');
        }

        const semesterList = semestersRes.data || semestersRes.semesters || [];
        setSemesters(semesterList);

        const ayList = ayRes.data || ayRes.academic_years || [];
        const currentYear = ayList.find((y: any) => y.is_active || y.is_current);
        if (currentYear) setCurrentAcademicYearId(currentYear.id);

        const activeSemester = semesterList.find((s: any) => s.is_active);
        if (activeSemester) {
          setSelectedSemester(activeSemester.code as Semester);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
        toast.error('Không thể tải các thông tin cơ bản');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load subjects when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setClassSubjects([]);
      setSelectedSubjectId(null);
      return;
    }

    const loadSubjects = async () => {
      try {
        const res = await apiFetch(`/api/classes/${selectedClassId}/subjects`).then((r) =>
          r.json()
        );
        const subjects = res.data?.subjects || [];
        setClassSubjects(subjects);
        if (subjects.length > 0) {
          // If previous subject exists in new list, keep it, otherwise take first
          if (!subjects.some((s: any) => s.id === selectedSubjectId)) {
            setSelectedSubjectId(subjects[0].id);
          }
        } else {
          setSelectedSubjectId(null);
        }
      } catch (err) {
        console.error('Failed to load subjects', err);
      }
    };

    loadSubjects();
  }, [selectedClassId]);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setGrades({});
      setErrors({});
      return;
    }

    const loadStudents = async () => {
      setLoading(true);
      try {
        console.log(`🔄 Loading students for class ${selectedClassId}...`);

        // Fetch students and grades in parallel
        const [studentsData, gradesRes] = await Promise.all([
          getClassStudents(selectedClassId),
          selectedSubjectId
            ? getGrades({
                class_id: selectedClassId,
                subject_id: selectedSubjectId,
                semester: selectedSemester,
                limit: 1000,
              })
            : Promise.resolve({ data: [] }),
        ]);

        // Students might be raw array (from my client.ts)
        const studentList = studentsData
          .map((s: any) => ({
            id: s.student_id || s.id, // Support both student_id and id
            name: s.full_name || s.name,
            full_name: s.full_name || s.name,
          }))
          .filter((s) => s.id && typeof s.id === 'string'); // Ensure we have a valid ID
        setStudents(studentList);

        // Map grades
        const fetchedGrades = gradesRes.data || [];
        const initialGrades: Record<string, Partial<GradeRow>> = {};

        studentList.forEach((s: Student) => {
          const studentGradesList = fetchedGrades.filter((g: any) => g.student_id === s.id);

          const midtermGrade = studentGradesList.find(
            (g: any) => g.component_type === EvaluationType.MIDTERM
          );
          const finalGrade = studentGradesList.find(
            (g: any) => g.component_type === EvaluationType.FINAL
          );

          if (midtermGrade || finalGrade) {
            const mScore = midtermGrade?.score ?? null;
            const fScore = finalGrade?.score ?? null;

            initialGrades[s.id] = {
              [EvaluationType.MIDTERM]: mScore,
              [EvaluationType.FINAL]: fScore,
              average: calculateAverageGrade(mScore, fScore),
            };
          }
        });

        setGrades(initialGrades);
        setErrors({});
      } catch (error) {
        console.error('❌ Students error:', error);
        toast.error('Không thể tải danh sách học sinh');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedSemester, selectedSubjectId]);

  // Handle save
  const handleSave = async () => {
    setShowConfirm(false);
    setSaving(true);

    try {
      console.log('📤 Saving grades...');
      const subjectId = selectedSubjectId;

      if (!subjectId) {
        toast.error('Vui lòng chọn môn học');
        return;
      }

      // We need to save Midterm and Final separately as they are different components
      const components = [EvaluationType.MIDTERM, EvaluationType.FINAL];
      let successCount = 0;

      for (const component of components) {
        const gradesToSave = students
          .map((student) => ({
            student_id: student.id,
            score: grades[student.id]?.[component] ?? null,
            notes: null,
          }))
          .filter(
            (g) =>
              g.student_id && // Must have a student ID
              g.score !== null &&
              g.score !== undefined // Only save if score exists
          );

        if (gradesToSave.length > 0) {
          await bulkCreateGrades({
            class_id: selectedClassId,
            subject_id: subjectId,
            component_type: component,
            semester: selectedSemester,
            academic_year_id: currentAcademicYearId,
            grades: gradesToSave,
          });
          successCount += gradesToSave.length;
        }
      }

      if (successCount > 0) {
        toast.success(`Đã lưu điểm thành công`);
      } else {
        toast.info('Không có thay đổi nào để lưu');
      }
    } catch (err: any) {
      console.error('❌ Save failed:', err);
      toast.error(err.message || 'Không thể lưu điểm');
    } finally {
      setSaving(false);
    }
  };

  const hasGrades =
    students.length > 0 &&
    Object.values(grades).some(
      (g) =>
        (g[EvaluationType.MIDTERM] !== null && g[EvaluationType.MIDTERM] !== undefined) ||
        (g[EvaluationType.FINAL] !== null && g[EvaluationType.FINAL] !== undefined)
    );

  const hasErrors = Object.values(errors).some((e) => e.length > 0);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Download CSV template
  const downloadTemplate = () => {
    const headers = 'Họ tên,Điểm giữa kỳ,Điểm cuối kỳ';
    const sampleRows = students
      .map(
        (s) =>
          `"${s.full_name || s.name || ''}",${grades[s.id]?.[EvaluationType.MIDTERM] ?? ''},${grades[s.id]?.[EvaluationType.FINAL] ?? ''}`
      )
      .join('\n');

    const csvContent = `${headers}\n${sampleRows}`;
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diem_${selectedClass?.name || 'lop'}_hk${selectedSemester}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportPreview([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          setImportError('File phải có ít nhất 1 dòng dữ liệu');
          return;
        }

        // Skip header row
        const dataRows = lines.slice(1);
        const preview: { name: string; midterm: number | null; final: number | null }[] = [];
        const newGrades = { ...grades };

        for (const row of dataRows) {
          // Parse CSV row (handle quoted values)
          const values =
            row.match(/("[^"]*"|[^,]+)/g)?.map((v) => v.replace(/^"|"$/g, '').trim()) || [];
          if (values.length < 1) continue;

          const name = values[0];
          const midterm = values[1] ? parseFloat(values[1]) : null;
          const final = values[2] ? parseFloat(values[2]) : null;

          // Find matching student
          const student = students.find(
            (s) => (s.full_name || s.name || '').toLowerCase() === (name?.toLowerCase() ?? '')
          );

          if (student) {
            const studentGrades: Partial<GradeRow> = {};
            if (midterm !== null && !isNaN(midterm) && midterm >= 0 && midterm <= 10) {
              studentGrades[EvaluationType.MIDTERM] = midterm;
            }
            if (final !== null && !isNaN(final) && final >= 0 && final <= 10) {
              studentGrades[EvaluationType.FINAL] = final;
            }
            studentGrades.average = calculateAverageGrade(
              studentGrades[EvaluationType.MIDTERM] ?? grades[student.id]?.[EvaluationType.MIDTERM],
              studentGrades[EvaluationType.FINAL] ?? grades[student.id]?.[EvaluationType.FINAL]
            );
            newGrades[student.id] = { ...grades[student.id], ...studentGrades };
          }

          preview.push({ name: name ?? '', midterm, final });
        }

        setImportPreview(preview);
        setGrades(newGrades);
        toast.success(`Đã import ${preview.length} dòng dữ liệu`);
        setShowImportModal(false);
      } catch (err) {
        console.error('Import error:', err);
        setImportError('Không thể đọc file. Vui lòng kiểm tra định dạng CSV.');
      }
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">
              Theo dõi điểm số (GK & CK)
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Ghi nhận kết quả điểm Giữa kỳ (GK) và Cuối kỳ (CK) tại trường phổ thông
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="rounded-xl h-8 px-2.5 text-xs font-bold border-stone-200 dark:border-white/10"
              leftIcon={<Icons.Download className="w-3.5 h-3.5" />}
            >
              Xuất CSV
            </Button>
            <label className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs text-xs">
              <Icons.Upload className="w-3.5 h-3.5" />
              Import CSV
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExcelImport(true)}
              className="rounded-xl h-8 px-2.5 text-xs font-bold border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5"
              leftIcon={<Icons.Chart className="w-3.5 h-3.5" />}
            >
              Import Excel
            </Button>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-0.5">
                Lớp học
              </label>
              <Select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(e.target.value || null)}
                className="h-9 rounded-xl border-stone-200 dark:border-white/10 text-xs font-semibold"
              >
                <option value="">Chọn lớp...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-0.5">
                Học kỳ
              </label>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as Semester)}
                className="h-9 rounded-xl border-stone-200 dark:border-white/10 text-xs font-semibold"
              >
                {semesters.length > 0 ? (
                  semesters.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} {s.is_active ? '(Hiện tại)' : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Học kỳ 1</option>
                    <option value="2">Học kỳ 2</option>
                  </>
                )}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-0.5">
                Môn học
              </label>
              <Select
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(e.target.value || null)}
                disabled={classSubjects.length === 0}
                className="h-9 rounded-xl border-stone-200 dark:border-white/10 text-xs font-semibold"
              >
                <option value="">Chọn môn học...</option>
                {classSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Grades Table & Mobile Touch Cards */}
        {loading ? (
          <div className="text-center py-12 text-stone-400 text-xs font-bold animate-pulse">
            Đang tải danh sách học sinh...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-white/10">
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">
              Chọn lớp để xem danh sách học sinh
            </p>
          </div>
        ) : (
          <>
            {/* Status & Error notification bar */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="text-xs text-stone-500 font-medium">
                Đang hiển thị{' '}
                <strong className="text-stone-900 dark:text-white font-bold">
                  {students.length}
                </strong>{' '}
                học sinh — Lớp{' '}
                <span className="text-amber-600 font-bold">{selectedClass?.name}</span>
              </div>
              {hasErrors && (
                <div className="text-[11px] bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 font-bold flex items-center gap-1.5">
                  <Icons.Error className="w-3.5 h-3.5" />
                  {Object.values(errors).reduce((acc, e) => acc + e.length, 0)} lỗi nhập liệu
                </div>
              )}
            </div>

            {/* 1. MOBILE TOUCH CARDS VIEW (< md) */}
            <div className="md:hidden space-y-2.5">
              {students.map((student, idx) => {
                const studentGrades = grades[student.id] || {};
                const studentErrors = errors[student.id] || [];
                const midtermError = studentErrors.find(
                  (e) => e.field === EvaluationType.MIDTERM
                )?.message;
                const finalError = studentErrors.find(
                  (e) => e.field === EvaluationType.FINAL
                )?.message;

                return (
                  <div
                    key={student.id}
                    className={cn(
                      'bg-white dark:bg-stone-900 p-3 rounded-2xl border transition-all shadow-xs space-y-2.5',
                      studentErrors.length > 0
                        ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                        : 'border-stone-200/80 dark:border-white/10'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center text-[11px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-stone-900 dark:text-white truncate">
                          {student.full_name || student.name || '—'}
                        </span>
                      </div>

                      {/* Average badge */}
                      <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-bold text-stone-400 uppercase">ĐTB:</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {studentGrades.average !== null && studentGrades.average !== undefined
                            ? studentGrades.average.toFixed(1)
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Inputs Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-tight block">
                          Giữa kỳ (GK 50%)
                        </label>
                        <GradeInput
                          value={studentGrades[EvaluationType.MIDTERM] ?? ''}
                          onBlur={(val) =>
                            handleGradeChange(student.id, EvaluationType.MIDTERM, val)
                          }
                          error={midtermError}
                          rowIndex={idx}
                          colIndex={0}
                          isMobile
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-tight block">
                          Cuối kỳ (CK 50%)
                        </label>
                        <GradeInput
                          value={studentGrades[EvaluationType.FINAL] ?? ''}
                          onBlur={(val) => handleGradeChange(student.id, EvaluationType.FINAL, val)}
                          error={finalError}
                          rowIndex={idx}
                          colIndex={1}
                          isMobile
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP HIGH-DENSITY TABLE (>= md) */}
            <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50/70 dark:bg-white/5 border-b border-stone-200/80 dark:border-white/10 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      <th className="px-3.5 py-2.5 text-left w-12">#</th>
                      <th className="px-3.5 py-2.5 text-left">Học sinh</th>
                      <th className="px-3.5 py-2.5 text-center w-32">
                        {GRADE_LABELS[EvaluationType.MIDTERM]} (50%)
                      </th>
                      <th className="px-3.5 py-2.5 text-center w-32">
                        {GRADE_LABELS[EvaluationType.FINAL]} (50%)
                      </th>
                      <th className="px-3.5 py-2.5 text-center text-emerald-600 dark:text-emerald-400 w-28 bg-emerald-50/40 dark:bg-emerald-500/5">
                        Điểm TB
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-xs">
                    {students.map((student, idx) => {
                      const studentGrades = grades[student.id] || {};
                      const studentErrors = errors[student.id] || [];

                      return (
                        <StudentRow
                          key={student.id}
                          student={student}
                          index={idx}
                          studentGrades={studentGrades}
                          studentErrors={studentErrors}
                          onGradeChange={handleGradeChange}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button Floating / Sticky Bar */}
            <div className="sticky bottom-20 md:bottom-4 z-20 flex justify-end pt-2">
              <Button
                variant="success"
                onClick={() => setShowConfirm(true)}
                disabled={!hasGrades || hasErrors || saving}
                className="w-full sm:w-auto px-6 h-11 sm:h-10 rounded-xl shadow-lg shadow-emerald-500/20 font-black uppercase text-xs cursor-pointer press-effect"
                leftIcon={<Icons.Save className="w-4 h-4" />}
              >
                {saving ? 'Đang lưu...' : 'Lưu bảng điểm'}
              </Button>
            </div>
          </>
        )}

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lưu điểm?</AlertDialogTitle>
              <AlertDialogDescription>
                Điều này sẽ lưu điểm Giữa kỳ và Cuối kỳ cho {students.length} học sinh trong lớp{' '}
                {selectedClass?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-bold">Hủy bỏ</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSave}
                className="bg-amber-500 hover:bg-amber-600 font-black"
              >
                Xác nhận lưu
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Excel Import Modal */}
        {showExcelImport && selectedClassId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-auto">
              <BulkGradeImport
                classId={selectedClassId}
                onSuccess={() => {
                  setShowExcelImport(false);
                  toast.success('Import thành công!');
                }}
                onClose={() => setShowExcelImport(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoized individual student row to avoid re-rendering other rows when editing a single grade input
const StudentRow = React.memo(function StudentRow({
  student,
  index,
  studentGrades,
  studentErrors,
  onGradeChange,
}: {
  student: Student;
  index: number;
  studentGrades: Partial<GradeRow>;
  studentErrors: GradeError[];
  onGradeChange: (studentId: string, field: EvaluationType, val: string) => void;
}) {
  const midtermError = studentErrors.find((e) => e.field === EvaluationType.MIDTERM)?.message;
  const finalError = studentErrors.find((e) => e.field === EvaluationType.FINAL)?.message;
  const hasStudentErrors = studentErrors.length > 0;

  const handleMidtermBlur = React.useCallback(
    (val: string) => {
      onGradeChange(student.id, EvaluationType.MIDTERM, val);
    },
    [student.id, onGradeChange]
  );

  const handleFinalBlur = React.useCallback(
    (val: string) => {
      onGradeChange(student.id, EvaluationType.FINAL, val);
    },
    [student.id, onGradeChange]
  );

  return (
    <tr
      className={cn(
        'transition-colors',
        hasStudentErrors
          ? 'bg-rose-50/40 dark:bg-rose-950/20'
          : 'hover:bg-stone-50/60 dark:hover:bg-white/5'
      )}
    >
      <td className="px-3.5 py-2.5 text-xs font-bold text-stone-400">{index + 1}</td>
      <td className="px-3.5 py-2.5 text-xs font-bold text-stone-900 dark:text-stone-100">
        {student.full_name || student.name || '—'}
      </td>
      <td className="px-3.5 py-2">
        <GradeInput
          value={studentGrades[EvaluationType.MIDTERM] ?? ''}
          onBlur={handleMidtermBlur}
          error={midtermError}
          rowIndex={index}
          colIndex={0}
        />
      </td>
      <td className="px-3.5 py-2">
        <GradeInput
          value={studentGrades[EvaluationType.FINAL] ?? ''}
          onBlur={handleFinalBlur}
          error={finalError}
          rowIndex={index}
          colIndex={1}
        />
      </td>
      <td className="px-3.5 py-2 text-center bg-emerald-50/30 dark:bg-emerald-500/5">
        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {studentGrades.average !== null && studentGrades.average !== undefined
            ? studentGrades.average.toFixed(1)
            : '—'}
        </span>
      </td>
    </tr>
  );
});

// Memoized individual grade input
const GradeInput = React.memo(function GradeInput({
  value,
  onBlur,
  error,
  rowIndex,
  colIndex,
  isMobile,
}: {
  value: string | number;
  onBlur: (val: string) => void;
  error?: string;
  rowIndex: number;
  colIndex: number;
  isMobile?: boolean;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onBlur(String(localValue));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.querySelector(
        `input[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      } else {
        (e.target as HTMLInputElement).blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(
        `input[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(
        `input[data-row="${rowIndex - 1}"][data-col="${colIndex}"]`
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      let nextCol = colIndex + 1;
      let nextRow = rowIndex;
      if (nextCol > 1) {
        nextCol = 0;
        nextRow = rowIndex + 1;
      }
      const nextInput = document.querySelector(
        `input[data-row="${nextRow}"][data-col="${nextCol}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      let prevCol = colIndex - 1;
      let prevRow = rowIndex;
      if (prevCol < 0) {
        prevCol = 1;
        prevRow = rowIndex - 1;
      }
      const prevInput = document.querySelector(
        `input[data-row="${prevRow}"][data-col="${prevCol}"]`
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-0.5 group', isMobile && 'w-full')}>
      <Input
        type="number"
        min="0"
        max="10"
        step="0.1"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0.0"
        data-row={rowIndex}
        data-col={colIndex}
        className={cn(
          'text-center font-bold rounded-xl transition-all',
          isMobile ? 'w-full h-9 text-sm' : 'w-24 h-9 text-xs sm:text-sm',
          'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10',
          'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
          error ? 'border-rose-500 ring-rose-500/10' : ''
        )}
      />
      {error && (
        <span className="text-[9px] text-rose-600 font-bold uppercase tracking-tight">{error}</span>
      )}
    </div>
  );
});

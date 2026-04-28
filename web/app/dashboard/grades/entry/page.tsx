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
  course_id?: string;
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
  const handleGradeChange = (studentId: string, field: EvaluationType, value: string) => {
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
  };

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
        const studentList = studentsData.map((s: any) => ({
          id: s.student_id || s.id, // Support both student_id and id
          name: s.full_name || s.name,
          full_name: s.full_name || s.name,
        })).filter(s => s.id && typeof s.id === 'string'); // Ensure we have a valid ID
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
          .filter((g) => 
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            Nhập điểm học tập
          </h1>
          <p className="mt-2 text-stone-500 font-medium text-sm">
            Cập nhật kết quả điểm Giữa kỳ và Cuối kỳ (trọng số 50:50) cho học sinh
          </p>
        </div>

        {/* Filters */}
        <div className="glass-crystal p-8 rounded-[2rem] shadow-ultra border-none mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Lớp học</label>
              <Select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(e.target.value || null)}
                className="h-12 rounded-xl glass-crystal border-none font-semibold"
              >
                <option value="">Chọn lớp...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Học kỳ</label>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as Semester)}
                className="h-12 rounded-xl glass-crystal border-none font-semibold"
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

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Môn học</label>
              <Select
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(e.target.value || null)}
                disabled={classSubjects.length === 0}
                className="h-12 rounded-xl glass-crystal border-none font-semibold"
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

        {/* Grades Table - Simplified with only Midterm, Final, and Average */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Đang tải danh sách học sinh...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chọn lớp để xem danh sách học sinh</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-stone-500 font-medium">
                Đang hiển thị <strong>{students.length}</strong> học sinh — Lớp{' '}
                <span className="text-emerald-600 font-bold">{selectedClass?.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasErrors && (
                  <div className="text-xs bg-red-50 dark:bg-red-500/10 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-500/20 font-bold flex items-center gap-2">
                    <Icons.Error className="w-4 h-4" />
                    {Object.values(errors).reduce((acc, e) => acc + e.length, 0)} lỗi nhập liệu
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="rounded-xl h-10 px-4 font-bold border-stone-200 dark:border-white/10"
                  leftIcon={<Icons.Download className="w-4 h-4" />}
                >
                  Xuất mẫu CSV
                </Button>
                <label className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-500/20 text-sm">
                  <Icons.Upload className="w-4 h-4" />
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
                  className="rounded-xl h-10 px-4 font-bold border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5"
                  leftIcon={<Icons.Chart className="w-4 h-4" />}
                >
                  Import Excel
                </Button>
              </div>
            </div>

            <div className="glass-crystal rounded-[2.5rem] shadow-ultra border-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50/50 dark:bg-white/5 border-b border-stone-100 dark:border-white/5">
                      <th className="px-6 py-5 text-left text-xs font-bold text-stone-400 uppercase tracking-widest w-16">
                        #
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-stone-400 uppercase tracking-widest">
                        Học sinh
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-stone-400 uppercase tracking-widest w-36">
                        {GRADE_LABELS[EvaluationType.MIDTERM]}
                        <span className="text-stone-300 dark:text-stone-600 font-medium ml-1">(50%)</span>
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-stone-400 uppercase tracking-widest w-36">
                        {GRADE_LABELS[EvaluationType.FINAL]}
                        <span className="text-stone-300 dark:text-stone-600 font-medium ml-1">(50%)</span>
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-emerald-600 uppercase tracking-widest w-32 bg-emerald-50/30 dark:bg-emerald-500/5">
                        Điểm TB
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((student, idx) => {
                      const studentGrades = grades[student.id] || {};
                      const studentErrors = errors[student.id] || [];
                      const hasStudentErrors = studentErrors.length > 0;

                      return (
                        <tr
                          key={student.id}
                          className={
                            hasStudentErrors
                              ? 'bg-danger/10'
                              : 'hover:bg-surface-secondary/50 transition-colors'
                          }
                        >
                          <td className="px-6 py-4 text-sm font-bold text-stone-400">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-stone-900 dark:text-stone-100">
                            {student.full_name || student.name || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <GradeInput
                              value={studentGrades[EvaluationType.MIDTERM] ?? ''}
                              onChange={(val) =>
                                handleGradeChange(student.id, EvaluationType.MIDTERM, val)
                              }
                              error={
                                studentErrors.find((e) => e.field === EvaluationType.MIDTERM)
                                  ?.message
                              }
                            />
                          </td>
                          <td className="px-6 py-4">
                            <GradeInput
                              value={studentGrades[EvaluationType.FINAL] ?? ''}
                              onChange={(val) =>
                                handleGradeChange(student.id, EvaluationType.FINAL, val)
                              }
                              error={
                                studentErrors.find((e) => e.field === EvaluationType.FINAL)?.message
                              }
                            />
                          </td>
                          <td className="px-6 py-4 text-center bg-emerald-50/30 dark:bg-emerald-500/5">
                            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                              {studentGrades.average !== null && studentGrades.average !== undefined
                                ? studentGrades.average.toFixed(1)
                                : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                variant="success"
                onClick={() => setShowConfirm(true)}
                disabled={!hasGrades || hasErrors || saving}
                size="lg"
                className="px-12 rounded-2xl shadow-xl shadow-emerald-500/20 font-bold"
                leftIcon={<Icons.Save className="w-5 h-5" />}
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Save
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
                  // Reload students to refresh grades
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

function GradeInput({
  value,
  onChange,
  error,
}: {
  value: string | number;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 group">
      <Input
        type="number"
        min="0"
        max="10"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Điểm"
        className={cn(
          "w-32 h-12 text-center text-lg font-bold rounded-xl transition-all",
          "bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10",
          "focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500",
          error ? 'border-red-500 ring-red-500/10' : ''
        )}
      />
      {error && <span className="text-[10px] text-red-600 font-bold uppercase tracking-tight">{error}</span>}
    </div>
  );
}

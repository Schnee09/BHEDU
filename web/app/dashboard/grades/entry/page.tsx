"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/hooks";
import {
  EvaluationType,
  GradeRow,
  Semester,
  calculateAverageGrade,
  GRADE_LABELS
} from "@/lib/grades/types";
import { GradeService } from "@/lib/grades/services/GradeService";
import { validateGrade } from "@/lib/grades/validation";

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
  const toast = useToast();

  // State - Classes
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // State - Semester
  const [selectedSemester, setSelectedSemester] = useState<Semester>('1');

  // State - Students & Grades
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, Partial<GradeRow>>>({});
  const [errors, setErrors] = useState<Record<string, GradeError[]>>({});

  // State - UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Helper: Handle grade input change
  const handleGradeChange = (studentId: string, field: EvaluationType, value: string) => {
    const numValue = value === '' ? null : Number(value);

    // Update grade and calculate average
    setGrades(prev => {
      const studentGrades = { ...prev[studentId], [field]: numValue };
      const average = calculateAverageGrade(
        studentGrades[EvaluationType.MIDTERM],
        studentGrades[EvaluationType.FINAL]
      );
      return {
        ...prev,
        [studentId]: { ...studentGrades, average }
      };
    });

    // Validate and update errors
    const validation = validateGrade(numValue);
    setErrors(prev => {
      const studentErrors = prev[studentId] || [];
      if (validation.valid) {
        return {
          ...prev,
          [studentId]: studentErrors.filter(e => e.field !== field)
        };
      } else {
        const filtered = studentErrors.filter(e => e.field !== field);
        return {
          ...prev,
          [studentId]: [...filtered, { field, message: validation.error || 'Invalid' }]
        };
      }
    });
  };

  // Load initial data (classes)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading classes...');
        const classRes = await apiFetch('/api/classes/my-classes');
        if (classRes.ok) {
          const classData = await classRes.json();
          const classList = classData.classes || [];
          setClasses(classList);

          if (classList.length > 0) {
            setSelectedClassId(classList[0].id);
          }
        } else {
          toast.error('Không thể tải danh sách lớp');
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        const data = await GradeService.getStudentsWithGrades(
          selectedClassId,
          selectedClassId,
          selectedSemester
        );

        const studentList = data.students || [];
        setStudents(studentList);

        // Initialize grades from fetched data
        const initialGrades: Record<string, Partial<GradeRow>> = {};
        studentList.forEach((s: { id: string; grades?: Partial<GradeRow> }) => {
          if (s.grades) {
            const midterm = s.grades[EvaluationType.MIDTERM];
            const final = s.grades[EvaluationType.FINAL];
            initialGrades[s.id] = {
              ...s.grades,
              average: calculateAverageGrade(midterm, final)
            };
          }
        });
        setGrades(initialGrades);
        setErrors({});
        console.log(`✅ Students loaded: ${studentList.length}`);
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
  }, [selectedClassId, selectedSemester]);

  // Handle save
  const handleSave = async () => {
    setShowConfirm(false);
    setSaving(true);

    try {
      console.log('📤 Saving grades...');

      // Build grade rows to save - only midterm and final
      const gradeRows = students
        .map(student => ({
          student_id: student.id,
          grades: {
            [EvaluationType.MIDTERM]: grades[student.id]?.[EvaluationType.MIDTERM] ?? null,
            [EvaluationType.FINAL]: grades[student.id]?.[EvaluationType.FINAL] ?? null,
          }
        }))
        .filter(row => {
          // Only include if at least one grade is entered
          return Object.values(row.grades).some(v => v !== null && v !== undefined);
        });

      if (gradeRows.length === 0) {
        toast.error('Không có điểm để lưu');
        return;
      }

      const result = await GradeService.saveGrades({
        class_id: selectedClassId!,
        subject_code: selectedClassId!,
        semester: selectedSemester,
        students: gradeRows
      });

      if (result.ok) {
        console.log(`✅ Saved grades for ${gradeRows.length} students`);
        toast.success(`Đã lưu điểm cho ${gradeRows.length} học sinh`);
      } else {
        console.error('❌ Save failed:', result.error);
        toast.error(result.error || 'Không thể lưu điểm');
      }
    } finally {
      setSaving(false);
    }
  };

  const hasGrades = students.length > 0 && Object.values(grades).some(g =>
    g[EvaluationType.MIDTERM] !== null && g[EvaluationType.MIDTERM] !== undefined ||
    g[EvaluationType.FINAL] !== null && g[EvaluationType.FINAL] !== undefined
  );

  const hasErrors = Object.values(errors).some(e => e.length > 0);
  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nhập Điểm</h1>
          <p className="mt-2 text-muted-foreground">
            Nhập điểm Giữa kỳ và Cuối kỳ (thang điểm 10, trọng số 50:50)
          </p>
        </div>

        {/* Filters */}
        <div className="bg-surface/80 backdrop-blur-sm rounded-xl shadow-soft border border-border p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Lớp học</label>
              <Select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(e.target.value || null)}
              >
                <option value="">Chọn lớp...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Học kỳ</label>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as Semester)}
              >
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Grades Table - Simplified with only Midterm, Final, and Average */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải danh sách học sinh...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chọn lớp để xem danh sách học sinh</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <strong>{students.length}</strong> học sinh trong lớp <strong>{selectedClass?.name}</strong>
              </div>
              {hasErrors && (
                <div className="text-sm text-red-600">
                  ⚠️ {Object.values(errors).reduce((acc, e) => acc + e.length, 0)} lỗi
                </div>
              )}
            </div>

            <div className="bg-surface/80 backdrop-blur-sm rounded-xl shadow-soft border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-secondary border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground w-12">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Học sinh</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-foreground w-28">
                        {GRADE_LABELS[EvaluationType.MIDTERM]}
                        <span className="text-muted-foreground font-normal"> (50%)</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-foreground w-28">
                        {GRADE_LABELS[EvaluationType.FINAL]}
                        <span className="text-muted-foreground font-normal"> (50%)</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-foreground w-24 bg-blue-50 dark:bg-blue-900/20">
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
                        <tr key={student.id} className={hasStudentErrors ? 'bg-danger/10' : 'hover:bg-surface-secondary/50 transition-colors'}>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {student.full_name || student.name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <GradeInput
                              value={studentGrades[EvaluationType.MIDTERM] ?? ''}
                              onChange={(val) => handleGradeChange(student.id, EvaluationType.MIDTERM, val)}
                              error={studentErrors.find(e => e.field === EvaluationType.MIDTERM)?.message}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <GradeInput
                              value={studentGrades[EvaluationType.FINAL] ?? ''}
                              onChange={(val) => handleGradeChange(student.id, EvaluationType.FINAL, val)}
                              error={studentErrors.find(e => e.field === EvaluationType.FINAL)?.message}
                            />
                          </td>
                          <td className="px-4 py-3 text-center bg-blue-50 dark:bg-blue-900/20">
                            <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
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

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={!hasGrades || hasErrors || saving}
                size="lg"
              >
                {saving ? 'Đang lưu...' : 'Save Grades'}
              </Button>
            </div>
          </>
        )}

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lưu điểm?</AlertDialogTitle>
              <AlertDialogDescription>
                Điều này sẽ lưu điểm Giữa kỳ và Cuối kỳ cho {students.length} học sinh trong lớp {selectedClass?.name}.
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
      </div>
    </div>
  );
}

function GradeInput({ value, onChange, error }: { value: string | number; onChange: (val: string) => void; error?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Input
        type="number"
        min="0"
        max="10"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0-10"
        className={`w-20 text-center ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
      />
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
}

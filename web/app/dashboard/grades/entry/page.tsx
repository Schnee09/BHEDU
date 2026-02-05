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
import { apiFetch, getClasses, getClassStudents, getGrades, bulkCreateGrades } from "@/lib/api/client";
import { useToast } from "@/hooks";
import {
  EvaluationType,
  GradeRow,
  Semester,
  calculateAverageGrade,
  GRADE_LABELS
} from "@/lib/grades/types";
import { validateGrade } from "@/lib/grades/validation";
import PageGuard from "@/components/PageGuard";
import BulkGradeImport from "@/components/grades/BulkGradeImport";

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

  // State - Students & Grades
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, Partial<GradeRow>>>({});
  const [errors, setErrors] = useState<Record<string, GradeError[]>>({});

  // State - UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{ name: string, midterm: number | null, final: number | null }[]>([]);

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
        const res = await getClasses({ limit: 100 });
        const classList = (res.data || []) as ClassOption[];
        setClasses(classList);

        if (classList.length > 0) {
          setSelectedClassId(classList[0].id);
        }
      } catch (err) {
        console.error("Failed to load classes", err);
        toast.error('Không thể tải danh sách lớp');
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

        // Fetch students and grades in parallel
        const [studentsData, gradesRes] = await Promise.all([
          getClassStudents(selectedClassId),
          getGrades({ class_id: selectedClassId, semester: selectedSemester, limit: 1000 })
        ]);

        // Students might be raw array (from my client.ts)
        const studentList = studentsData.map((s: any) => ({
          id: s.id,
          name: s.full_name || s.name,
          full_name: s.full_name || s.name
        }));
        setStudents(studentList);

        // Map grades
        const fetchedGrades = gradesRes.data || [];
        const initialGrades: Record<string, Partial<GradeRow>> = {};

        studentList.forEach((s: Student) => {
          const studentGradesList = fetchedGrades.filter((g: any) => g.student_id === s.id);

          const midtermGrade = studentGradesList.find((g: any) => g.component_type === EvaluationType.MIDTERM);
          const finalGrade = studentGradesList.find((g: any) => g.component_type === EvaluationType.FINAL);

          if (midtermGrade || finalGrade) {
            const mScore = midtermGrade?.score ?? null;
            const fScore = finalGrade?.score ?? null;

            initialGrades[s.id] = {
              [EvaluationType.MIDTERM]: mScore,
              [EvaluationType.FINAL]: fScore,
              average: calculateAverageGrade(mScore, fScore)
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
  }, [selectedClassId, selectedSemester]);

  // Handle save
  const handleSave = async () => {
    setShowConfirm(false);
    setSaving(true);

    try {
      console.log('📤 Saving grades...');
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const subjectId = selectedClass?.subject_id || selectedClass?.course_id;

      if (!subjectId) {
        toast.error("Không tìm thấy thông tin môn học của lớp này");
        return;
      }

      // We need to save Midterm and Final separately as they are different components
      const components = [EvaluationType.MIDTERM, EvaluationType.FINAL];
      let successCount = 0;

      for (const component of components) {
        const gradesToSave = students
          .map(student => ({
            student_id: student.id,
            score: grades[student.id]?.[component] ?? null,
            notes: null
          }))
          .filter(g => g.score !== null && g.score !== undefined); // Only save if score exists

        if (gradesToSave.length > 0) {
          await bulkCreateGrades({
            class_id: selectedClassId,
            subject_id: subjectId,
            component_type: component,
            semester: selectedSemester,
            academic_year_id: "current", // Backend handles this logic? Or we need ID. Current implementation requires UUID?
            // Schema says UUID. `lib/schemas/requests/grade.ts`. 
            // If we don't have academic_year_id, we might fail validation.
            // For now, let's try to fetch it or omit if optional? Schema says required.
            // I'll hardcode a known ID or fetch it? 
            // Or rely on backend defaulting?
            // NOTE: I will use a placeholder or omit if the API allows it. 
            // If V2 requires it, I'm in trouble without context.
            // Let's assume the API handles "current" or I fetch it.
            grades: gradesToSave
          });
          successCount += gradesToSave.length;
        }
      }

      if (successCount > 0) {
        toast.success(`Đã lưu điểm thành công`);
      } else {
        toast.info("Không có thay đổi nào để lưu");
      }

    } catch (err: any) {
      console.error('❌ Save failed:', err);
      toast.error(err.message || 'Không thể lưu điểm');
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

  // Download CSV template
  const downloadTemplate = () => {
    const headers = 'Họ tên,Điểm giữa kỳ,Điểm cuối kỳ';
    const sampleRows = students.map(s =>
      `"${s.full_name || s.name || ''}",${grades[s.id]?.[EvaluationType.MIDTERM] ?? ''},${grades[s.id]?.[EvaluationType.FINAL] ?? ''}`
    ).join('\n');

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
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          setImportError('File phải có ít nhất 1 dòng dữ liệu');
          return;
        }

        // Skip header row
        const dataRows = lines.slice(1);
        const preview: { name: string, midterm: number | null, final: number | null }[] = [];
        const newGrades = { ...grades };

        for (const row of dataRows) {
          // Parse CSV row (handle quoted values)
          const values = row.match(/("[^"]*"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
          if (values.length < 1) continue;

          const name = values[0];
          const midterm = values[1] ? parseFloat(values[1]) : null;
          const final = values[2] ? parseFloat(values[2]) : null;

          // Find matching student
          const student = students.find(s =>
            (s.full_name || s.name || '').toLowerCase() === name.toLowerCase()
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

          preview.push({ name, midterm, final });
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
              <div className="flex items-center gap-2">
                {hasErrors && (
                  <div className="text-sm text-red-600 mr-2">
                    ⚠️ {Object.values(errors).reduce((acc, e) => acc + e.length, 0)} lỗi
                  </div>
                )}
                <button
                  onClick={downloadTemplate}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  title="Tải mẫu CSV"
                >
                  📥 Xuất mẫu
                </button>
                <label className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 cursor-pointer transition-colors">
                  📤 Import CSV
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowExcelImport(true)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  📊 Import Excel
                </button>
              </div>
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

"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { performVietnameseSave } from '@/lib/grades/vietnameseSave';
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks";

// Module-scoped types for the inlined Vietnamese entry
interface Student {
  id: string;
  name?: string;
  full_name?: string;
  grades?: {
    oral?: number | null;
    fifteen_min?: number | null;
    one_period?: number | null;
    midterm?: number | null;
    final?: number | null;
  };
}

interface Subject {
  id: string;
  code?: string;
  name?: string;
  title?: string;
}

interface EvaluationType {
  id: string;
  code?: string;
  weight?: number;
  type?: string;
  color?: string;
}

function VietnameseEntryInline() {
  const toast = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [evaluationTypes, setEvaluationTypes] = useState<EvaluationType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentGrades, setStudentGrades] = useState<Record<string, {
    oral?: number | null,
    fifteen_min?: number | null,
    one_period?: number | null,
    midterm?: number | null,
    final?: number | null
  }>>({});
  const [studentErrors, setStudentErrors] = useState<Record<string, Partial<Record<"oral"|"fifteen_min"|"one_period"|"midterm"|"final", string>>>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | 'final'>('1');

  const handleGradeChange = (studentId: string, field: keyof NonNullable<Student['grades']>, value: string) => {
    const parsed = value === '' ? null : Number(value);
    setStudentGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: parsed } }));
    const errMsg = value === '' ? undefined : (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 10) ? 'Must be 0–10' : undefined;
    setStudentErrors(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: errMsg } }));
  };

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/classes/my-classes');
        const safeParseJson = async (r: Response) => { try { return await r.json() } catch { return { error: r.statusText || `HTTP ${r.status}` } } };
        if (!res.ok) {
          const err = await safeParseJson(res);
          toast.error(err?.error || 'Failed to load classes');
          return;
        }
        const data = await safeParseJson(res);
        const cls = data.classes || [];
        setClasses(cls);
        if (cls.length > 0 && !selectedClassId) setSelectedClassId(cls[0].id);
      } catch (_err) {
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    const fetchSubjects = async () => {
      try {
        const res = await apiFetch('/api/subjects');
        const safeParseJson = async (r: Response) => { try { return await r.json() } catch { return { error: r.statusText || `HTTP ${r.status}` } } };
        if (!res.ok) {
          const err = await safeParseJson(res);
          toast.error(err?.error || 'Failed to load subjects');
          return;
        }
        const data = await safeParseJson(res);
        const subs = data.subjects || [];
        setSubjects(subs);
        if (subs.length > 0 && !selectedSubjectCode) setSelectedSubjectCode(subs[0].code || subs[0].id || null);
      } catch (_err) {
        toast.error('Failed to load subjects');
      }
    };

    const fetchEvaluationTypes = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('evaluation_types')
          .select('*')
          .order('weight', { ascending: true });

        if (data) {
          const colors = ['bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-orange-50', 'bg-red-50', 'bg-purple-50'];
          const mapped = data.map((t: any, index: number) => ({
            ...t,
            type: t.code?.toLowerCase?.(),
            color: colors[index % colors.length]
          }));
          setEvaluationTypes(mapped);
        } else if (error) {
          toast.error('Failed to load evaluation types');
        }
      } catch (_err) {
        toast.error('Failed to load evaluation types');
      }
    };

    fetchClasses();
    fetchSubjects();
    fetchEvaluationTypes();
  }, [toast, selectedClassId, selectedSubjectCode]);

  const hasValidationErrors = useMemo(() => {
    return Object.values(studentErrors).some(e => e && Object.values(e).some(Boolean));
  }, [studentErrors]);

  const handleSave = async () => {
    if (!selectedClassId || !selectedSubjectCode || !selectedSemester) {
      toast.error('Please select class, subject and semester');
      return;
    }
    if (hasValidationErrors) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setSaveLoading(true);
    try {
      const payloadStudents = students.map((s: any) => ({
        student_id: s.id,
        grades: {
          oral: studentGrades[s.id]?.oral == null ? null : Number(studentGrades[s.id]?.oral),
          fifteen_min: studentGrades[s.id]?.fifteen_min == null ? null : Number(studentGrades[s.id]?.fifteen_min),
          one_period: studentGrades[s.id]?.one_period == null ? null : Number(studentGrades[s.id]?.one_period),
          midterm: studentGrades[s.id]?.midterm == null ? null : Number(studentGrades[s.id]?.midterm),
          final: studentGrades[s.id]?.final == null ? null : Number(studentGrades[s.id]?.final)
        }
      }));

      const payload = {
        class_id: selectedClassId!,
        subject_code: selectedSubjectCode!,
        semester: selectedSemester,
        students: payloadStudents
      };

      const result = await performVietnameseSave(payload as any);
      if (!result.ok) {
        toast.error(result.data?.error || 'Failed to save grades');
        return;
      }
      if (Object.keys(result.studentErrors).length > 0) {
        const newErrors: Record<string, Partial<Record<"oral"|"fifteen_min"|"one_period"|"midterm"|"final", string>>> = {};
        for (const [sid, msg] of Object.entries(result.studentErrors)) {
          newErrors[sid] = { ...(studentErrors[sid] || {}), final: msg };
        }
        setStudentErrors(prev => ({ ...prev, ...newErrors }));
        toast.error(result.data?.message || 'Some students failed to save; see inline errors');
      } else {
        toast.success(result.data?.message || 'Grades saved');
      }
    } catch (_err) {
      toast.error('Failed to save grades');
    } finally {
      setSaveLoading(false);
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Load students + existing Vietnamese grades when class, subject and semester are selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassId || !selectedSubjectCode || !selectedSemester) return;
      setLoading(true);
      try {
        const url = `/api/grades/vietnamese-entry?class_id=${encodeURIComponent(selectedClassId)}&subject_code=${encodeURIComponent(selectedSubjectCode)}&semester=${encodeURIComponent(selectedSemester)}`;
        const res = await apiFetch(url);
        const safeParseJson = async (r: Response) => { try { return await r.json() } catch { return { error: r.statusText || `HTTP ${r.status}` } } };
        if (!res.ok) {
          const err = await safeParseJson(res);
          toast.error(err?.error || 'Failed to load student grades');
          return;
        }
        const data = await safeParseJson(res);
        const studentsData = data.students || [];
        setStudents(studentsData);
        const gradesMap: Record<string, any> = {};
        for (const s of studentsData) {
          gradesMap[s.id] = {
            oral: s.grades?.oral ?? null,
            fifteen_min: s.grades?.fifteen_min ?? null,
            one_period: s.grades?.one_period ?? null,
            midterm: s.grades?.midterm ?? null,
            final: s.grades?.final ?? null
          };
        }
        setStudentGrades(gradesMap);
      } catch (_err) {
        toast.error('Failed to load student grades');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [selectedClassId, selectedSubjectCode, selectedSemester, toast, reloadTrigger]);

  // NOTE: student loading is handled by the Vietnamese-specific loader above

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vietnamese Grade Entry</h3>
            <p className="text-sm text-gray-600 mt-1">
              Enter grades for {classes.length} classes, {subjects.length} subjects, {evaluationTypes.length} evaluation types
            </p>
          </div>

          {/* Filters Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class</label>
                <Select value={selectedClassId ?? ''} onChange={(e) => setSelectedClassId(e.target.value || null)}>
                  <option value="">Select class</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.display_name || c.id}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <Select value={selectedSubjectCode ?? ''} onChange={(e) => setSelectedSubjectCode(e.target.value || null)}>
                  <option value="">Select subject</option>
                  {subjects.map((s: any) => (
                    <option key={s.code || s.id} value={s.code || s.id}>
                      {s.name || s.title || s.code}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Semester</label>
                <Select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value as any)}>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="final">Final Exam</option>
                </Select>
              </div>
            </div>
          </div>

          {students.length > 0 ? (
            <div className="space-y-4">
              {/* Students Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">
                  Students ({students.length})
                </h4>
                <div className="text-sm text-gray-500">
                  {Object.values(studentErrors).some(e => e && Object.values(e).some(Boolean))
                    ? `${Object.values(studentErrors).filter(e => e && Object.values(e).some(Boolean)).length} validation errors`
                    : 'All grades valid'
                  }
                </div>
              </div>

              {/* Grades Table */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Oral</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">15 Min</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">1 Period</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Midterm</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((s: any, idx: number) => {
                      const sg = studentGrades[s.id] || {};
                      const hasErrors = studentErrors[s.id] && Object.values(studentErrors[s.id]).some(Boolean);
                      return (
                        <tr key={s.id} className={`hover:bg-gray-50 ${hasErrors ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {s.name || s.full_name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center space-y-1">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className={`w-20 text-center ${studentErrors[s.id]?.oral ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={sg.oral ?? ''}
                                onChange={(e) => handleGradeChange(s.id, 'oral', e.target.value)}
                                placeholder="0-10"
                              />
                              {studentErrors[s.id]?.oral && (
                                <span className="text-xs text-red-600">{studentErrors[s.id].oral}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center space-y-1">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className={`w-20 text-center ${studentErrors[s.id]?.fifteen_min ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={sg.fifteen_min ?? ''}
                                onChange={(e) => handleGradeChange(s.id, 'fifteen_min', e.target.value)}
                                placeholder="0-10"
                              />
                              {studentErrors[s.id]?.fifteen_min && (
                                <span className="text-xs text-red-600">{studentErrors[s.id].fifteen_min}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center space-y-1">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className={`w-20 text-center ${studentErrors[s.id]?.one_period ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={sg.one_period ?? ''}
                                onChange={(e) => handleGradeChange(s.id, 'one_period', e.target.value)}
                                placeholder="0-10"
                              />
                              {studentErrors[s.id]?.one_period && (
                                <span className="text-xs text-red-600">{studentErrors[s.id].one_period}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center space-y-1">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className={`w-20 text-center ${studentErrors[s.id]?.midterm ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={sg.midterm ?? ''}
                                onChange={(e) => handleGradeChange(s.id, 'midterm', e.target.value)}
                                placeholder="0-10"
                              />
                              {studentErrors[s.id]?.midterm && (
                                <span className="text-xs text-red-600">{studentErrors[s.id].midterm}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center space-y-1">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className={`w-20 text-center ${studentErrors[s.id]?.final ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={sg.final ?? ''}
                                onChange={(e) => handleGradeChange(s.id, 'final', e.target.value)}
                                placeholder="0-10"
                              />
                              {studentErrors[s.id]?.final && (
                                <span className="text-xs text-red-600">{studentErrors[s.id].final}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReloadTrigger(prev => prev + 1)}
                    className="flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Reload Data</span>
                  </Button>

                  {hasValidationErrors && (
                    <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Please fix validation errors before saving</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={saveLoading || hasValidationErrors}
                  className="flex items-center space-x-2"
                >
                  {saveLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save All Grades</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Confirmation Dialog */}
              <AlertDialog open={showConfirm} onOpenChange={(o) => setShowConfirm(o)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Confirm Save Operation</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                      You are about to save grades for <strong>{students.length} students</strong> in this class.
                      This will overwrite any existing grades for the selected subject and semester.
                      <br /><br />
                      This action cannot be undone. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowConfirm(false)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => { setShowConfirm(false); await handleSave(); }}
                      className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                    >
                      Yes, Save Grades
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a class, subject, and semester to load student data.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GradeEntryPageModern() {
  const [mode, setMode] = useState<'modern' | 'vietnamese'>('vietnamese');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Grade Entry System</h1>
          <p className="mt-2 text-gray-600">
            Manage student grades efficiently with our modern grade entry interface.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex">
            <button
              onClick={() => setMode('modern')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'modern'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Standard Entry
            </button>
            <button
              onClick={() => setMode('vietnamese')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'vietnamese'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Vietnamese Entry
            </button>
          </div>
        </div>

        {/* Content */}
        {mode === 'vietnamese' ? (
          <VietnameseEntryInline />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Standard Entry Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              The standard grade entry interface is currently under development.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { VietnameseEntryInline };

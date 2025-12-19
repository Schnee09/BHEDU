"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui";
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

// Module-scoped types for the inlined Vietnamese entry (keep them simple for now)
type VStudent = any;
type VSubject = any;
type VEvaluationType = any;

function VietnameseEntryInline() {
  const toast = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<VSubject[]>([]);
  const [evaluationTypes, setEvaluationTypes] = useState<VEvaluationType[]>([]);
  const [students, setStudents] = useState<VStudent[]>([]);
  const [studentGrades, setStudentGrades] = useState<Record<string, {
    oral?: number | string | null,
    fifteen_min?: number | string | null,
    one_period?: number | string | null,
    midterm?: number | string | null,
    final?: number | string | null
  }>>({});
  const [studentErrors, setStudentErrors] = useState<Record<string, Partial<Record<"oral"|"fifteen_min"|"one_period"|"midterm"|"final", string>>>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | 'final'>('1');

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
            oral: s.grades?.oral ?? '',
            fifteen_min: s.grades?.fifteen_min ?? '',
            one_period: s.grades?.one_period ?? '',
            midterm: s.grades?.midterm ?? '',
            final: s.grades?.final ?? ''
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
  }, [selectedClassId, selectedSubjectCode, selectedSemester, toast]);

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

    // confirmation dialog before bulk save
    if (!confirm('Are you sure you want to save grades for all students? This will overwrite existing grades.')) return;

    setSaveLoading(true);
    try {
      const payloadStudents = students.map((s: any) => ({
        student_id: s.id,
        grades: {
          oral: (studentGrades[s.id]?.oral === '' || studentGrades[s.id]?.oral == null) ? null : Number(studentGrades[s.id]?.oral),
          fifteen_min: (studentGrades[s.id]?.fifteen_min === '' || studentGrades[s.id]?.fifteen_min == null) ? null : Number(studentGrades[s.id]?.fifteen_min),
          one_period: (studentGrades[s.id]?.one_period === '' || studentGrades[s.id]?.one_period == null) ? null : Number(studentGrades[s.id]?.one_period),
          midterm: (studentGrades[s.id]?.midterm === '' || studentGrades[s.id]?.midterm == null) ? null : Number(studentGrades[s.id]?.midterm),
          final: (studentGrades[s.id]?.final === '' || studentGrades[s.id]?.final == null) ? null : Number(studentGrades[s.id]?.final)
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

  // NOTE: student loading is handled by the Vietnamese-specific loader above

  return (
    <div className="p-4 bg-white rounded">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <h3 className="font-semibold">Vietnamese Entry (partial)</h3>
          <div className="text-sm text-gray-600">Classes: {classes.length} — Subjects: {subjects.length} — Eval types: {evaluationTypes.length}</div>

          <div className="mt-3 flex items-center gap-3">
            <div>
              <label className="text-sm block mb-1">Class</label>
              <select className="border rounded px-2 py-1" value={selectedClassId ?? ''} onChange={(e) => setSelectedClassId(e.target.value || null)}>
                <option value="">Select class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.display_name || c.id}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Subject</label>
              <select className="border rounded px-2 py-1" value={selectedSubjectCode ?? ''} onChange={(e) => setSelectedSubjectCode(e.target.value || null)}>
                <option value="">Select subject</option>
                {subjects.map((s: any) => <option key={s.code || s.id} value={s.code || s.id}>{s.name || s.title || s.code}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Semester</label>
              <select className="border rounded px-2 py-1" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value as any)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>

          {students.length > 0 ? (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Students ({students.length})</div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left">
                      <th className="px-2 py-1">#</th>
                      <th className="px-2 py-1">Name</th>
                      <th className="px-2 py-1">Oral</th>
                      <th className="px-2 py-1">15m</th>
                      <th className="px-2 py-1">1-period</th>
                      <th className="px-2 py-1">Midterm</th>
                      <th className="px-2 py-1">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s: any, idx: number) => {
                      const sg = studentGrades[s.id] || {};
                      return (
                        <tr key={s.id} className="border-t">
                          <td className="px-2 py-1">{idx + 1}</td>
                          <td className="px-2 py-1">{s.name || s.full_name || '—'}</td>
                          <td className="px-2 py-1">
                            <input
                              className={`border rounded px-2 py-1 w-20 ${studentErrors[s.id]?.oral ? 'border-red-500' : ''}`}
                              value={sg.oral ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === '' ? '' : Number(raw);
                                setStudentGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], oral: parsed } }));
                                // validate
                                const errMsg = raw === '' ? undefined : (isNaN(Number(raw)) || Number(raw) < 0 || Number(raw) > 10) ? 'Must be 0–10' : undefined;
                                setStudentErrors(prev => ({ ...prev, [s.id]: { ...prev[s.id], oral: errMsg } }));
                              }}
                            />
                            {studentErrors[s.id]?.oral && <div className="text-xs text-red-600 mt-1">{studentErrors[s.id].oral}</div>}
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className={`border rounded px-2 py-1 w-20 ${studentErrors[s.id]?.fifteen_min ? 'border-red-500' : ''}`}
                              value={sg.fifteen_min ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === '' ? '' : Number(raw);
                                setStudentGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], fifteen_min: parsed } }));
                                const errMsg = raw === '' ? undefined : (isNaN(Number(raw)) || Number(raw) < 0 || Number(raw) > 10) ? 'Must be 0–10' : undefined;
                                setStudentErrors(prev => ({ ...prev, [s.id]: { ...prev[s.id], fifteen_min: errMsg } }));
                              }}
                            />
                              {studentErrors[s.id]?.fifteen_min && <div className="text-xs text-red-600 mt-1">{studentErrors[s.id].fifteen_min}</div>}
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className={`border rounded px-2 py-1 w-20 ${studentErrors[s.id]?.one_period ? 'border-red-500' : ''}`}
                              value={sg.one_period ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === '' ? '' : Number(raw);
                                setStudentGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], one_period: parsed } }));
                                const errMsg = raw === '' ? undefined : (isNaN(Number(raw)) || Number(raw) < 0 || Number(raw) > 10) ? 'Must be 0–10' : undefined;
                                setStudentErrors(prev => ({ ...prev, [s.id]: { ...prev[s.id], one_period: errMsg } }));
                              }}
                            />
                              {studentErrors[s.id]?.one_period && <div className="text-xs text-red-600 mt-1">{studentErrors[s.id].one_period}</div>}
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className={`border rounded px-2 py-1 w-20 ${studentErrors[s.id]?.midterm ? 'border-red-500' : ''}`}
                              value={sg.midterm ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === '' ? '' : Number(raw);
                                setStudentGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], midterm: parsed } }));
                                const errMsg = raw === '' ? undefined : (isNaN(Number(raw)) || Number(raw) < 0 || Number(raw) > 10) ? 'Must be 0–10' : undefined;
                                setStudentErrors(prev => ({ ...prev, [s.id]: { ...prev[s.id], midterm: errMsg } }));
                              }}
                            />
                              {studentErrors[s.id]?.midterm && <div className="text-xs text-red-600 mt-1">{studentErrors[s.id].midterm}</div>}
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className={`border rounded px-2 py-1 w-20 ${studentErrors[s.id]?.final ? 'border-red-500' : ''}`}
                              value={sg.final ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === '' ? '' : Number(raw);
                                setStudentGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], final: parsed } }));
                                const errMsg = raw === '' ? undefined : (isNaN(Number(raw)) || Number(raw) < 0 || Number(raw) > 10) ? 'Must be 0–10' : undefined;
                                setStudentErrors(prev => ({ ...prev, [s.id]: { ...prev[s.id], final: errMsg } }));
                              }}
                            />
                              {studentErrors[s.id]?.final && <div className="text-xs text-red-600 mt-1">{studentErrors[s.id].final}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Button onClick={() => setShowConfirm(true)} disabled={saveLoading || hasValidationErrors}>
                  {saveLoading ? 'Saving…' : 'Save grades'}
                </Button>

                <AlertDialog open={showConfirm} onOpenChange={(o) => setShowConfirm(o)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm save</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to save grades for all students? This will overwrite existing grades.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => { setShowConfirm(false); await handleSave(); }}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button onClick={() => {
                  // reload handled by effect when selectedClassId/subject/semester are set
                  setSelectedClassId((c) => c);
                }}>Reload</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-500">No students loaded yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GradeEntryPageModern() {
  const [mode, setMode] = useState<'modern' | 'vietnamese'>('modern');

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Grade Entry</h1>
      <p className="text-gray-600 mb-6">The Grade Entry UI is being repaired; Vietnamese entry is re-introduced incrementally.</p>
      <div className="mb-4">
        <button onClick={() => setMode('modern')} className={`px-3 py-1 rounded ${mode === 'modern' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Standard Entry</button>
        <button onClick={() => setMode('vietnamese')} className={`ml-2 px-3 py-1 rounded ${mode === 'vietnamese' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Vietnamese Entry</button>
      </div>

      {mode === 'vietnamese' ? <VietnameseEntryInline /> : (
        <div className="bg-white rounded p-6">Standard entry UI (placeholder)</div>
      )}
    </div>
  );
}

export { VietnameseEntryInline };

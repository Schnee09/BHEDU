'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
} from '@/components/ui';
import {
  Plus,
  Edit3,
  MapPin,
  Trash2,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import { getDisplayName } from '@/lib/utils/names';
import {
  TimetableSlot,
  ClassOption,
  SubjectOption,
  TeacherOption,
  StudentOption,
} from '@/lib/timetable/types';
import {
  CAMPUSES,
  DAYS,
  ALL_SESSIONS,
} from '@/lib/timetable/constants';

interface TimetableSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingSlot: TimetableSlot | null;
  initialData?: Partial<TimetableSlot>;
  currentWeekStart: string;
}

export default function TimetableSlotModal({
  isOpen,
  onClose,
  onSuccess,
  editingSlot,
  initialData,
  currentWeekStart,
}: TimetableSlotModalProps) {
  const { can } = usePermissions();
  const canEdit = can('timetable.edit');

  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Options
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [tutors, setTutors] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    class_id: '',
    student_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 0,
    start_time: '17:00',
    end_time: '18:30',
    room: '',
    notes: '',
    weekly_note: '',
  });

  // Sync form with editingSlot or initialData
  useEffect(() => {
    if (isOpen) {
      if (editingSlot) {
        setFormData({
          class_id: editingSlot.class_id || '',
          student_id: editingSlot.student_id || '',
          subject_id: editingSlot.subject?.id || '',
          teacher_id: editingSlot.teacher?.id || '',
          day_of_week: editingSlot.day_of_week,
          start_time: editingSlot.start_time?.substring(0, 5) || '17:00',
          end_time: editingSlot.end_time?.substring(0, 5) || '18:30',
          room: editingSlot.room || '',
          notes: editingSlot.notes || '',
          weekly_note: editingSlot.weekly_note || '',
        });
      } else if (initialData) {
        setFormData({
          class_id: initialData.class_id || '',
          student_id: initialData.student_id || '',
          subject_id: '',
          teacher_id: '',
          day_of_week: initialData.day_of_week ?? 0,
          start_time: initialData.start_time?.substring(0, 5) || '17:00',
          end_time: initialData.end_time?.substring(0, 5) || '18:30',
          room: initialData.room || '',
          notes: '',
          weekly_note: '',
        });
      }
    }
  }, [isOpen, editingSlot, initialData]);

  // Fetch Options only when modal is open and user has permissions
  useEffect(() => {
    if (isOpen && canEdit) {
      fetchOptions();
    }
  }, [isOpen, canEdit]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [classRes, subRes, teacherRes, tutorRes, studentRes] = await Promise.all([
        apiFetch('/api/classes'),
        apiFetch('/api/subjects'),
        apiFetch('/api/admin/users?role=teacher&limit=1000'),
        apiFetch('/api/tutors?limit=1000'),
        apiFetch('/api/admin/users?role=student&limit=1000'),
      ]);

      const classData = await classRes.json();
      const subData = await subRes.json();
      const teacherData = await teacherRes.json();
      const tutorData = await tutorRes.json();
      const studentData = await studentRes.json();

      setClasses(classData.data?.data || classData.data || classData.classes || []);
      setSubjects(subData.data || subData.subjects || []);
      setTeachers(teacherData.data?.data || teacherData.data || teacherData.users || []);
      setTutors(tutorData.data || tutorData.tutors || []);
      setStudents(studentData.data?.data || studentData.data || studentData.users || []);
    } catch (e) {
      console.error('Failed to fetch modal options:', e);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSave = async () => {
    if (formData.room === 'Linh hoạt') {
      if (!formData.student_id) {
        alert('Vui lòng chọn học sinh');
        return;
      }
    } else {
      if (!formData.class_id) {
        alert('Vui lòng chọn lớp');
        return;
      }
    }

    if (!formData.subject_id) {
      alert('Vui lòng chọn môn học');
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingSlot;
      const url = isEditing ? `/api/timetable/${editingSlot.id}` : '/api/timetable';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          class_id: formData.class_id || null,
          student_id: formData.student_id || null,
          subject_id: formData.subject_id || null,
          teacher_id: formData.teacher_id || null,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      // Save weekly note if provided
      const slotId = isEditing ? editingSlot.id : result.slot?.id;
      if (slotId && formData.weekly_note) {
        await apiFetch('/api/timetable/weekly-notes', {
          method: 'POST',
          body: JSON.stringify({
            slot_id: slotId,
            week_start_date: currentWeekStart,
            notes: formData.weekly_note,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (slotId && !formData.weekly_note && editingSlot?.has_weekly_note) {
        // Delete weekly note if it was cleared
        await apiFetch(
          `/api/timetable/weekly-notes?slot_id=${slotId}&week_start_date=${currentWeekStart}`,
          {
            method: 'DELETE',
          }
        );
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save slot:', error);
      alert('Lỗi khi lưu: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSlot ? 'Chỉnh sửa tiết học' : 'Thêm tiết học mới'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            isLoading={saving}
            disabled={
              loadingOptions ||
              !formData.subject_id ||
              (formData.room === 'Linh hoạt' ? !formData.student_id : !formData.class_id)
            }
            onClick={handleSave}
            leftIcon={editingSlot ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {editingSlot ? 'Cập nhật' : 'Lưu lại'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Context Info */}
        {formData.room && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-4">
            <div className="p-2 bg-primary/10 rounded-lg h-fit">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="grid grid-cols-3 gap-y-1 flex-1">
              <div className="text-[10px] text-primary font-black uppercase tracking-widest">
                Phòng
              </div>
              <div className="text-[10px] text-primary font-black uppercase tracking-widest">
                Ngày
              </div>
              <div className="text-[10px] text-primary font-black uppercase tracking-widest">
                Ca học
              </div>
              <div className="text-sm font-black text-gray-900 dark:text-white">
                {formData.room}
              </div>
              <div className="text-sm font-black text-gray-900 dark:text-white">
                {DAYS[formData.day_of_week]}
              </div>
              <div className="text-sm font-black text-gray-900 dark:text-white px-2 py-0.5 bg-white dark:bg-gray-800 rounded-md border border-primary/10 w-fit">
                {formData.start_time}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          {formData.room === 'Linh hoạt' ? (
            <>
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
                  Học sinh *
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                  disabled={loadingOptions}
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
                  Môn học *
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                  disabled={loadingOptions}
                >
                  <option value="">-- Chọn môn --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
                  Gia sư *
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                  disabled={loadingOptions}
                >
                  <option value="">-- Chọn gia sư --</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
                  Lớp *
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => {
                    const classId = e.target.value;
                    const selectedClassObj = classes.find((c) => c.id === classId);

                    let subjectId = selectedClassObj?.course_id || '';

                    if (!subjectId && selectedClassObj?.teacher?.teacher_subjects) {
                      const primarySubject = selectedClassObj.teacher.teacher_subjects.find(
                        (ts) => ts.is_primary
                      );
                      if (primarySubject) {
                        subjectId = primarySubject.subject_id;
                      } else if (selectedClassObj.teacher.teacher_subjects.length > 0) {
                        subjectId =
                          selectedClassObj.teacher.teacher_subjects[0]?.subject_id || '';
                      }
                    }

                    setFormData((prev) => ({
                      ...prev,
                      class_id: classId,
                      teacher_id: selectedClassObj?.teacher_id || prev.teacher_id,
                      subject_id: subjectId || prev.subject_id,
                    }));
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                  disabled={loadingOptions}
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {formData.class_id && (
                <div className="p-4 bg-primary/5 border border-dashed border-primary/20 rounded-2xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted uppercase tracking-tighter">
                      Giáo viên:
                    </span>
                    <span className="text-sm font-black text-primary">
                      {getDisplayName(teachers.find((t) => t.id === formData.teacher_id))}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black text-muted uppercase tracking-tighter mb-1">
                      Môn học:
                    </span>
                    <select
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      className="w-full bg-transparent text-sm font-black text-primary border-b border-primary/20 focus:border-primary focus:outline-none pb-1 cursor-pointer"
                      disabled={loadingOptions}
                    >
                      <option value="">-- Chưa có --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {(!formData.room || editingSlot) && (
          <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                Tùy chọn nâng cao
              </span>
              <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
                  Thứ
                </label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) =>
                    setFormData({ ...formData, day_of_week: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                >
                  {DAYS.map((day, i) => (
                    <option key={i} value={i}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
                  Ca học
                </label>
                <select
                  value={formData.start_time}
                  onChange={(e) => {
                    const session = ALL_SESSIONS.find((s) => s.start === e.target.value);
                    setFormData({
                      ...formData,
                      start_time: e.target.value,
                      end_time: session?.end || formData.end_time,
                    });
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                >
                  {ALL_SESSIONS.map((p) => (
                    <option key={p.id} value={p.start}>
                      {p.label} ({p.time})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
                Vị trí / Phòng
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
              >
                <option value="">-- Chọn phòng --</option>
                <option value="Linh hoạt">🎓 Học kèm (Linh hoạt)</option>
                {CAMPUSES.filter((c) => c.id !== 'HK')
                  .flatMap((c) => c.rooms.map((room) => `${c.name} - ${room}`))
                  .map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">
              Ghi chú mặc định
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-medium focus:border-primary outline-none transition-all shadow-sm min-h-[80px] resize-none"
              placeholder="Ghi chú áp dụng cho tất cả các tuần..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-primary uppercase tracking-widest ml-1">
              Ghi chú riêng tuần này
            </label>
            <textarea
              value={formData.weekly_note || ''}
              onChange={(e) => setFormData({ ...formData, weekly_note: e.target.value })}
              className="w-full px-4 py-3 bg-primary/[0.02] dark:bg-primary/[0.05] border-2 border-primary/20 rounded-xl text-sm font-medium focus:border-primary outline-none transition-all shadow-sm min-h-[80px] resize-none"
              placeholder="Ghi chú chỉ áp dụng cho tuần hiện tại..."
            />
            {formData.weekly_note && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary-dark font-black"
                onClick={() => setFormData({ ...formData, weekly_note: '' })}
                leftIcon={<Trash2 className="w-3 h-3" />}
              >
                Xóa ghi chú tuần này
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

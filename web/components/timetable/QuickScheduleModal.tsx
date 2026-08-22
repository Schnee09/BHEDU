'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { useToast } from '@/hooks';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Plus,
  Sparkles,
  Layers,
} from 'lucide-react';
import { getDisplayName } from '@/lib/utils/names';

interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: {
    dayIndex: number;
    session?: { label?: string; start: string; end: string };
    room?: string;
  } | null;
  classes: any[];
  teachers: any[];
  dynamicRooms: string[];
  dynamicSchedules: string[];
}

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const PRESET_COMBINATIONS = [
  { label: '2 - 4 - 6', days: [0, 2, 4] },
  { label: '3 - 5 - 7', days: [1, 3, 5] },
  { label: 'Thứ 2 - Thứ 6', days: [0, 1, 2, 3, 4] },
  { label: 'Cuối tuần (T7, CN)', days: [5, 6] },
];

export default function QuickScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  classes,
  teachers,
  dynamicRooms,
  dynamicSchedules,
}: QuickScheduleModalProps) {
  const toast = useToast();
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [room, setRoom] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:30');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Fetch subjects list for selector
  useEffect(() => {
    if (!isOpen) return;
    const fetchSubjects = async () => {
      try {
        const res = await apiFetch('/api/subjects');
        if (res.ok) {
          const data = await res.json();
          if (data.subjects) setSubjects(data.subjects);
        }
      } catch (err) {
        console.warn('Failed to fetch subjects in QuickScheduleModal', err);
      }
    };
    fetchSubjects();
  }, [isOpen]);

  // Initialize form when opened or initialData changes
  useEffect(() => {
    if (!isOpen) return;
    setConflictWarning(null);
    setClassId('');
    setTeacherId('');
    setSubjectId('');
    setNotes('');

    if (initialData) {
      setSelectedDays([initialData.dayIndex ?? 0]);
      if (initialData.session) {
        setStartTime(initialData.session.start || '17:00');
        setEndTime(initialData.session.end || '18:30');
      }
      if (initialData.room) {
        setRoom(initialData.room);
      } else if (dynamicRooms.length > 0) {
        setRoom(dynamicRooms[0] || '');
      }
    } else {
      setSelectedDays([0]);
    }
  }, [isOpen, initialData, dynamicRooms]);

  // When class is selected, auto-fill teacher and subject from class metadata
  const handleClassChange = (selectedClassId: string) => {
    setClassId(selectedClassId);
    setConflictWarning(null);
    if (!selectedClassId) return;

    const cls = classes.find((c) => c.id === selectedClassId);
    if (cls) {
      if (cls.teacher_id) setTeacherId(cls.teacher_id);
      if (cls.subject_id) setSubjectId(cls.subject_id);
      if (cls.room && !initialData?.room) setRoom(cls.room);
    }
  };

  // Toggle day in multiple day selection
  const toggleDay = (dayIdx: number) => {
    setConflictWarning(null);
    setSelectedDays((prev) => {
      if (prev.includes(dayIdx)) {
        if (prev.length === 1) {
          toast.warning('Lưu ý', 'Cần chọn ít nhất 1 thứ trong tuần');
          return prev;
        }
        return prev.filter((d) => d !== dayIdx).sort((a, b) => a - b);
      } else {
        return [...prev, dayIdx].sort((a, b) => a - b);
      }
    });
  };

  const applyPresetDays = (days: number[]) => {
    setConflictWarning(null);
    setSelectedDays(days);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      toast.warning('Thiếu thông tin', 'Vui lòng chọn Lớp học');
      return;
    }

    if (selectedDays.length === 0) {
      toast.warning('Thiếu thông tin', 'Vui lòng chọn ít nhất 1 thứ trong tuần');
      return;
    }

    if (startTime >= endTime) {
      toast.warning('Thời gian không hợp lệ', 'Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    setSaving(true);
    setConflictWarning(null);

    const formattedStart = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEnd = endTime.length === 5 ? `${endTime}:00` : endTime;

    try {
      const res = await apiFetch('/api/timetable', {
        method: 'POST',
        body: JSON.stringify({
          class_id: classId,
          teacher_id: teacherId || null,
          subject_id: subjectId || null,
          room: room || null,
          day_of_week: selectedDays[0] ?? 0,
          days_of_week: selectedDays,
          start_time: formattedStart,
          end_time: formattedEnd,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.code === 'CONFLICT') {
          setConflictWarning(
            data.error || 'Phòng học hoặc Giáo viên bị trùng lịch vào khung giờ này.'
          );
          toast.error('Trùng lịch', data.error || 'Xung đột lịch học');
          return;
        }
        throw new Error(data.error || 'Không thể xếp lịch');
      }

      const count = selectedDays.length;
      toast.success(
        'Xếp lịch thành công',
        `Đã thêm ${count} tiết học (${selectedDays.map((d) => DAY_NAMES[d]).join(', ')}) vào TKB!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Lỗi', err.message || 'Xếp lịch thất bại');
    } finally {
      setSaving(false);
    }
  };

  const daySummaryText =
    selectedDays.length > 0 ? selectedDays.map((d) => DAY_NAMES[d]).join(', ') : 'Chưa chọn thứ';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xếp Lịch Học Nhanh" size="lg">
      <form onSubmit={handleSave} className="space-y-5">
        {/* Context Summary Header */}
        <div className="p-4 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">{daySummaryText}</span>
          </div>
          <div className="flex items-center gap-2 font-mono shrink-0">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              {startTime} - {endTime}
            </span>
          </div>
          {room && (
            <div className="flex items-center gap-2 shrink-0">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Phòng: {room}</span>
            </div>
          )}
        </div>

        {/* Conflict Alert if any */}
        {conflictWarning && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cảnh báo trùng lịch:</p>
              <p className="mt-0.5 whitespace-pre-wrap">{conflictWarning}</p>
            </div>
          </div>
        )}

        {/* Class Selection */}
        <div>
          <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
            Lớp học <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors z-10" />
            <select
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-white/10 text-sm font-bold text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              required
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.room ? `(${cls.room})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject & Teacher Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Môn học
            </label>
            <div className="relative group">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors z-10" />
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setConflictWarning(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-white/10 text-sm font-bold text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">-- Môn theo lớp hoặc chưa chọn --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Giáo viên phụ trách
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors z-10" />
              <select
                value={teacherId}
                onChange={(e) => {
                  setTeacherId(e.target.value);
                  setConflictWarning(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-white/10 text-sm font-bold text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">-- Chưa gán giáo viên --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getDisplayName(t)} {t.email ? `(${t.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Day of Week Selector */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Các thứ trong tuần <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Đã chọn: {selectedDays.length} ngày
            </span>
          </div>

          {/* 7 Days Toggle Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {DAY_NAMES.map((name, index) => {
              const isSelected = selectedDays.includes(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={cn(
                    'py-2.5 px-1 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border',
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm scale-[1.02]'
                      : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-stone-700'
                  )}
                >
                  <span className="text-[11px] sm:text-xs leading-none">{name}</span>
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all',
                      isSelected ? 'bg-white' : 'bg-transparent'
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Day Presets */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-500" />
              Chọn nhanh:
            </span>
            {PRESET_COMBINATIONS.map((preset, idx) => {
              const isActive =
                preset.days.length === selectedDays.length &&
                preset.days.every((d) => selectedDays.includes(d));
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPresetDays(preset.days)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Room Selection */}
        <div>
          <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
            Phòng học
          </label>
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors z-10" />
            <select
              value={room}
              onChange={(e) => {
                setRoom(e.target.value);
                setConflictWarning(null);
              }}
              className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-white/10 text-sm font-bold text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="">-- Chưa gán phòng --</option>
              {dynamicRooms.map((r) => (
                <option key={r} value={r}>
                  Phòng {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Inputs & Quick Shift Chips */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setConflictWarning(null);
                }}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-white/10 text-sm font-bold font-mono text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setConflictWarning(null);
                }}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-white/10 text-sm font-bold font-mono text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Preset Shift Chips */}
          {dynamicSchedules && dynamicSchedules.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Ca học mẫu:
              </span>
              {dynamicSchedules.map((sched, idx) => {
                const parts = sched.split('-').map((s) => s.trim());
                const isSelected = parts[0] === startTime && parts[1] === endTime;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (parts[0]) setStartTime(parts[0]);
                      if (parts[1]) setEndTime(parts[1]);
                      setConflictWarning(null);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer',
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs scale-105'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    )}
                  >
                    {sched}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
            Ghi chú tiết học (tùy chọn)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Ôn tập giữa kỳ, Thực hành..."
            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-white/10 text-sm font-medium text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-black uppercase text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>
                  Xếp Lịch {selectedDays.length > 1 ? `(${selectedDays.length} buổi/tuần)` : 'Ngay'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

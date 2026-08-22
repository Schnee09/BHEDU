'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  Edit3,
  Trash2,
  X,
  Phone,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { TimetableSlot } from '@/lib/timetable/types';
import { getDisplayName } from '@/lib/utils/names';

interface TimetableQuickActionModalProps {
  slot: TimetableSlot | null;
  onClose: () => void;
  onEdit?: (slot: TimetableSlot) => void;
  onDelete?: (slotId: string) => void;
  onUpdateStatus?: (slotId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'makeup') => void;
  canEdit?: boolean;
}

export default function TimetableQuickActionModal({
  slot,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  canEdit = false,
}: TimetableQuickActionModalProps) {
  if (!slot) return null;

  const className = slot.class?.name || getDisplayName(slot.student) || 'Tiết học';
  const subjectName = slot.subject?.name || 'Môn học';
  const teacherName = getDisplayName(slot.teacher) || 'Chưa phân công';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-[32px] border border-stone-200/80 dark:border-white/10 shadow-2xl w-full max-w-lg overflow-hidden transition-all transform scale-100">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-stone-100 dark:border-white/5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">{slot.subject?.code || 'BH-EDU'}</Badge>
                {slot.room && (
                  <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-white/10 px-2 py-0.5 rounded-full uppercase">
                    {slot.room}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1 leading-tight">
                {className}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Info */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Time */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                  Thời gian
                </span>
                <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                  {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                </span>
              </div>
            </div>

            {/* Room */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                  Phòng học
                </span>
                <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                  {slot.room || 'Linh hoạt'}
                </span>
              </div>
            </div>
          </div>

          {/* Subject & Teacher */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-500 dark:text-stone-400">
                Môn học:
              </span>
              <span className="font-black text-stone-900 dark:text-stone-100">{subjectName}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200/50 dark:border-white/5">
              <span className="font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-500" /> Giáo viên:
              </span>
              <span className="font-black text-stone-900 dark:text-stone-100">{teacherName}</span>
            </div>

            {slot.teacher?.phone && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200/50 dark:border-white/5">
                <span className="font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-500" /> SĐT liên hệ:
                </span>
                <a
                  href={`tel:${slot.teacher.phone}`}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {slot.teacher.phone}
                </a>
              </div>
            )}
          </div>

          {/* Status Switcher Bar */}
          {onUpdateStatus && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block px-1">
                Trạng thái tiết học
              </span>
              <div className="grid grid-cols-4 gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200/50 dark:border-white/5">
                {[
                  { key: 'scheduled', label: '🟡 Đã xếp', color: 'bg-amber-500 text-white' },
                  { key: 'completed', label: '🟢 Hoàn thành', color: 'bg-emerald-500 text-white' },
                  { key: 'cancelled', label: '🔴 Hủy ca', color: 'bg-red-500 text-white' },
                  { key: 'makeup', label: '🔵 Học bù', color: 'bg-sky-500 text-white' },
                ].map((st) => {
                  const isActive = (slot.status || 'scheduled') === st.key;
                  return (
                    <button
                      key={st.key}
                      onClick={() => onUpdateStatus(slot.id, st.key as any)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all text-center ${
                        isActive
                          ? `${st.color} shadow-sm scale-[1.02]`
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {(slot.notes || slot.weekly_note) && (
            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">Ghi chú:</span>
              <p className="text-stone-600 dark:text-stone-300 italic">{slot.weekly_note || slot.notes}</p>
            </div>
          )}

          {/* Quick Interconnected Links */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block px-1">
              Liên kết nhanh (Quick Actions)
            </span>

            <div className="grid grid-cols-2 gap-2">
              {slot.class_id && (
                <>
                  <Link
                    href={`/dashboard/attendance?class_id=${slot.class_id}`}
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500 text-white font-black text-xs hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <ClipboardCheck className="w-4 h-4" /> Điểm danh ngay
                  </Link>

                  <Link
                    href={`/dashboard/classes/${slot.class_id}`}
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition-all border border-stone-200/60 dark:border-white/5"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500" /> Chi tiết Lớp học
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer for Admin Edit/Delete */}
        {canEdit && (
          <div className="p-4 bg-stone-50 dark:bg-stone-950/60 border-t border-stone-100 dark:border-white/5 flex items-center justify-between">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(slot.id);
                }}
                className="text-red-500 hover:bg-red-500/10 rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Xóa tiết học
              </Button>
            )}

            {onEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(slot);
                }}
                className="rounded-xl px-5"
              >
                <Edit3 className="w-4 h-4 mr-1.5" /> Chỉnh sửa
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

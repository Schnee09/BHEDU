'use client';

import Link from 'next/link';
import { Edit, Archive, Phone, Mail, Calendar, UserX, Eye, Check, Award } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Student {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  student_code?: string; // UID
  student_id?: string; // CID
  grade_level?: string;
  status?: string;
  created_at: string;
}

interface MobileStudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onArchive: (student: Student) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  hasAdminAccess: boolean;
  onViewDetails?: (student: Student) => void;
}

export default function MobileStudentList({
  students,
  onEdit,
  onArchive,
  selectedIds,
  onSelect,
  hasAdminAccess,
  onViewDetails,
}: MobileStudentListProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-white/10">
        <div className="bg-stone-100 dark:bg-stone-800 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-stone-400">
          <UserX className="w-7 h-7" />
        </div>
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
          Không tìm thấy học sinh nào
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-16 md:hidden animate-fade-in">
      {students.map((student, index) => {
        const isSelected = selectedIds.has(student.id);
        const isActive = student.status === 'active';

        return (
          <div
            key={student.id}
            className={cn(
              'rounded-2xl p-4 shadow-xs border transition-all relative overflow-hidden space-y-3',
              isSelected
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10 dark:bg-amber-950/10'
                : !isActive
                  ? 'bg-stone-50/60 dark:bg-stone-900/40 border-stone-200/60 dark:border-white/5 opacity-80'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-white/10'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Status Accent Left Stripe */}
            <div
              className={cn(
                'absolute left-0 top-3 bottom-3 w-1 rounded-r-full',
                isActive ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
              )}
            />

            {/* Top Row: Name + Badges + Selection Checkbox */}
            <div className="flex items-start justify-between gap-2.5 pl-1.5">
              <div className="flex-1 min-w-0 space-y-1">
                {/* Row 1: Name + Grade + Status */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3
                    onClick={() => (onViewDetails ? onViewDetails(student) : onSelect(student.id))}
                    className={cn(
                      'font-black text-base uppercase tracking-tight truncate cursor-pointer transition-colors',
                      !isActive
                        ? 'text-stone-400 dark:text-stone-500 line-through hover:text-stone-600 dark:hover:text-stone-300'
                        : 'text-stone-900 dark:text-white hover:text-amber-500'
                    )}
                  >
                    {student.full_name &&
                    student.full_name !== 'undefined undefined' &&
                    student.full_name !== 'null null'
                      ? student.full_name
                      : student.email
                        ? student.email.split('@')[0]
                        : 'Học sinh'}
                  </h3>

                  {student.grade_level && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-black border whitespace-nowrap uppercase shrink-0',
                        !isActive
                          ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500 border-stone-200/60 dark:border-white/5'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                      )}
                    >
                      {student.grade_level}
                    </span>
                  )}

                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0',
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                        : 'bg-stone-200/70 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-300/80 dark:border-white/10'
                    )}
                  >
                    {isActive ? 'Đang học' : 'Lưu trữ'}
                  </span>
                </div>

                {/* Row 2: UID & CID */}
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'text-[11px] font-mono font-black',
                      !isActive
                        ? 'text-stone-400 dark:text-stone-500'
                        : 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    UID: {student.student_code || 'HS-XXXX'}
                  </span>
                  {student.student_id && (
                    <>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span
                        className={cn(
                          'text-[11px] font-mono font-black',
                          !isActive
                            ? 'text-stone-400 dark:text-stone-500'
                            : 'text-amber-600 dark:text-amber-400'
                        )}
                      >
                        CID: {student.student_id}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Selection Checkbox (Crisp square checkbox) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(student.id);
                }}
                className={cn(
                  'w-6 h-6 shrink-0 aspect-square rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mt-0.5',
                  isSelected
                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                    : 'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/60 hover:border-amber-400'
                )}
                title="Chọn học sinh"
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </div>

            {/* Middle Row: Contact Info Pills */}
            {(student.phone || student.email || student.date_of_birth) && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-100 dark:border-white/5 pl-1.5">
                {student.phone && (
                  <a
                    href={`tel:${student.phone}`}
                    className="px-2.5 py-1 bg-stone-50 hover:bg-blue-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg flex items-center gap-1 text-[11px] font-bold border border-stone-200/60 dark:border-white/5 active:scale-95 transition-all"
                  >
                    <Phone className="w-3 h-3 text-blue-500" />
                    <span>{student.phone}</span>
                  </a>
                )}
                {student.email && (
                  <span className="px-2.5 py-1 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg flex items-center gap-1 text-[11px] font-medium border border-stone-200/60 dark:border-white/5 truncate max-w-[200px]">
                    <Mail className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </span>
                )}
                {student.date_of_birth && (
                  <span className="px-2.5 py-1 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg flex items-center gap-1 text-[11px] border border-stone-200/60 dark:border-white/5">
                    <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{format(new Date(student.date_of_birth), 'dd/MM/yyyy')}</span>
                  </span>
                )}
              </div>
            )}

            {/* Bottom Row: Fast Actions Bar */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-white/5 pl-1.5">
              <Link
                href={`/dashboard/students/${student.id}`}
                className="flex-1 h-9 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span>Xem hồ sơ</span>
              </Link>
              <Link
                href={`/dashboard/students/${student.id}/transcript`}
                className="w-9 h-9 shrink-0 bg-stone-50 hover:bg-blue-50 dark:bg-stone-800 dark:hover:bg-blue-950/40 text-stone-600 hover:text-blue-600 dark:text-stone-300 rounded-xl text-xs font-black border border-stone-200/60 dark:border-white/5 flex items-center justify-center transition-all shadow-xs"
                title="Bảng điểm"
              >
                <Award className="w-4 h-4 text-amber-500" />
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(student);
                }}
                className="px-3 h-9 shrink-0 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>
              {hasAdminAccess && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(student);
                  }}
                  className="w-9 h-9 shrink-0 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title={student.status === 'archived' ? 'Khôi phục học sinh' : 'Lưu trữ học sinh'}
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

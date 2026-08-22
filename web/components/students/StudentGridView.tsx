'use client';

import React from 'react';
import Link from 'next/link';
import { Edit, Archive, Phone, Mail, Calendar, Eye, Award } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Student } from './MobileStudentList';

interface StudentGridViewProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onArchive: (student: Student) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  hasAdminAccess: boolean;
  onViewDetails?: (student: Student) => void;
  onToggleStatus?: (student: Student) => void;
}

export default function StudentGridView({
  students,
  onEdit,
  onArchive,
  selectedIds,
  onSelect,
  hasAdminAccess,
  onViewDetails,
  onToggleStatus,
}: StudentGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 animate-fade-in">
      {students.map((student, index) => {
        const isSelected = selectedIds.has(student.id);
        const isActive = student.status === 'active';

        return (
          <div
            key={student.id}
            className={cn(
              'bg-white dark:bg-stone-900 rounded-2xl p-4 border transition-all duration-200 shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between group',
              isSelected
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10 dark:bg-amber-950/10'
                : 'border-stone-200/80 dark:border-white/10 hover:border-amber-500/40'
            )}
            style={{ animationDelay: `${index * 15}ms` }}
          >
            {/* Top status accent */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1',
                isActive ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
              )}
            />

            <div>
              {/* Card Header: Avatar + Name + Checkbox */}
              <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 uppercase">
                    {(
                      (student.full_name &&
                      student.full_name !== 'undefined undefined' &&
                      student.full_name !== 'null null'
                        ? student.full_name
                        : student.email
                          ? student.email.split('@')[0] || 'H'
                          : 'H'
                      ).charAt(0) || 'H'
                    ).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      onClick={() =>
                        onViewDetails ? onViewDetails(student) : onSelect(student.id)
                      }
                      className="font-bold text-stone-900 dark:text-stone-100 text-sm hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer truncate"
                      title={student.full_name}
                    >
                      {student.full_name &&
                      student.full_name !== 'undefined undefined' &&
                      student.full_name !== 'null null'
                        ? student.full_name
                        : student.email
                          ? student.email.split('@')[0]
                          : 'Học sinh'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {student.grade_level && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                          {student.grade_level}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleStatus && onToggleStatus(student)}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all',
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-white/10 hover:bg-stone-200'
                        )}
                        title="Click đổi trạng thái"
                      >
                        {isActive ? 'Đang học' : 'Lưu trữ'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelect(student.id)}
                  className="w-4 h-4 rounded border-stone-300 dark:border-stone-700 text-amber-600 focus:ring-amber-500 bg-transparent cursor-pointer shrink-0 mt-1"
                  title="Chọn học sinh"
                />
              </div>

              {/* Identity Badges: UID & CID */}
              <div className="grid grid-cols-2 gap-2 p-2 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/50 dark:border-white/5 mb-3 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
                    Mã UID
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 truncate block text-[11px]">
                    {student.student_code || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
                    Mã CID
                  </span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-300 truncate block text-[11px]">
                    {student.student_id || '—'}
                  </span>
                </div>
              </div>

              {/* Contact & Bio Info */}
              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 mb-3">
                {student.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <a
                      href={`tel:${student.phone}`}
                      className="font-medium text-stone-800 dark:text-stone-200 hover:text-blue-500 transition-colors"
                    >
                      {student.phone}
                    </a>
                  </div>
                ) : null}

                {student.email ? (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate text-stone-600 dark:text-stone-300">
                      {student.email}
                    </span>
                  </div>
                ) : null}

                {student.date_of_birth ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{format(new Date(student.date_of_birth), 'dd/MM/yyyy')}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-stone-100 dark:border-white/5 flex items-center gap-1.5">
              <Link
                href={`/dashboard/students/${student.id}`}
                className="flex-1 h-8 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span>Xem chi tiết</span>
              </Link>
              <Link
                href={`/dashboard/students/${student.id}/transcript`}
                className="p-1.5 h-8 w-8 bg-stone-50 hover:bg-blue-50 dark:bg-stone-800 dark:hover:bg-blue-950/40 text-stone-600 hover:text-blue-600 dark:text-stone-300 rounded-xl border border-stone-200/60 dark:border-white/5 flex items-center justify-center transition-all"
                title="Bảng điểm"
              >
                <Award className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => onEdit(student)}
                className="p-1.5 h-8 w-8 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center transition-all cursor-pointer"
                title="Chỉnh sửa thông tin"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              {hasAdminAccess && (
                <button
                  type="button"
                  onClick={() => onArchive(student)}
                  className="p-1.5 h-8 w-8 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center transition-all cursor-pointer"
                  title="Lưu trữ học sinh"
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

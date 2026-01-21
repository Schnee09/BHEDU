"use client";

import { Edit, Archive, Phone, Mail, Calendar, MapPin, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Student {
    id: string;
    full_name: string;
    email: string | null;
    role: string;
    date_of_birth: string | null;
    phone: string | null;
    address: string | null;
    student_code?: string;
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
}

export default function MobileStudentList({
    students,
    onEdit,
    onArchive,
    selectedIds,
    onSelect,
    hasAdminAccess
}: MobileStudentListProps) {
    if (students.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserX className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Không tìm thấy học sinh nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20 md:hidden">
            {students.map((student) => {
                const isSelected = selectedIds.has(student.id);
                const isActive = student.status === 'active';

                return (
                    <div
                        key={student.id}
                        className={`
              bg-white dark:bg-[#1A1410] rounded-2xl p-5 shadow-sm border transition-all active:scale-[0.98]
              relative overflow-hidden
              ${isSelected
                                ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/5 dark:bg-amber-900/5'
                                : 'border-stone-100 dark:border-[#2C2420]'}
            `}
                        onClick={() => onSelect(student.id)}
                    >
                        {/* Status Accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? 'bg-green-500' : 'bg-stone-300'}`} />

                        <div className="flex justify-between items-start gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-stone-900 dark:text-stone-100 truncate text-lg leading-tight">
                                        {student.full_name}
                                    </h3>
                                    {student.grade_level && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 whitespace-nowrap uppercase tracking-wider">
                                            {student.grade_level}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-stone-500 dark:text-stone-400 font-mono tracking-tight">
                                        {student.student_code || 'HS-XXXX'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isActive ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400' : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400'}`}>
                                        {isActive ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-stone-300 dark:border-stone-600'}`}>
                                {isSelected && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 bg-stone-50/50 dark:bg-white/5 rounded-xl p-3">
                            {student.phone && (
                                <div className="flex items-center gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                        <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="font-semibold">{student.phone}</span>
                                </div>
                            )}
                            {student.email && (
                                <div className="flex items-center gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                                    <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                        <Mail className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="truncate">{student.email}</span>
                                </div>
                            )}
                            {student.date_of_birth && (
                                <div className="flex items-center gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                        <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <span>{format(new Date(student.date_of_birth), 'dd/MM/yyyy')}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(student);
                                }}
                                className="flex-1 py-3 bg-white dark:bg-[#2C2420] hover:bg-stone-50 dark:hover:bg-[#3D342C] border border-stone-200 dark:border-[#3D342C] rounded-xl text-sm font-bold text-stone-700 dark:text-stone-200 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                            >
                                <Edit className="w-4 h-4 text-blue-500" />
                                Chỉnh sửa
                            </button>
                            {hasAdminAccess && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onArchive(student);
                                    }}
                                    className="px-4 py-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 flex items-center justify-center transition-all shadow-sm active:scale-95"
                                    aria-label="Lưu trữ"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

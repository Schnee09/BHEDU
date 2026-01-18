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
        <div className="space-y-3 pb-20 md:hidden">
            {students.map((student) => {
                const isSelected = selectedIds.has(student.id);
                const isActive = student.status === 'active';

                return (
                    <div
                        key={student.id}
                        className={`
              bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all
              ${isSelected
                                ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10'
                                : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700'}
            `}
                        onClick={() => onSelect(student.id)}
                    >
                        <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">
                                        {student.full_name}
                                    </h3>
                                    {student.grade_level && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                                            {student.grade_level}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                    <span>{student.student_code || '---'}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {isActive ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => { }} // Handled by div onClick
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                            />
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {student.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="font-medium">{student.phone}</span>
                                </div>
                            )}
                            {student.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate">{student.email}</span>
                                </div>
                            )}
                            {student.date_of_birth && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{format(new Date(student.date_of_birth), 'dd/MM/yyyy')}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(student);
                                }}
                                className="flex-1 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-white border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Sửa
                            </button>
                            {hasAdminAccess && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onArchive(student);
                                    }}
                                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 border border-red-200 dark:border-red-800/30 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Archive className="w-4 h-4" />
                                    Lưu trữ
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

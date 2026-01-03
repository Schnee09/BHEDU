"use client";

import { ReactNode } from "react";
import {
    Users,
    FileText,
    Calendar,
    BookOpen,
    ClipboardList,
    Search,
    FolderOpen,
    Inbox,
    AlertCircle,
    Plus
} from "lucide-react";

interface EmptyStateProps {
    /** Type of empty state - determines icon and default message */
    type?: "students" | "grades" | "attendance" | "classes" | "reports" | "search" | "folder" | "default" | "error";
    /** Custom title */
    title?: string;
    /** Custom description */
    description?: string;
    /** Custom icon to override the default */
    icon?: ReactNode;
    /** Action button */
    action?: {
        label: string;
        onClick: () => void;
        variant?: "primary" | "secondary";
    };
    /** Additional class names */
    className?: string;
}

const defaultContent = {
    students: {
        icon: Users,
        title: "Chưa có học sinh",
        description: "Thêm học sinh mới để bắt đầu quản lý",
    },
    grades: {
        icon: BookOpen,
        title: "Chưa có điểm số",
        description: "Điểm số sẽ hiển thị khi được nhập",
    },
    attendance: {
        icon: Calendar,
        title: "Chưa có dữ liệu điểm danh",
        description: "Bắt đầu điểm danh để theo dõi học sinh",
    },
    classes: {
        icon: ClipboardList,
        title: "Chưa có lớp học",
        description: "Tạo lớp học mới để bắt đầu",
    },
    reports: {
        icon: FileText,
        title: "Chưa có báo cáo",
        description: "Báo cáo sẽ xuất hiện khi có dữ liệu",
    },
    search: {
        icon: Search,
        title: "Không tìm thấy kết quả",
        description: "Thử tìm kiếm với từ khóa khác",
    },
    folder: {
        icon: FolderOpen,
        title: "Thư mục trống",
        description: "Không có dữ liệu trong thư mục này",
    },
    default: {
        icon: Inbox,
        title: "Không có dữ liệu",
        description: "Dữ liệu sẽ xuất hiện khi có thông tin",
    },
    error: {
        icon: AlertCircle,
        title: "Đã xảy ra lỗi",
        description: "Không thể tải dữ liệu. Vui lòng thử lại.",
    },
};

export default function EmptyState({
    type = "default",
    title,
    description,
    icon,
    action,
    className = "",
}: EmptyStateProps) {
    const content = defaultContent[type];
    const Icon = content.icon;

    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                {icon || <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title || content.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                {description || content.description}
            </p>

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${action.variant === "secondary"
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                            : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                        }`}
                >
                    <Plus className="w-4 h-4" />
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Compact variant for inline use
export function EmptyStateCompact({
    message = "Không có dữ liệu",
    className = "",
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div className={`flex items-center justify-center gap-2 py-8 text-gray-400 dark:text-gray-500 ${className}`}>
            <Inbox className="w-5 h-5" />
            <span className="text-sm">{message}</span>
        </div>
    );
}

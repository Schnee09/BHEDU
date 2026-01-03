"use client";

import { useState, useEffect } from "react";
import {
    UserPlus,
    BookOpen,
    Calendar,
    GraduationCap,
    Clock,
    TrendingUp,
    Edit,
    Trash2,
    RefreshCw
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";

interface ActivityItem {
    id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    user_email: string | null;
    created_at: string;
    new_data?: Record<string, unknown>;
}

const actionLabels: Record<string, string> = {
    create: "đã tạo",
    update: "đã cập nhật",
    delete: "đã xóa",
    import: "đã nhập",
};

const resourceLabels: Record<string, string> = {
    student: "học sinh",
    class: "lớp học",
    grade: "điểm số",
    attendance: "điểm danh",
    user: "người dùng",
};

const resourceIcons: Record<string, React.ReactNode> = {
    student: <UserPlus className="w-4 h-4" />,
    class: <GraduationCap className="w-4 h-4" />,
    grade: <BookOpen className="w-4 h-4" />,
    attendance: <Calendar className="w-4 h-4" />,
    user: <UserPlus className="w-4 h-4" />,
};

const actionIcons: Record<string, React.ReactNode> = {
    create: <UserPlus className="w-3 h-3" />,
    update: <Edit className="w-3 h-3" />,
    delete: <Trash2 className="w-3 h-3" />,
};

export default function ActivityFeed({ limit = 10 }: { limit?: number }) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch(`/api/admin/audit-logs?limit=${limit}`);
            const data = await response.json();

            if (data.data) {
                setActivities(data.data);
            }
        } catch (err) {
            setError("Không thể tải hoạt động");
            console.error("Failed to fetch activities:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [limit]);

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút`;
        if (diffHours < 24) return `${diffHours} giờ`;
        if (diffDays < 7) return `${diffDays} ngày`;
        return date.toLocaleDateString("vi-VN");
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "create":
                return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400";
            case "update":
                return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400";
            case "delete":
                return "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Hoạt động gần đây</h3>
                </div>
                <button
                    onClick={fetchActivities}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Làm mới"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-6 py-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                    <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        <p>{error}</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có hoạt động nào</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                                    {resourceIcons[activity.resource_type] || <Edit className="w-4 h-4" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        <span className="font-medium">{activity.user_email || "Hệ thống"}</span>
                                        {" "}
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {actionLabels[activity.action] || activity.action}
                                        </span>
                                        {" "}
                                        <span className="font-medium">
                                            {resourceLabels[activity.resource_type] || activity.resource_type}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {getTimeAgo(activity.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {activities.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <a
                        href="/dashboard/admin/audit"
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Xem tất cả hoạt động →
                    </a>
                </div>
            )}
        </div>
    );
}

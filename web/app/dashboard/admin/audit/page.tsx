"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    RefreshCw,
    User,
    Clock,
    FileText,
    ChevronLeft,
    ChevronRight,
    Download
} from "lucide-react";
import { exportToCSV } from "@/lib/export/exportUtils";

interface AuditLog {
    id: string;
    user_id: string | null;
    user_email: string | null;
    action: string;
    resource_type: string;
    resource_id: string | null;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    created_at: string;
}

const actionLabels: Record<string, string> = {
    create: "Tạo mới",
    update: "Cập nhật",
    delete: "Xóa",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    view: "Xem",
    export: "Xuất",
    import: "Nhập",
};

const resourceLabels: Record<string, string> = {
    student: "Học sinh",
    teacher: "Giáo viên",
    class: "Lớp học",
    grade: "Điểm",
    attendance: "Điểm danh",
    user: "Người dùng",
    settings: "Cài đặt",
};

const actionColors: Record<string, string> = {
    create: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    update: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    delete: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    login: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    logout: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export default function AuditLogsPage() {
    const { profile, loading: profileLoading } = useProfile();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [resourceFilter, setResourceFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

    // Check admin access
    useEffect(() => {
        if (!profileLoading && profile?.role !== "admin") {
            router.replace("/unauthorized");
        }
    }, [profile, profileLoading, router]);

    // Fetch logs
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: String(pageSize),
                offset: String((page - 1) * pageSize),
            });
            if (actionFilter) params.set("action", actionFilter);
            if (resourceFilter) params.set("resource_type", resourceFilter);

            const response = await apiFetch(`/api/admin/audit-logs?${params}`);
            const data = await response.json();

            if (data.data) {
                setLogs(data.data);
                setTotalCount(data.count || 0);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.role === "admin") {
            fetchLogs();
        }
    }, [profile, page, actionFilter, resourceFilter]);

    const handleExport = () => {
        const exportData = logs.map((log) => ({
            "Thời gian": new Date(log.created_at).toLocaleString("vi-VN"),
            "Email": log.user_email || "-",
            "Hành động": actionLabels[log.action] || log.action,
            "Loại": resourceLabels[log.resource_type] || log.resource_type,
            "ID": log.resource_id || "-",
        }));
        exportToCSV(exportData, `audit_logs_${new Date().toISOString().split("T")[0]}`);
    };

    const filteredLogs = logs.filter((log) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            log.user_email?.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower) ||
            log.resource_type.toLowerCase().includes(searchLower) ||
            log.resource_id?.toLowerCase().includes(searchLower)
        );
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (profile?.role !== "admin") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Nhật ký hoạt động
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Theo dõi tất cả hoạt động trong hệ thống
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchLogs}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Làm mới
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Xuất CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="">Tất cả hành động</option>
                        {Object.entries(actionLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={resourceFilter}
                        onChange={(e) => setResourceFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="">Tất cả loại</option>
                        {Object.entries(resourceLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Thời gian</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Người dùng</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Hành động</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Loại</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={5} className="px-6 py-4">
                                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            Không có dữ liệu nhật ký
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(log.created_at).toLocaleString("vi-VN")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                                                        {log.user_email || "Hệ thống"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${actionColors[log.action] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                                                    {actionLabels[log.action] || log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <FileText className="w-4 h-4" />
                                                    {resourceLabels[log.resource_type] || log.resource_type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    {log.resource_id ? `#${log.resource_id.slice(0, 8)}` : "-"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} / {totalCount} mục
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                    Trang {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

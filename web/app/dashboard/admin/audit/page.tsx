"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import {
    Search,
    RefreshCw,
    User,
    Clock,
    FileText,
    ChevronLeft,
    ChevronRight,
    Download,
    ArrowLeft
} from "lucide-react";
import { exportToCSV } from "@/lib/export/exportUtils";
import { usePermissions } from "@/hooks/usePermissions";
import PageGuard from "@/components/PageGuard";
import { AcademicBackground } from "@/components/Academic/AcademicBackground";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

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
    create: "bg-green-500/10 text-green-600 border border-green-500/20",
    update: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
    delete: "bg-red-500/10 text-red-600 border border-red-500/20",
    login: "bg-gold-accent/10 text-gold-accent border border-gold-accent/20",
    logout: "bg-stone-500/10 text-stone-600 border border-stone-500/20",
};

export default function AuditLogsPage() {
    return (
        <PageGuard permissions="system.audit">
            <AuditLogsContent />
        </PageGuard>
    );
}

function AuditLogsContent() {
    const { profile, loading: profileLoading } = useProfile();
    const { isAdmin } = usePermissions();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [resourceFilter, setResourceFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

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
        if (isAdmin) {
            fetchLogs();
        }
    }, [isAdmin, page, actionFilter, resourceFilter]);

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
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#080808]">
                <AcademicBackground />
                <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-sharp" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] selection:bg-red-600/30 text-stone-900 dark:text-stone-100 p-4 md:p-12 lg:p-16">
            <AcademicBackground />

            <div className="max-w-7xl mx-auto relative z-10 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 dark:border-stone-800 pb-10">
                    <div className="space-y-4">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Quay lại Dashboard</span>
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                            Nhật ký <span className="text-red-600">Hệ thống</span>
                        </h1>
                        <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">
                            AUDIT LOGS • TRANSACTIONAL HYPER-CONSISTENCY
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-3 px-6 py-3 glass-crystal rounded-sharp text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Làm mới
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-sharp text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-red-600/20"
                        >
                            <Download className="w-4 h-4" />
                            Xuất CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 group-focus-within:text-red-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="TÌM KIẾM TRUY XUẤT..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 glass-crystal rounded-sharp text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-red-600 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full px-6 py-4 glass-crystal rounded-sharp text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-red-600 appearance-none bg-transparent"
                        >
                            <option value="">TẤT CẢ HÀNH ĐỘNG</option>
                            {Object.entries(actionLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <select
                            value={resourceFilter}
                            onChange={(e) => setResourceFilter(e.target.value)}
                            className="w-full px-6 py-4 glass-crystal rounded-sharp text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-red-600 appearance-none bg-transparent"
                        >
                            <option value="">TẤT CẢ PHÂN LOẠI</option>
                            {Object.entries(resourceLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-crystal rounded-sharp border-none shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-widest text-[10px] font-bold">
                                    <th className="px-6 py-5 text-left">Thời gian</th>
                                    <th className="px-6 py-5 text-left">Tác nhân</th>
                                    <th className="px-6 py-5 text-left">Hành động</th>
                                    <th className="px-6 py-5 text-left">Đối tượng</th>
                                    <th className="px-6 py-5 text-left">Mã định danh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={5} className="px-6 py-8">
                                                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-sharp animate-pulse w-3/4 mx-auto" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.3em]">Không tìm thấy dữ liệu truy vấn</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3 text-xs font-bold text-stone-500">
                                                    <Clock className="w-3.5 h-3.5 text-red-600/50" />
                                                    {new Date(log.created_at).toLocaleString("vi-VN")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-sharp bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                                        <User className="w-4 h-4 text-stone-500 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <span className="text-sm font-bold truncate max-w-[200px]">
                                                        {log.user_email || "HỆ THỐNG"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-sharp text-[10px] font-bold uppercase tracking-widest ${actionColors[log.action] || "bg-stone-100 dark:bg-stone-800 text-stone-500"}`}>
                                                    {actionLabels[log.action] || log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {resourceLabels[log.resource_type] || log.resource_type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-mono text-stone-500 opacity-60">
                                                    {log.resource_id ? `#${log.resource_id.slice(0, 8).toUpperCase()}` : "-"}
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
                        <div className="px-8 py-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                                BẢN GHI {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} / {totalCount}
                            </p>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="p-3 glass-crystal rounded-sharp hover:bg-white/5 disabled:opacity-30 transition-all shadow-xl"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    TRANG {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="p-3 glass-crystal rounded-sharp hover:bg-white/5 disabled:opacity-30 transition-all shadow-xl"
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

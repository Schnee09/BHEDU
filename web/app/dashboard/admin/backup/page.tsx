"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import {
    Download,
    Upload,
    Database,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    HardDrive,
    RefreshCw,
} from "lucide-react";
import { exportToJSON } from "@/lib/export/exportUtils";

interface BackupInfo {
    id: string;
    name: string;
    size: string;
    createdAt: string;
    tables: string[];
}

export default function BackupPage() {
    const { profile, loading: profileLoading } = useProfile();
    const router = useRouter();

    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [backups] = useState<BackupInfo[]>([
        // Mock data - in production, fetch from API
        {
            id: "1",
            name: "backup_2024-12-30_manual",
            size: "2.4 MB",
            createdAt: "2024-12-30T10:00:00Z",
            tables: ["students", "classes", "grades", "attendance"],
        },
        {
            id: "2",
            name: "backup_2024-12-29_auto",
            size: "2.3 MB",
            createdAt: "2024-12-29T00:00:00Z",
            tables: ["students", "classes", "grades", "attendance"],
        },
    ]);

    // Check admin access
    if (!profileLoading && profile?.role !== "admin") {
        router.replace("/unauthorized");
        return null;
    }

    const handleExportData = async () => {
        setCreating(true);
        setMessage(null);

        try {
            // Fetch all data from API
            const response = await fetch("/api/admin/export-data");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Export failed");
            }

            // Download as JSON
            exportToJSON(data, `bh-edu-backup-${new Date().toISOString().split("T")[0]}`);
            setMessage({ type: "success", text: "Xuất dữ liệu thành công!" });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Không thể xuất dữ liệu",
            });
        } finally {
            setCreating(false);
        }
    };

    const handleRestore = async (backupId: string) => {
        if (!confirm("Bạn có chắc muốn khôi phục dữ liệu? Thao tác này sẽ ghi đè dữ liệu hiện tại.")) {
            return;
        }

        setRestoring(true);
        setMessage(null);

        try {
            // In production, call restore API
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setMessage({ type: "success", text: "Khôi phục dữ liệu thành công!" });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Không thể khôi phục dữ liệu",
            });
        } finally {
            setRestoring(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sao lưu & Khôi phục</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Quản lý sao lưu dữ liệu hệ thống</p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                            }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <p
                            className={
                                message.type === "success"
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                            }
                        >
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                <Download className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Xuất dữ liệu</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tải về bản sao lưu JSON</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={creating}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xuất...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Tạo bản sao lưu
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Khôi phục dữ liệu</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Nhập từ file JSON</p>
                            </div>
                        </div>
                        <label className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Chọn file khôi phục
                            <input type="file" accept=".json" className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Database Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Thông tin cơ sở dữ liệu</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Bảng dữ liệu</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">~2.5 MB</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Kích thước</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">Supabase</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nhà cung cấp</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">Online</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</p>
                        </div>
                    </div>
                </div>

                {/* Backup History */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HardDrive className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lịch sử sao lưu</h2>
                        </div>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <RefreshCw className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {backups.map((backup) => (
                            <div key={backup.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{backup.name}</p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(backup.createdAt).toLocaleString("vi-VN")}
                                                </span>
                                                <span>{backup.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(backup.id)}
                                        disabled={restoring}
                                        className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Khôi phục
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Warning */}
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Lưu ý quan trọng</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Sao lưu thủ công được khuyến nghị trước khi thực hiện các thay đổi lớn.
                                Việc khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

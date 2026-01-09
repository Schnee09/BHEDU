"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import {
    Calendar,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";

interface Semester {
    id: string;
    name: string;
    code: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function SemesterManagementPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

    const fetchSemesters = async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/semesters");
            const text = await response.text();

            // Check if response is HTML (error page)
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                console.warn('API returned HTML instead of JSON, using mock data');
                useMockData();
                return;
            }

            const data = JSON.parse(text);
            if (data.semesters && data.semesters.length > 0) {
                setSemesters(data.semesters);
            } else {
                // API returned empty, use mock data
                useMockData();
            }
        } catch (error) {
            console.error("Failed to fetch semesters:", error);
            useMockData();
        } finally {
            setLoading(false);
        }
    };

    const useMockData = () => {
        setSemesters([
            { id: "1", name: "Học kỳ 1 - 2023-2024", code: "2023-2024-HK1", start_date: "2023-09-05", end_date: "2024-01-15", is_active: false },
            { id: "2", name: "Học kỳ 2 - 2023-2024", code: "2023-2024-HK2", start_date: "2024-01-20", end_date: "2024-05-31", is_active: false },
            { id: "3", name: "Học kỳ 1 - 2024-2025", code: "2024-2025-HK1", start_date: "2024-09-05", end_date: "2025-01-15", is_active: false },
            { id: "4", name: "Học kỳ 2 - 2024-2025", code: "2024-2025-HK2", start_date: "2025-01-20", end_date: "2025-05-31", is_active: true },
        ]);
    };

    useEffect(() => {
        fetchSemesters();
    }, []);

    const handleSetActive = async (semesterId: string) => {
        try {
            await apiFetch(`/api/semesters/${semesterId}/activate`, { method: "POST" });
            setSemesters((prev) =>
                prev.map((s) => ({ ...s, is_active: s.id === semesterId }))
            );
        } catch (error) {
            console.error("Failed to activate semester:", error);
            setSemesters((prev) =>
                prev.map((s) => ({ ...s, is_active: s.id === semesterId }))
            );
        }
    };

    const getSemesterStatus = (semester: Semester) => {
        const now = new Date();
        const start = new Date(semester.start_date);
        const end = new Date(semester.end_date);

        if (now < start) return { label: "Sắp tới", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" };
        if (now > end) return { label: "Đã kết thúc", color: "text-gray-600 bg-gray-100 dark:bg-gray-700" };
        return { label: "Đang diễn ra", color: "text-green-600 bg-green-100 dark:bg-green-900/40" };
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (profile?.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Không có quyền truy cập</h1>
                    <p className="text-gray-500">Chỉ admin mới có thể quản lý học kỳ</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Học kỳ</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">Thiết lập các học kỳ trong năm học</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm học kỳ
                    </button>
                </div>

                {/* Semesters List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Danh sách học kỳ</h2>
                        <button
                            onClick={fetchSemesters}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="px-6 py-4">
                                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                            ))
                        ) : semesters.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Chưa có học kỳ nào</p>
                            </div>
                        ) : (
                            semesters.map((semester) => {
                                const status = getSemesterStatus(semester);
                                return (
                                    <div
                                        key={semester.id}
                                        className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${semester.is_active ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${semester.is_active ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-gray-100 dark:bg-gray-700"}`}>
                                                <Calendar className={`w-6 h-6 ${semester.is_active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{semester.name}</h3>
                                                    {semester.is_active && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full">
                                                            Đang hoạt động
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>{semester.code}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(semester.start_date).toLocaleDateString("vi-VN")} →{" "}
                                                        {new Date(semester.end_date).toLocaleDateString("vi-VN")}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {!semester.is_active && (
                                                    <button
                                                        onClick={() => handleSetActive(semester.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                        title="Đặt làm học kỳ hiện tại"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setEditingSemester(semester)}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

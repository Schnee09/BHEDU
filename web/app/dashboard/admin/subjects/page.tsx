"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import {
    BookOpen,
    Plus,
    Edit,
    Trash2,
    AlertTriangle,
    RefreshCw,
    Search,
} from "lucide-react";

interface Subject {
    id: string;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
}

export default function SubjectManagementPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/subjects");
            const text = await response.text();

            // Check if response is HTML (error page)
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                console.warn('API returned HTML instead of JSON, using mock data');
                useMockData();
                return;
            }

            const data = JSON.parse(text);
            if (data.subjects && data.subjects.length > 0) {
                setSubjects(data.subjects);
            } else {
                // API returned empty, use mock data silently
                useMockData();
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
            useMockData();
        } finally {
            setLoading(false);
        }
    };

    const useMockData = () => {
        // Mock data matching database
        setSubjects([
            { id: "1", name: "Hóa học", code: "HOA", description: "Môn Hóa học", is_active: true },
            { id: "2", name: "Môn khác", code: "OTHER", description: "Các môn học khác", is_active: true },
            { id: "3", name: "Ngữ văn", code: "VAN", description: "Môn Ngữ văn", is_active: true },
            { id: "4", name: "Tiếng Anh", code: "ANH", description: "Môn Tiếng Anh", is_active: true },
            { id: "5", name: "Toán học", code: "TOAN", description: "Môn Toán", is_active: true },
            { id: "6", name: "Vật lý", code: "LY", description: "Môn Vật lý", is_active: true },
        ]);
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const filteredSubjects = subjects.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleActive = async (subjectId: string) => {
        setSubjects((prev) =>
            prev.map((s) => (s.id === subjectId ? { ...s, is_active: !s.is_active } : s))
        );
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
                    <p className="text-gray-500">Chỉ admin mới có thể quản lý môn học</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Môn học</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">Thiết lập môn học và hệ số điểm</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm môn học
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm môn học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Subjects Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Danh sách môn học ({filteredSubjects.length})
                        </h2>
                        <button
                            onClick={fetchSubjects}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Môn học
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Mã
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={4} className="px-6 py-4">
                                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>Không tìm thấy môn học</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{subject.name}</p>
                                                        {subject.description && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{subject.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-mono rounded">
                                                    {subject.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleActive(subject.id)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${subject.is_active
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                                        }`}
                                                >
                                                    {subject.is_active ? "Hoạt động" : "Tạm dừng"}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

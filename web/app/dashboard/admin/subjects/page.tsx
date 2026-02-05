"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import {
    BookOpen,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Search,
    ShieldAlert,
    X,
    Save
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";

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
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    const { isStaff } = usePermissions();
    const toast = useToast();

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/subjects");
            const data = await response.json();
            if (data.subjects) {
                setSubjects(data.subjects);
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
            toast.error("Lỗi", "Không thể tải danh sách môn học");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const filteredSubjects = subjects.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleActive = async (subject: Subject) => {
        try {
            const response = await apiFetch(`/api/subjects/${subject.id}`, {
                method: 'PUT',
                body: JSON.stringify({ ...subject, isActive: !subject.is_active })
            });

            if (response.ok) {
                setSubjects((prev) =>
                    prev.map((s) => (s.id === subject.id ? { ...s, is_active: !s.is_active } : s))
                );
                toast.success("Thành công", `Đã ${!subject.is_active ? 'kích hoạt' : 'vô hiệu hóa'} môn học`);
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            console.error("Details:", error);
            toast.error("Lỗi", "Không thể cập nhật trạng thái");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) return;

        try {
            // Use hard delete (?hard=true) because soft delete (is_active) is not yet supported by DB schema
            const response = await apiFetch(`/api/subjects/${id}?hard=true`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSubjects(prev => prev.filter(s => s.id !== id));
                toast.success("Thành công", "Đã xóa môn học");
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi", "Không thể xóa môn học");
        }
    };

    const handleOpenModal = (subject?: Subject) => {
        if (subject) {
            setModalMode('edit');
            setSelectedSubject(subject);
            setFormData({
                name: subject.name,
                code: subject.code,
                description: subject.description || '',
                is_active: subject.is_active
            });
        } else {
            setModalMode('create');
            setSelectedSubject(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = modalMode === 'create' ? '/api/subjects' : `/api/subjects/${selectedSubject?.id}`;
            const method = modalMode === 'create' ? 'POST' : 'PUT';

            const response = await apiFetch(url, {
                method,
                body: JSON.stringify({
                    ...formData,
                    isActive: formData.is_active // Map back to API expectation
                })
            });

            if (response.ok) {
                toast.success("Thành công", modalMode === 'create' ? "Đã thêm môn học mới" : "Đã cập nhật môn học");
                setShowModal(false);
                fetchSubjects();
            } else {
                throw new Error('Operation failed');
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi", "Đã xảy ra lỗi khi lưu");
        } finally {
            setSaving(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isStaff) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Không có quyền truy cập</h1>
                    <p className="text-gray-500">Bạn không có quyền quản lý môn học. Vui lòng liên hệ quản trị viên.</p>
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
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
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
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </div>

                {/* Subjects Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Danh sách môn học ({filteredSubjects.length})
                        </h2>
                        <button
                            onClick={fetchSubjects}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                                            <td colSpan={5} className="px-6 py-4">
                                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>Không tìm thấy môn học</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{subject.name}</p>
                                                        {subject.description && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{subject.description}</p>
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
                                                    onClick={() => toggleActive(subject)}
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
                                                    <button
                                                        onClick={() => handleOpenModal(subject)}
                                                        className="p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(subject.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
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

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {modalMode === 'create' ? 'Thêm môn học mới' : 'Chỉnh sửa môn học'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tên môn học <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Ví dụ: Toán học"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Mã môn <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                                            placeholder="TOAN"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Mô tả
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Mô tả chi tiết về môn học..."
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Đang hoạt động
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

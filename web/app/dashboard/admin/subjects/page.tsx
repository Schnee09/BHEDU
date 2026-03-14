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
    Save,
    LayoutGrid,
    List as ListIcon,
    CheckCircle2,
    PauseCircle,
    MoreVertical,
    FileText
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
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [saving, setSaving] = useState(false);

    const stats = {
        total: subjects.length,
        active: subjects.filter(s => s.is_active).length,
        inactive: subjects.filter(s => !s.is_active).length
    };

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
                body: JSON.stringify(formData)
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
        <div className="min-h-screen bg-transparent relative overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 relative z-10">
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

                {/* Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng số môn học</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Đang hoạt động</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                <PauseCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tạm dừng</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm môn học theo tên hoặc mã..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                            title="Chế độ bảng"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                            title="Chế độ lưới"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Subjects Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Môn học
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Mã
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="h-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl animate-pulse" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredSubjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-4">
                                                        <Search className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy môn học nào</p>
                                                    <p className="text-sm text-gray-400">Thử thay đổi từ khóa tìm kiếm của bạn</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSubjects.map((subject) => (
                                            <tr key={subject.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 rounded-xl transition-colors ${subject.is_active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'bg-gray-50 text-gray-400 dark:bg-gray-700'}`}>
                                                            <BookOpen className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {subject.name}
                                                            </p>
                                                            {subject.description && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                                    {subject.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg tracking-wider">
                                                        {subject.code}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => toggleActive(subject)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${subject.is_active
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50"
                                                                : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-400 dark:border-gray-600/50"
                                                                }`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${subject.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                                            {subject.is_active ? "Hoạt động" : "Tạm dừng"}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenModal(subject)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-400 rounded-xl transition-all"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(subject.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all"
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
                    ) : (
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-40 bg-gray-50 dark:bg-gray-700/50 rounded-2xl animate-pulse" />
                                ))
                            ) : filteredSubjects.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy môn học nào</p>
                                </div>
                            ) : (
                                filteredSubjects.map((subject) => (
                                    <div key={subject.id} className="group relative bg-gray-50/50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-6 transition-all hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${subject.is_active ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-700'}`}>
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(subject)}
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-sm transition-all"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-sm transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{subject.name}</h3>
                                                <code className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-bold uppercase tracking-wider">
                                                    {subject.code}
                                                </code>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 mb-4">
                                                {subject.description || "Không có mô tả"}
                                            </p>
                                            <button
                                                onClick={() => toggleActive(subject)}
                                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${subject.is_active
                                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${subject.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                                {subject.is_active ? "Đang hoạt động" : "Đã tạm dừng"}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
                        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {modalMode === 'create' ? "Thêm môn học mới" : "Chỉnh sửa môn học"}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {modalMode === 'create' ? "Nhập thông tin chi tiết cho môn học mới" : "Cập nhật thông tin môn học hiện tại"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                    disabled={saving}
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                            Tên môn học <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ví dụ: Toán học, Ngữ văn..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                            Mã môn học <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="Ví dụ: MATH, LIT..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                            Mô tả
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Nhập mô tả ngắn gọn về môn học..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-200">Trạng thái hoạt động</p>
                                            <p className="text-xs text-gray-500">Môn học sẽ hiển thị trong hệ thống</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${formData.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                                        disabled={saving}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        disabled={saving}
                                    >
                                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {modalMode === 'create' ? "Thêm mới" : "Cập nhật"}
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

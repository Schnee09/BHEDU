"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    GraduationCap,
    Phone,
    Mail,
    BookOpen,
    DollarSign,
    X
} from "lucide-react";

interface Tutor {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    teacher_type: string;
    specialization: string | null;
    teaching_subjects: string[];
    hourly_rate: number | null;
    bio: string | null;
}

interface Subject {
    id: string;
    name: string;
}

export default function TutorsPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        specialization: "",
        teaching_subjects: [] as string[],
        hourly_rate: "",
        bio: ""
    });

    const isAdmin = profile?.role === "admin" || profile?.role === "staff";

    const fetchTutors = async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/tutors");
            const data = await response.json();
            setTutors(data.tutors || []);
        } catch (error) {
            console.error("Failed to fetch tutors:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await apiFetch("/api/subjects");
            const data = await response.json();
            setSubjects(data.subjects || []);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        }
    };

    useEffect(() => {
        fetchTutors();
        fetchSubjects();
    }, []);

    const openCreateModal = () => {
        setEditingTutor(null);
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            specialization: "",
            teaching_subjects: [],
            hourly_rate: "",
            bio: ""
        });
        setShowModal(true);
    };

    const openEditModal = (tutor: Tutor) => {
        setEditingTutor(tutor);
        setFormData({
            full_name: tutor.full_name || "",
            email: tutor.email || "",
            phone: tutor.phone || "",
            specialization: tutor.specialization || "",
            teaching_subjects: tutor.teaching_subjects || [],
            hourly_rate: tutor.hourly_rate?.toString() || "",
            bio: tutor.bio || ""
        });
        setShowModal(true);
    };

    const saveTutor = async () => {
        if (!formData.full_name.trim()) {
            alert("Vui lòng nhập tên gia sư");
            return;
        }

        setSaving(true);
        try {
            const url = editingTutor ? `/api/tutors/${editingTutor.id}` : "/api/tutors";
            const method = editingTutor ? "PUT" : "POST";

            const response = await apiFetch(url, {
                method,
                body: JSON.stringify({
                    ...formData,
                    hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
                }),
                headers: { "Content-Type": "application/json" }
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || "Failed to save");
            }

            await fetchTutors();
            setShowModal(false);
            setEditingTutor(null);
        } catch (error) {
            console.error("Failed to save tutor:", error);
            alert("Không thể lưu gia sư. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const deleteTutor = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa gia sư này?")) return;

        try {
            const response = await apiFetch(`/api/tutors/${id}`, { method: "DELETE" });
            const result = await response.json();
            if (result.success) {
                await fetchTutors();
            }
        } catch (error) {
            console.error("Failed to delete tutor:", error);
        }
    };

    const toggleSubject = (subjectId: string) => {
        setFormData(prev => ({
            ...prev,
            teaching_subjects: prev.teaching_subjects.includes(subjectId)
                ? prev.teaching_subjects.filter(id => id !== subjectId)
                : [...prev.teaching_subjects, subjectId]
        }));
    };

    const filteredTutors = tutors.filter(tutor =>
        tutor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Bạn không có quyền truy cập trang này</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <GraduationCap className="w-8 h-8 text-purple-600" />
                        Quản lý Gia sư
                    </h1>
                    <p className="text-gray-500 mt-1">Quản lý danh sách sinh viên dạy kèm</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Thêm gia sư
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm gia sư theo tên, email, môn dạy..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="text-2xl font-bold text-purple-700">{tutors.length}</div>
                    <div className="text-sm text-purple-600">Tổng số gia sư</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="text-2xl font-bold text-green-700">
                        {tutors.filter(t => t.teaching_subjects?.length > 0).length}
                    </div>
                    <div className="text-sm text-green-600">Có môn dạy</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">
                        {tutors.filter(t => t.hourly_rate).length}
                    </div>
                    <div className="text-sm text-blue-600">Có mức lương</div>
                </div>
            </div>

            {/* Tutor Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
                    <p className="mt-4 text-gray-500">Đang tải...</p>
                </div>
            ) : filteredTutors.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                        {searchQuery ? "Không tìm thấy gia sư nào" : "Chưa có gia sư nào"}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Thêm gia sư đầu tiên
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTutors.map((tutor) => (
                        <div
                            key={tutor.id}
                            className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                        {tutor.photo_url ? (
                                            <img
                                                src={tutor.photo_url}
                                                alt={tutor.full_name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <GraduationCap className="w-6 h-6 text-purple-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{tutor.full_name}</h3>
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                            Gia sư
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditModal(tutor)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteTutor(tutor.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {tutor.email && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {tutor.email}
                                    </div>
                                )}
                                {tutor.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {tutor.phone}
                                    </div>
                                )}
                                {tutor.specialization && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        {tutor.specialization}
                                    </div>
                                )}
                                {tutor.hourly_rate && (
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                        <DollarSign className="w-4 h-4" />
                                        {tutor.hourly_rate.toLocaleString('vi-VN')}đ/giờ
                                    </div>
                                )}
                            </div>

                            {tutor.bio && (
                                <p className="mt-3 text-sm text-gray-500 italic line-clamp-2">{tutor.bio}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold">
                                {editingTutor ? "Chỉnh sửa gia sư" : "Thêm gia sư mới"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            {/* Contact */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="0901234567"
                                    />
                                </div>
                            </div>

                            {/* Specialization */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Môn có thể dạy
                                </label>
                                <input
                                    type="text"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Toán, Lý, Hóa..."
                                />
                            </div>

                            {/* Teaching Subjects (checkboxes) */}
                            {subjects.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn môn từ danh sách
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {subjects.map(subject => (
                                            <button
                                                key={subject.id}
                                                type="button"
                                                onClick={() => toggleSubject(subject.id)}
                                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${formData.teaching_subjects.includes(subject.id)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {subject.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hourly Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mức lương (VNĐ/giờ)
                                </label>
                                <input
                                    type="number"
                                    value={formData.hourly_rate}
                                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="50000"
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giới thiệu
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg resize-none"
                                    rows={3}
                                    placeholder="Sinh viên năm 3, chuyên ngành..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={saveTutor}
                                disabled={saving || !formData.full_name.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                {saving ? "Đang lưu..." : editingTutor ? "Cập nhật" : "Thêm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

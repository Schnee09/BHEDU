'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    Button,
    Input,
    Card,
    Badge
} from '@/components/ui';
import { Select, Textarea, Checkbox } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { generateUserEmailSlug, splitFullName, formatVietnameseName } from '@/lib/utils/names';

// Constants from common schema/enums
const roleOptions = [
    { value: 'student', label: 'Học sinh' },
    { value: 'teacher', label: 'Giáo viên' },
    { value: 'tutor', label: 'Gia sư' },
    { value: 'parent', label: 'Phụ huynh' },
    { value: 'staff', label: 'Nhân viên' },
];

const gradeLevelOptions = [
    { value: 'Lớp 6', label: 'Lớp 6' },
    { value: 'Lớp 7', label: 'Lớp 7' },
    { value: 'Lớp 8', label: 'Lớp 8' },
    { value: 'Lớp 9', label: 'Lớp 9' },
    { value: 'Lớp 10', label: 'Lớp 10' },
    { value: 'Lớp 11', label: 'Lớp 11' },
    { value: 'Lớp 12', label: 'Lớp 12' },
];

const genderOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
];

// Helpers will now primarily be used for PREVIEW
function generateStrongPassword(length = 10): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return retVal + "A1!";
}

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user?: any; // If provided, mode is 'edit'
}

export default function UserFormModal({ isOpen, onClose, onSuccess, user }: UserFormModalProps) {
    const toast = useToast();
    const isEdit = !!user;

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'student',
        phone: '',
        address: '',
        personal_email: '',
        is_active: true,
        is_managed: true,
        // Role specific
        student_code: '',
        student_id: '',
        teacher_code: '',
        grade_level: 'Lớp 10',
        gender: 'male',
        department: '',
        teacher_type: 'full_time',
        specialization: '',
        hourly_rate: 0,
        notes: ''
    });

    const [isQuickMode, setIsQuickMode] = useState(!user);

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [createdUserInfo, setCreatedUserInfo] = useState<any>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<any[]>([]);

    // Fetch subjects for teachers/staff/tutors
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await apiFetch('/api/subjects');
                const data = await response.json();
                if (data.success) {
                    setSubjects(data.subjects || []);
                }
            } catch (err) {
                logger.error('Failed to fetch subjects', err);
            }
        };
        fetchSubjects();
    }, []);

    // Initialize form
    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({
                    full_name: user.full_name || '',
                    email: user.email || '',
                    password: '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    role: user.role || 'student',
                    phone: user.phone || '',
                    address: user.address || '',
                    personal_email: user.personal_email || '',
                    is_active: user.is_active ?? true,
                    is_managed: user.is_managed ?? true,
                    student_code: user.student_code || '',
                    student_id: user.student_id || '',
                    teacher_code: user.teacher_code || '',
                    grade_level: user.grade_level || 'Lớp 10',
                    gender: user.gender || 'male',
                    department: user.department || '',
                    teacher_type: user.teacher_type || 'full_time',
                    specialization: user.specialization || '',
                    hourly_rate: user.hourly_rate || 0,
                    notes: user.notes || ''
                });
            } else {
                const initialPass = generateStrongPassword(10);
                setFormData({
                    full_name: '',
                    email: '(Sẽ tự động tạo theo mã HS)',
                    password: initialPass,
                    first_name: '',
                    last_name: '',
                    role: 'student',
                    phone: '',
                    address: '',
                    personal_email: '',
                    is_active: true,
                    is_managed: true,
                    student_code: '',
                    student_id: '',
                    teacher_code: '',
                    grade_level: 'Lớp 10',
                    gender: 'male',
                    department: '',
                    teacher_type: 'full_time',
                    specialization: '',
                    hourly_rate: 0,
                    notes: ''
                });
            }
            setCreatedUserInfo(null);
        }
    }, [isOpen, user]);

    const handleNameChange = (name: string) => {
        const { first_name, last_name } = splitFullName(name);
        setFormData(prev => {
            const updates: any = {
                full_name: name,
                first_name: first_name,
                last_name: last_name
            };

            // Auto-generate preview email if not in edit mode and email is empty or manual-like
            if (!isEdit && (!prev.email || prev.email.includes('@bhedu.vn') || prev.email.includes('@student.bhedu.vn'))) {
                if (prev.role === 'student') {
                    // We don't have code yet unless manual, so we keep HS... template
                    if (!prev.student_code) {
                        updates.email = '(Sẽ tự động tạo theo mã HS)';
                    }
                } else if (name.trim()) {
                    const slug = generateUserEmailSlug(name);
                    updates.email = `${slug}@bhedu.vn`;
                }
            }
            return { ...prev, ...updates };
        });
    };

    const handleRoleChange = (role: string) => {
        setFormData(prev => {
            const updates: any = { role: role };
            if (role === 'student') {
                updates.email = prev.student_code ? `${prev.student_code.toLowerCase()}@student.bhedu.vn` : '(Sẽ tự động tạo theo mã HS)';
            } else if (prev.full_name) {
                const slug = generateUserEmailSlug(prev.full_name);
                updates.email = `${slug}@bhedu.vn`;
            }
            return { ...prev, ...updates };
        });
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success('Đã sao chép', `${field} đã được lưu vào bộ nhớ tạm`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEdit ? `/api/admin/users/${user.id}` : '/api/admin/users';
            const method = isEdit ? 'PUT' : 'POST';

            // Basic validation
            if (!formData.email || (!isEdit && !formData.password) || (!formData.full_name && !formData.first_name)) {
                throw new Error('Vui lòng điền đầy đủ các thông tin bắt buộc (Email, Mật khẩu, Họ và tên)');
            }

            const payload = { ...formData };
            // Sanitize optional fields: convert empty strings to undefined so Zod treats them as omitted
            const textFields = ['phone', 'personal_email', 'address', 'specialization', 'department', 'notes', 'student_code', 'student_id', 'teacher_code'];
            textFields.forEach(field => {
                if ((payload as any)[field] === '') {
                    (payload as any)[field] = undefined;
                }
            });

            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    // If email or password are placeholders/empty and we're in quick mode, 
                    // let backend handle them
                    email: (payload.email && !payload.email.startsWith('(')) ? payload.email : undefined,
                    password: payload.password || undefined
                })
            });

            const data = await response.json();

            if (data.success) {
                if (!isEdit) {
                    setCreatedUserInfo({
                        ...data.data,
                        password: formData.password
                    });
                    toast.success('Thành công', 'Người dùng đã được tạo');
                } else {
                    toast.success('Thành công', 'Thông tin đã được cập nhật');
                    onSuccess();
                }
            } else {
                throw new Error(data.error || 'Có lỗi xảy ra');
            }
        } catch (err: any) {
            logger.error('User form error', err, {
                formData,
                isEdit,
                roles: roleOptions.map(r => r.value)
            });
            toast.error('Lỗi', err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const renderDigitalReceipt = () => (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center py-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <Icons.Success className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-black text-stone-900 dark:text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Tài khoản đã sẵn sàng!
                </h3>
                <p className="text-stone-500 dark:text-stone-400 mt-2">Gửi các thông tin này cho {createdUserInfo?.first_name}</p>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative bg-white dark:bg-[#1A1A1A] border-stone-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-stone-100 dark:border-white/5 pb-3">
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Họ và tên</span>
                            <span className="font-bold text-stone-900 dark:text-white">{createdUserInfo?.first_name} {createdUserInfo?.last_name}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-stone-100 dark:border-white/5 pb-3">
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Email đăng nhập</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm truncate max-w-[180px]">{createdUserInfo?.email}</span>
                                <button onClick={() => copyToClipboard(createdUserInfo?.email, 'Email')} className="p-1 hover:bg-stone-100 dark:hover:bg-white/5 rounded transition-colors">
                                    {copiedField === 'Email' ? <Icons.Check className="w-4 h-4 text-green-500" /> : <Icons.Copy className="w-4 h-4 text-stone-400" />}
                                </button>
                            </div>
                        </div>

                        {createdUserInfo?.student_code && (
                            <div className="flex justify-between items-center border-b border-stone-100 dark:border-white/5 pb-3">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">UID (Mã truy cập)</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-500">{createdUserInfo?.student_code}</span>
                                    <button onClick={() => copyToClipboard(createdUserInfo?.student_code, 'UID')} className="p-1 hover:bg-stone-100 dark:hover:bg-white/5 rounded transition-colors">
                                        {copiedField === 'UID' ? <Icons.Check className="w-4 h-4 text-green-500" /> : <Icons.Copy className="w-4 h-4 text-stone-400" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {createdUserInfo?.teacher_code && (
                            <div className="flex justify-between items-center border-b border-stone-100 dark:border-white/5 pb-3">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">UID (Mã tài khoản)</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-500">{createdUserInfo?.teacher_code}</span>
                                    <button onClick={() => copyToClipboard(createdUserInfo?.teacher_code, 'UID')} className="p-1 hover:bg-stone-100 dark:hover:bg-white/5 rounded transition-colors">
                                        {copiedField === 'UID' ? <Icons.Check className="w-4 h-4 text-green-500" /> : <Icons.Copy className="w-4 h-4 text-stone-400" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {createdUserInfo?.student_id && (
                            <div className="flex justify-between items-center border-b border-stone-100 dark:border-white/5 pb-3">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">CID (Mã định danh)</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-500">{createdUserInfo?.student_id}</span>
                                    <button onClick={() => copyToClipboard(createdUserInfo?.student_id, 'CID')} className="p-1 hover:bg-stone-100 dark:hover:bg-white/5 rounded transition-colors">
                                        {copiedField === 'CID' ? <Icons.Check className="w-4 h-4 text-green-500" /> : <Icons.Copy className="w-4 h-4 text-stone-400" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pb-1">
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Mật khẩu tạm thời</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                                    {createdUserInfo?.password}
                                </span>
                                <button onClick={() => copyToClipboard(createdUserInfo?.password || '', 'Mật khẩu')} className="p-1 hover:bg-stone-100 dark:hover:bg-white/5 rounded transition-colors">
                                    {copiedField === 'Mật khẩu' ? <Icons.Check className="w-4 h-4 text-green-500" /> : <Icons.Copy className="w-4 h-4 text-stone-400" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-stone-900 dark:bg-black p-3 text-center">
                        <p className="text-[10px] text-white/50 font-medium uppercase tracking-[0.2em]">Cung cấp bởi BH-EDU Orchestration V2</p>
                    </div>
                </Card>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20 flex gap-3">
                <Icons.Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Tài khoản này đã được kích hoạt. Email chào mừng đã được gửi tới <strong>{createdUserInfo?.email}</strong>
                    {createdUserInfo?.personal_email ? ` và ${createdUserInfo.personal_email}` : ''}.
                </p>
            </div>

            <Button variant="success" fullWidth size="lg" onClick={onSuccess} className="rounded-xl h-14 text-lg shadow-xl shadow-success/10 font-bold">
                Hoàn tất & Quay lại
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={createdUserInfo ? "Hoàn tất tạo người dùng" : (isEdit ? `Chỉnh sửa: ${user.full_name}` : "Thêm người dùng mới")}
            size="lg"
            footer={!createdUserInfo ? (
                <div className="flex gap-3 justify-end w-full">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl font-bold">
                        Hủy bỏ
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleSubmit}
                        isLoading={loading}
                        leftIcon={isEdit ? <Icons.Save className="w-4 h-4" /> : <Icons.Add className="w-4 h-4" />}
                        className="rounded-xl px-10 shadow-lg shadow-emerald-600/20 font-bold"
                    >
                        {isEdit ? 'Lưu thay đổi' : 'Tạo người dùng'}
                    </Button>
                </div>
            ) : null}
        >
            {createdUserInfo ? renderDigitalReceipt() : (
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                    {/* Modern Toggle Header */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 bg-emerald-600 rounded-full"></div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                                {isQuickMode ? 'Tạo nhanh' : 'Chi tiết thông tin'}
                            </h4>
                        </div>
                        {!isEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsQuickMode(!isQuickMode)}
                                className="text-stone-400 hover:text-emerald-600 text-[10px] font-bold h-8 px-2"
                                type="button"
                            >
                                {isQuickMode ? 'Mở rộng thông tin' : 'Thu gọn biểu mẫu'}
                            </Button>
                        )}
                    </div>

                    {isQuickMode ? (
                        <div className="space-y-6 py-2">
                            <Input
                                label="Họ và tên"
                                required
                                placeholder="Nguyễn Cao Quốc Bảo"
                                value={formData.full_name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="text-lg font-bold h-12"
                                autoFocus
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Vai trò"
                                    required
                                    options={roleOptions}
                                    value={formData.role}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                />
                                {formData.role === 'student' && (
                                    <Select
                                        label="Khối lớp"
                                        options={gradeLevelOptions}
                                        value={formData.grade_level}
                                        onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                                    />
                                )}
                                {(formData.role === 'teacher' || formData.role === 'tutor' || formData.role === 'staff') && (
                                    <Select
                                        label={formData.role === 'staff' ? "Bộ phận / Môn học" : "Môn học phụ trách"}
                                        options={subjects.map(s => ({ value: s.name, label: s.name }))}
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="Chọn môn học..."
                                    />
                                )}
                            </div>

                            {/* Live Preview Card */}
                            <div className="relative group transition-all duration-300">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-stone-100 to-stone-200 dark:from-white/5 dark:to-white/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <div className="relative bg-white dark:bg-[#1A1A1A] border border-stone-100 dark:border-white/5 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between border-b border-stone-50 dark:border-white/5 pb-2">
                                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Xem trước tài khoản</span>
                                        <Badge variant="blue" className="text-[9px] font-medium opacity-70">Tự động khởi tạo</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-stone-400">Tên đăng nhập:</span>
                                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                                                {formData.email}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-stone-400">Mật khẩu:</span>
                                            <span className="font-mono font-medium text-stone-300 dark:text-stone-600">•••••••• (Kích hoạt sau)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                                <Icons.Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-tight">
                                    Các thông tin khác có thể được bổ sung sau trong trang chi tiết hồ sơ.
                                    Mật khẩu sẽ được hiển thị ngay sau khi tạo thành công.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Identity Section */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Họ"
                                        required
                                        placeholder="Nguyễn"
                                        value={formData.last_name}
                                        onChange={(e) => {
                                            const newLastName = e.target.value;
                                            setFormData({
                                                ...formData,
                                                last_name: newLastName,
                                                full_name: formatVietnameseName(formData.first_name, newLastName)
                                            });
                                        }}
                                    />
                                    <Input
                                        label="Tên"
                                        required
                                        placeholder="Văn A"
                                        value={formData.first_name}
                                        onChange={(e) => {
                                            const newFirstName = e.target.value;
                                            setFormData({
                                                ...formData,
                                                first_name: newFirstName,
                                                full_name: formatVietnameseName(newFirstName, formData.last_name)
                                            });
                                        }}
                                    />
                                </div>

                                <Select
                                    label="Vai trò hệ thống"
                                    required
                                    options={roleOptions}
                                    value={formData.role}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Email đăng nhập / Tài khoản"
                                        required
                                        placeholder="username@domain.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        leftIcon={<Icons.Mail className="w-4 h-4" />}
                                        hint={formData.role === 'student' ? "Dùng làm tên đăng nhập chính" : ""}
                                    />

                                    {!isEdit && (
                                        <div className="relative">
                                            <Input
                                                label="Mật khẩu khởi tạo"
                                                required
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                leftIcon={<Icons.Lock className="w-4 h-4" />}
                                                rightIcon={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="hover:text-amber-500 transition-colors p-1"
                                                    >
                                                        {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                    </button>
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, password: generateStrongPassword(10) })}
                                                className="absolute right-10 top-[38px] text-stone-400 hover:text-blue-500 transition-colors p-1"
                                                title="Tạo mật khẩu ngẫu nhiên"
                                            >
                                                <Icons.Refresh className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Role Specific Section */}
                            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">Thông tin vai trò</h4>
                                </div>

                                {formData.role === 'student' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="UID (Mã truy cập)"
                                                placeholder="HS2026..."
                                                value={formData.student_code}
                                                onChange={(e) => setFormData({ ...formData, student_code: e.target.value.toUpperCase() })}
                                                hint="Dùng để đăng nhập và định danh hệ thống"
                                            />
                                            <Input
                                                label="CID (Mã định danh)"
                                                placeholder="001205..."
                                                value={formData.student_id}
                                                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                                hint="Mã định danh cá nhân / Thẻ học sinh"
                                            />
                                        </div>
                                        <div className="w-full">
                                            <Select
                                                label="Khối lớp"
                                                options={gradeLevelOptions}
                                                value={formData.grade_level}
                                                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}

                                {(formData.role === 'teacher' || formData.role === 'tutor' || formData.role === 'staff') && (
                                    <div className="w-full mb-4">
                                        <Input
                                            label="UID (Mã tài khoản)"
                                            placeholder="GV2026..."
                                            value={formData.teacher_code}
                                            onChange={(e) => setFormData({ ...formData, teacher_code: e.target.value.toUpperCase() })}
                                            hint="Mã số nhân viên / Giảng viên dùng để đăng nhập"
                                        />
                                    </div>
                                )}

                                {(formData.role === 'teacher' || formData.role === 'tutor') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Môn học phụ trách"
                                            options={subjects.map(s => ({ value: s.name, label: s.name }))}
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="Chọn môn học..."
                                        />
                                        <Select
                                            label="Loại giáo viên"
                                            options={[
                                                { value: 'full_time', label: 'Toàn thời gian' },
                                                { value: 'part_time', label: 'Bán thời gian' },
                                                { value: 'tutor', label: 'Gia sư' },
                                            ]}
                                            value={formData.teacher_type}
                                            onChange={(e) => setFormData({ ...formData, teacher_type: e.target.value })}
                                        />
                                    </div>
                                )}

                                {formData.role === 'staff' && (
                                    <Select
                                        label="Bộ phận / Môn học"
                                        options={subjects.map(s => ({ value: s.name, label: s.name }))}
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="Chọn môn học / Bộ phận..."
                                    />
                                )}

                                <Select
                                    label="Giới tính"
                                    options={genderOptions}
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                />
                            </div>

                            {/* Contact Section */}
                            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                                    <h4 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">Liên hệ & Bảo mật</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Số điện thoại"
                                        placeholder="09xxx"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        leftIcon={<Icons.Phone className="w-4 h-4" />}
                                    />
                                    <Input
                                        label="Email khôi phục"
                                        placeholder="personal@gmail.com"
                                        value={formData.personal_email}
                                        onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                                        hint="Dùng để nhận thông báo và khôi phục mật khẩu"
                                    />
                                </div>

                                <Textarea
                                    label="Địa chỉ thường trú"
                                    placeholder="Số nhà, đường, phường/xã..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                />

                                <Checkbox
                                    label="Tài khoản hoạt động"
                                    description="Cho phép người dùng truy cập vào hệ thống"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            </div>
                        </>
                    )}
                </form>
            )}
        </Modal>
    );
}

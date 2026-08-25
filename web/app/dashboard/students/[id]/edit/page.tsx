'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { showToast } from '@/components/ToastProvider';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  MapPinIcon,
  AcademicCapIcon,
  IdentificationIcon,
  KeyIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';

interface StudentFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  gender: string;
  student_id: string;
  student_code: string;
  grade_level: string;
  enrollment_date: string;
  status: string;
  notes: string;
}

interface FieldError {
  field: string;
  message: string;
}

export default function EditStudentPageGuarded({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PageGuard permissions="students.edit">
      <EditStudentPage params={params} />
    </PageGuard>
  );
}

function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: 'male',
    student_id: '',
    student_code: '',
    grade_level: 'Lớp 10',
    enrollment_date: '',
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    setStudentId(resolvedParams.id);
    loadStudent(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadStudent = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/students/${id}`);
      if (response.ok) {
        const result = await response.json();
        const student = result.data;
        setFormData({
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          email: student.email || '',
          phone: student.phone || '',
          address: student.address || '',
          date_of_birth: student.date_of_birth || '',
          gender: student.gender || 'male',
          student_id: student.student_id || '',
          student_code: student.student_code || '',
          grade_level: student.grade_level || 'Lớp 10',
          enrollment_date: student.enrollment_date || '',
          status: student.status || 'active',
          notes: student.notes || '',
        });
      } else {
        showToast.error('Không thể tải dữ liệu học sinh');
        router.push('/dashboard/students');
      }
    } catch (error) {
      console.error('Failed to load student:', error);
      showToast.error('Lỗi khi tải dữ liệu học sinh');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FieldError[] = [];

    if (!formData.first_name.trim()) {
      newErrors.push({ field: 'first_name', message: 'Vui lòng nhập Tên' });
    }

    if (!formData.last_name.trim()) {
      newErrors.push({ field: 'last_name', message: 'Vui lòng nhập Họ' });
    }

    if (!formData.email.trim()) {
      newErrors.push({ field: 'email', message: 'Vui lòng nhập Email' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ field: 'email', message: 'Email không hợp lệ' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error('Vui lòng kiểm tra lại các thông tin lỗi');
      return;
    }

    setSaving(true);
    const loadingToast = showToast.loading('Đang lưu thay đổi hồ sơ...');

    try {
      const response = await apiFetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      showToast.dismiss(loadingToast);

      if (response.ok) {
        showToast.success('Cập nhật hồ sơ học sinh thành công!');
        setTimeout(() => {
          router.push(routes.students.detail(studentId));
        }, 800);
      } else {
        showToast.error(result.error || 'Cập nhật thất bại');
      }
    } catch (error) {
      showToast.dismiss(loadingToast);
      console.error('Failed to update student:', error);
      showToast.error('Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors.some((e) => e.field === field)) {
      setErrors(errors.filter((e) => e.field !== field));
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((e) => e.field === field)?.message;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-stone-400 font-bold text-xs">Đang tải dữ liệu học sinh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-3 sm:py-6 px-2.5 sm:px-6 animate-in fade-in duration-300">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-white/5">
        <Link
          href={routes.students.detail(studentId)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Hồ sơ học sinh</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={routes.students.detail(studentId)}>
            <Button variant="ghost" size="sm" className="h-9 px-3.5 rounded-xl font-bold text-xs">
              Hủy bỏ
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            isLoading={saving}
            variant="gold"
            size="sm"
            className="h-9 px-4 rounded-xl font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
        {/* Anti-autofill hidden decoys */}
        <input
          type="text"
          name="bhedu_trap_user"
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
          readOnly
        />
        <input
          type="password"
          name="bhedu_trap_pwd"
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="new-password"
          readOnly
        />

        {/* 1. Personal Information Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-white/5">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UserIcon className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
              Thông tin cá nhân học sinh
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Họ đệm"
              required
              value={formData.last_name}
              onChange={(v) => handleChange('last_name', v)}
              error={getFieldError('last_name')}
              placeholder="Nguyễn Văn..."
              autoComplete="off"
            />
            <InputField
              label="Tên gọi"
              required
              value={formData.first_name}
              onChange={(v) => handleChange('first_name', v)}
              error={getFieldError('first_name')}
              placeholder="An..."
              autoComplete="off"
            />

            <InputField
              label="Địa chỉ Email"
              required
              type="email"
              value={formData.email}
              onChange={(v) => handleChange('email', v)}
              error={getFieldError('email')}
              placeholder="hocsinh@student.bhedu.vn"
              icon={<EnvelopeIcon className="w-4 h-4 text-stone-400" />}
              autoComplete="off"
            />

            <InputField
              label="Số điện thoại"
              value={formData.phone}
              onChange={(v) => handleChange('phone', v)}
              error={getFieldError('phone')}
              placeholder="09xx xxx xxx"
              icon={<PhoneIcon className="w-4 h-4 text-stone-400" />}
              autoComplete="off"
            />

            <InputField
              label="Ngày sinh"
              type="date"
              value={formData.date_of_birth}
              onChange={(v) => handleChange('date_of_birth', v)}
              icon={<CalendarDaysIcon className="w-4 h-4 text-stone-400" />}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full h-11 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Địa chỉ thường trú
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Số nhà, tên đường, khu vực..."
                className="w-full h-11 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* 2. Academic & Identification Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-white/5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <AcademicCapIcon className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
              Thông tin học vụ & Định danh
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Mã học sinh (UID)"
              value={formData.student_code}
              readOnly
              icon={<KeyIcon className="w-4 h-4 text-stone-400" />}
              className="bg-stone-100 dark:bg-stone-800 text-stone-500 cursor-not-allowed"
            />

            <InputField
              label="Mã định danh cá nhân / CCCD (CID)"
              value={formData.student_id}
              onChange={(v) => handleChange('student_id', v)}
              error={getFieldError('student_id')}
              placeholder="Số CCCD hoặc mã thẻ..."
              icon={<IdentificationIcon className="w-4 h-4 text-stone-400" />}
              autoComplete="off"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Khối lớp học tập
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => handleChange('grade_level', e.target.value)}
                className="w-full h-11 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="Lớp 6">Lớp 6</option>
                <option value="Lớp 7">Lớp 7</option>
                <option value="Lớp 8">Lớp 8</option>
                <option value="Lớp 9">Lớp 9 (Luyện thi 10)</option>
                <option value="Lớp 10">Lớp 10</option>
                <option value="Lớp 11">Lớp 11</option>
                <option value="Lớp 12">Lớp 12 (Luyện thi ĐH)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Trạng thái hồ sơ
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full h-11 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="active">Đang theo học (Active)</option>
                <option value="inactive">Tạm ngưng / Bảo lưu (Inactive)</option>
                <option value="graduated">Đã tốt nghiệp (Graduated)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Ghi chú học vụ nội bộ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Ghi chú về học lực, nhu cầu bồi dưỡng hoặc theo dõi..."
                className="w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href={routes.students.detail(studentId)}>
            <Button variant="ghost" className="h-11 px-5 rounded-xl font-bold text-xs">
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            isLoading={saving}
            variant="gold"
            className="h-11 px-8 rounded-xl font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

function InputField({
  label,
  required,
  value,
  onChange,
  error,
  icon,
  type = 'text',
  placeholder,
  readOnly,
  className,
  autoComplete,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {error && <span className="text-[10px] font-bold text-rose-500">{error}</span>}
      </div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          autoComplete={autoComplete}
          className={cn(
            'w-full h-11 bg-stone-50 dark:bg-stone-800/60 border rounded-xl px-3 text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all',
            !!icon && 'pl-9',
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-stone-200 dark:border-stone-700 focus:ring-amber-500/20 focus:border-amber-500',
            className
          )}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>
        )}
      </div>
    </div>
  );
}

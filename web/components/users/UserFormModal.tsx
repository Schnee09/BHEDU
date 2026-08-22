'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, Input, Card, Badge } from '@/components/ui';
import { Select, Textarea, Checkbox } from '@/components/ui/form';
import {
  User,
  GraduationCap,
  Users,
  BookOpen,
  Award,
  ShieldCheck,
  Crown,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Copy,
  Printer,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  Building2,
  Plus,
  MapPin,
  Briefcase,
  Coins,
  FileText,
  Inbox,
  Sparkle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { generateAccountHandoverZaloMessage } from '@/lib/utils/zaloTemplates';
import {
  generateUserEmailSlug,
  splitFullName,
  formatVietnameseName,
  getDisplayName,
} from '@/lib/utils/names';
import { usePermissions } from '@/hooks/usePermissions';
import { QRCode } from '@/components/ui/QRCode';
import { printAccountSlip } from '@/lib/utils/printHelper';

const gradeLevelOptions = [
  { value: 'Lớp 6', label: 'Lớp 6 - THCS' },
  { value: 'Lớp 7', label: 'Lớp 7 - THCS' },
  { value: 'Lớp 8', label: 'Lớp 8 - THCS' },
  { value: 'Lớp 9', label: 'Lớp 9 - THCS (Luyện thi vào 10)' },
  { value: 'Lớp 10', label: 'Lớp 10 - THPT' },
  { value: 'Lớp 11', label: 'Lớp 11 - THPT' },
  { value: 'Lớp 12', label: 'Lớp 12 - THPT (Luyện thi ĐH)' },
];

const genderOptions = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
];

function generateStrongPassword(length = 10): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let retVal = '';
  for (let i = 0; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return retVal + 'A1!';
}

function generateUID(role: string): string {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  switch (role) {
    case 'student':
      return `HS${yearSuffix}${randomNum}`;
    case 'teacher':
      return `GV${yearSuffix}${randomNum}`;
    case 'tutor':
      return `GS${yearSuffix}${randomNum}`;
    case 'parent':
      return `PH${yearSuffix}${randomNum}`;
    case 'admin':
      return `AD${yearSuffix}${randomNum}`;
    case 'owner':
      return `QL${yearSuffix}${randomNum}`;
    case 'super_admin':
      return `SA${yearSuffix}${randomNum}`;
    default:
      return `NV${yearSuffix}${randomNum}`;
  }
}

// Auto format Vietnamese Name to Title Case (e.g. "nguyen van an" -> "Nguyễn Văn An")
function autoFormatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format Phone (e.g. "0912345678" -> "0912 345 678")
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

const ALL_ROLE_CARDS = [
  {
    value: 'student',
    label: 'Học sinh',
    desc: 'Học sinh theo học các khóa tại trung tâm',
    icon: GraduationCap,
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
  {
    value: 'parent',
    label: 'Phụ huynh',
    desc: 'Người giám hộ theo dõi tiến độ & học phí',
    icon: Users,
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    value: 'tutor',
    label: 'Gia sư',
    desc: 'Trợ giảng, dạy kèm 1-1 & nhóm bổ trợ',
    icon: BookOpen,
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  {
    value: 'teacher',
    label: 'Giáo viên',
    desc: 'Giảng viên chuyên trách phụ trách lớp học',
    icon: Award,
    badgeClass: 'bg-amber-600/10 text-amber-800 dark:text-amber-300 border-amber-600/20',
  },
  {
    value: 'admin',
    label: 'Quản trị viên',
    desc: 'Quản lý học vụ, nhân sự & vận hành',
    icon: ShieldCheck,
    badgeClass: 'bg-stone-500/10 text-stone-800 dark:text-stone-300 border-stone-500/20',
  },
  {
    value: 'owner',
    label: 'Chủ trung tâm',
    desc: 'Ban giám đốc điều hành toàn diện trung tâm',
    icon: Crown,
    badgeClass: 'bg-amber-500 text-stone-950 font-black border-amber-600',
  },
  {
    value: 'super_admin',
    label: 'Quản trị Hệ thống',
    desc: 'Toàn quyền cấu hình kỹ thuật & hạ tầng',
    icon: Sparkles,
    badgeClass: 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-black',
  },
];

const ROLE_VIETNAMESE_NAMES: Record<string, string> = {
  student: 'Học sinh',
  parent: 'Phụ huynh',
  tutor: 'Gia sư',
  teacher: 'Giáo viên',
  admin: 'Quản trị viên',
  owner: 'Chủ trung tâm',
  super_admin: 'Quản trị Hệ thống',
};

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any; // If provided, mode is 'edit'
  initialRole?: string;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  initialRole,
}: UserFormModalProps) {
  const toast = useToast();
  const isEdit = !!user;
  const { role: currentUserRole } = usePermissions();

  // Wizard Step State (1: Role & Basic, 2: Academic/Role Info, 3: Account & Credentials)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    gender: 'male',
    role: initialRole || 'student',
    // Academic / Role Specific
    student_code: '',
    student_id: '',
    teacher_code: '',
    grade_level: 'Lớp 10',
    school_name: '',
    department: '',
    teacher_type: 'full_time',
    specialization: '',
    hourly_rate: 0,
    occupation: '',
    notes: '',
    // Account & Credentials
    email: '',
    personal_email: '',
    phone: '',
    address: '',
    password: '',
    is_active: true,
    is_managed: true,
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Role Metadata Definitions for Visual Cards
  const roleCards = useMemo(() => {
    if (!currentUserRole) {
      return ALL_ROLE_CARDS.filter((r) => r.value === 'student' || r.value === 'parent');
    }
    if (currentUserRole === 'super_admin') {
      return ALL_ROLE_CARDS;
    }
    if (currentUserRole === 'owner') {
      return ALL_ROLE_CARDS.filter((r) => r.value !== 'super_admin');
    }
    if (currentUserRole === 'admin') {
      return ALL_ROLE_CARDS.filter((r) => r.value !== 'super_admin' && r.value !== 'owner' && r.value !== 'admin');
    }
    return ALL_ROLE_CARDS.filter((r) => r.value === 'student' || r.value === 'parent');
  }, [currentUserRole]);

  // Fetch subjects for teachers/tutors
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

  const subjectOptions = useMemo(() => {
    return subjects.map((s) => ({ value: s.name, label: s.name }));
  }, [subjects]);

  // Reset or Populate form on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormError(null);
      setCreatedUserInfo(null);

      if (user) {
        setFormData({
          full_name: user.full_name || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          gender: user.gender || 'male',
          role: user.role || 'student',
          student_code: user.student_code || '',
          student_id: user.student_id || '',
          teacher_code: user.teacher_code || '',
          grade_level: user.grade_level || 'Lớp 10',
          school_name: user.school_name || '',
          department: user.department || '',
          teacher_type: user.teacher_type || 'full_time',
          specialization: user.specialization || '',
          hourly_rate: user.hourly_rate || 0,
          occupation: user.occupation || '',
          notes: user.notes || '',
          email: user.email || '',
          personal_email: user.personal_email || '',
          phone: user.phone || '',
          address: user.address || '',
          password: '',
          is_active: user.is_active ?? true,
          is_managed: user.is_managed ?? true,
        });

        // Fetch full profile if in edit mode
        const fetchFullDetails = async () => {
          try {
            const response = await apiFetch(`/api/admin/users/${user.id}`);
            const data = await response.json();
            if (data.success && data.data) {
              const u = data.data;
              setFormData((prev) => ({
                ...prev,
                full_name: u.full_name || prev.full_name,
                first_name: u.first_name || prev.first_name,
                last_name: u.last_name || prev.last_name,
                gender: u.gender || prev.gender,
                student_code: u.student_code || prev.student_code,
                student_id: u.student_id || prev.student_id,
                teacher_code: u.teacher_code || prev.teacher_code,
                grade_level: u.grade_level || prev.grade_level,
                school_name: u.school_name || prev.school_name,
                department: u.department || prev.department,
                teacher_type: u.teacher_type || prev.teacher_type,
                specialization: u.specialization || prev.specialization,
                hourly_rate: u.hourly_rate || prev.hourly_rate,
                occupation: u.occupation || prev.occupation,
                notes: u.notes || prev.notes,
                email: u.email || prev.email,
                personal_email: u.personal_email || prev.personal_email,
                phone: u.phone || prev.phone,
                address: u.address || prev.address,
                is_active: u.is_active ?? prev.is_active,
              }));
            }
          } catch (err) {
            logger.error('Failed to fetch full user details', err);
          }
        };
        fetchFullDetails();
      } else {
        const roleToUse = (initialRole || 'student') as any;
        const initialPass = generateStrongPassword(10);
        const initialUID = generateUID(roleToUse);
        setFormData({
          full_name: '',
          first_name: '',
          last_name: '',
          gender: 'male',
          role: roleToUse,
          student_code: roleToUse === 'student' ? initialUID : '',
          student_id: '',
          teacher_code: roleToUse === 'teacher' || roleToUse === 'tutor' ? initialUID : '',
          grade_level: 'Lớp 10',
          school_name: '',
          department: '',
          teacher_type: roleToUse === 'tutor' ? 'tutor' : 'full_time',
          specialization: '',
          hourly_rate: 0,
          occupation: '',
          notes: '',
          email: `${initialUID.toLowerCase()}@${roleToUse === 'student' ? 'student' : roleToUse === 'parent' ? 'parent' : 'id'}.bhedu.vn`,
          personal_email: '',
          phone: '',
          address: '',
          password: initialPass,
          is_active: true,
          is_managed: true,
        });
      }
    }
  }, [isOpen, user]);

  // Handle Full Name input change
  const handleNameChange = (name: string) => {
    const { first_name, last_name } = splitFullName(name);
    setFormData((prev) => {
      const updates: any = {
        full_name: name,
        first_name: first_name,
        last_name: last_name,
      };

      if (!isEdit) {
        if (prev.role === 'student') {
          const code = prev.student_code || generateUID('student');
          updates.student_code = code;
          updates.email = `${code.toLowerCase()}@student.bhedu.vn`;
        } else if (prev.role === 'teacher' || prev.role === 'tutor') {
          const code = prev.teacher_code || generateUID(prev.role);
          updates.teacher_code = code;
          if (name.trim()) {
            const slug = generateUserEmailSlug(name);
            updates.email = `${slug}@bhedu.vn`;
          }
        } else {
          if (name.trim()) {
            const slug = generateUserEmailSlug(name);
            const domain = prev.role === 'parent' ? '@parent.bhedu.vn' : '@bhedu.vn';
            updates.email = `${slug}${domain}`;
          }
        }
      }

      return { ...prev, ...updates };
    });
  };

  // Handle Name blur to auto-capitalize
  const handleNameBlur = () => {
    if (formData.full_name) {
      const formatted = autoFormatTitleCase(formData.full_name);
      handleNameChange(formatted);
    }
  };

  // Handle Role selection
  const handleRoleSelect = (newRole: string) => {
    setFormData((prev) => {
      const updates: any = {
        role: newRole,
        // Reset role-specific fields to avoid polluting user profile with mismatched role data
        grade_level: newRole === 'student' ? 'Lớp 10' : '',
        school_name: newRole === 'student' ? prev.school_name : '',
        department: newRole !== 'student' && newRole !== 'parent' ? prev.department : '',
        teacher_type: newRole === 'tutor' ? 'tutor' : 'full_time',
        specialization: newRole === 'teacher' || newRole === 'tutor' ? prev.specialization : '',
        hourly_rate: newRole === 'teacher' || newRole === 'tutor' ? prev.hourly_rate : 0,
        occupation: newRole === 'parent' ? prev.occupation : '',
      };
      const newUID = generateUID(newRole);

      if (newRole === 'student') {
        updates.student_code = newUID;
        updates.teacher_code = '';
        updates.email = `${newUID.toLowerCase()}@student.bhedu.vn`;
      } else if (newRole === 'teacher' || newRole === 'tutor') {
        updates.teacher_code = newUID;
        updates.student_code = '';
        if (prev.full_name.trim()) {
          const slug = generateUserEmailSlug(prev.full_name);
          updates.email = `${slug}@bhedu.vn`;
        } else {
          updates.email = `${newUID.toLowerCase()}@bhedu.vn`;
        }
      } else {
        updates.student_code = '';
        updates.teacher_code = '';
        const domain = newRole === 'parent' ? '@parent.bhedu.vn' : '@bhedu.vn';
        if (prev.full_name.trim()) {
          const slug = generateUserEmailSlug(prev.full_name);
          updates.email = `${slug}${domain}`;
        } else {
          updates.email = `${newUID.toLowerCase()}${domain}`;
        }
      }

      return { ...prev, ...updates };
    });
  };

  // Copy helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Đã sao chép', `${field} đã được lưu vào bộ nhớ tạm`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.full_name.trim()) {
      setFormError('Vui lòng nhập Họ và tên người dùng');
      return false;
    }
    setFormError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (formData.role === 'student' && !formData.grade_level) {
      setFormError('Vui lòng chọn Khối lớp cho học sinh');
      return false;
    }
    if ((formData.role === 'teacher' || formData.role === 'tutor') && !formData.department) {
      if (subjects.length > 0) {
        setFormError('Vui lòng chọn môn học phụ trách');
        return false;
      }
    }
    setFormError(null);
    return true;
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      if (!formData.full_name.trim()) {
        throw new Error('Vui lòng nhập Họ và tên người dùng');
      }

      let finalEmail = formData.email.trim();
      if (!finalEmail && formData.role === 'student' && formData.student_code) {
        finalEmail = `${formData.student_code.toLowerCase()}@student.bhedu.vn`;
      }

      let finalPassword: string | undefined = formData.password?.trim();
      if (!isEdit) {
        if (!finalPassword) {
          finalPassword = generateStrongPassword(10);
        } else if (finalPassword.length < 8) {
          throw new Error('Mật khẩu khởi tạo phải có tối thiểu 8 ký tự');
        }
      } else {
        if (finalPassword && finalPassword.length < 8) {
          throw new Error('Mật khẩu mới phải có tối thiểu 8 ký tự');
        }
        if (!finalPassword) {
          finalPassword = undefined;
        }
      }

      // Clean phone number
      const cleanPhone = formData.phone ? formData.phone.replace(/\s/g, '') : undefined;

      const payload = {
        ...formData,
        grade_level: formData.role === 'student' ? formData.grade_level || undefined : undefined,
        school_name: formData.role === 'student' ? formData.school_name || undefined : undefined,
        student_code: formData.role === 'student' ? formData.student_code || undefined : undefined,
        student_id: formData.role === 'student' ? formData.student_id || undefined : undefined,
        teacher_code: formData.role === 'teacher' || formData.role === 'tutor' ? formData.teacher_code || undefined : undefined,
        teacher_type: formData.role === 'teacher' || formData.role === 'tutor' ? formData.teacher_type || undefined : undefined,
        specialization: formData.role === 'teacher' || formData.role === 'tutor' ? formData.specialization || undefined : undefined,
        hourly_rate: formData.role === 'teacher' || formData.role === 'tutor' ? formData.hourly_rate || undefined : undefined,
        occupation: formData.role === 'parent' ? formData.occupation || undefined : undefined,
        department: formData.role !== 'student' && formData.role !== 'parent' ? formData.department || undefined : undefined,
        phone: cleanPhone,
        email: finalEmail || undefined,
        password: finalPassword || undefined,
      };

      const textFields = [
        'personal_email',
        'address',
        'specialization',
        'department',
        'notes',
        'student_code',
        'student_id',
        'teacher_code',
        'school_name',
        'occupation',
      ];
      textFields.forEach((field) => {
        if ((payload as any)[field] === '') {
          (payload as any)[field] = undefined;
        }
      });

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: 'Không thể đọc phản hồi từ máy chủ' };
      }

      if (response.ok && data.success) {
        setFormError(null);
        if (!isEdit) {
          const primaryLoginId =
            formData.student_code ||
            data.data?.student_code ||
            formData.teacher_code ||
            data.data?.teacher_code ||
            (finalEmail ? finalEmail.split('@')[0] : '') ||
            'Chưa cấp';

          setCreatedUserInfo({
            ...data.data,
            password: finalPassword,
            role: formData.role,
            full_name: formData.full_name,
            student_code: formData.student_code || data.data?.student_code,
            teacher_code: formData.teacher_code || data.data?.teacher_code,
            login_id: primaryLoginId,
            email: finalEmail,
            personal_email: formData.personal_email,
            phone: formData.phone,
          });
          toast.success('Thành công', 'Người dùng đã được tạo và kích hoạt.');
        } else {
          toast.success('Thành công', 'Thông tin người dùng đã được cập nhật.');
          onSuccess();
        }
      } else {
        const errorMsg =
          data.error || data.message || 'Không thể tạo người dùng. Vui lòng kiểm tra lại thông tin.';
        setFormError(errorMsg);
        toast.error('Lỗi khởi tạo', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Có lỗi xảy ra khi gửi yêu cầu';
      setFormError(errorMsg);
      logger.error('User form error', err);
      toast.error('Lỗi', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Render Digital Account Handover Card
  const renderAccountHandoverPass = () => {
    const loginId =
      createdUserInfo?.login_id ||
      createdUserInfo?.student_code ||
      createdUserInfo?.teacher_code ||
      (createdUserInfo?.email ? createdUserInfo.email.split('@')[0] : '') ||
      'Chưa cấp';

    const roleNameVi =
      ROLE_VIETNAMESE_NAMES[createdUserInfo?.role] ||
      createdUserInfo?.role?.toUpperCase() ||
      'Học sinh';

    const loginUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://bhedu.vn/login';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(loginUrl)}`;
    const currentDate = new Date().toLocaleDateString('vi-VN');

    const handleCopyFormattedMessage = () => {
      const textToCopy = generateAccountHandoverZaloMessage({
        fullName: getDisplayName(createdUserInfo),
        roleName: roleNameVi,
        loginId,
        password: createdUserInfo?.password,
        loginUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
      });

      navigator.clipboard.writeText(textToCopy);
      toast.success('Đã sao chép tin nhắn', 'Đã lưu mẫu tin bàn giao vào bộ nhớ tạm để gửi qua Zalo/SMS.');
    };

    const handlePrintPass = async () => {
      let qrDataUrl = '';
      try {
        const QRCodeLib = (await import('qrcode')).default;
        qrDataUrl = await QRCodeLib.toDataURL(loginUrl, { width: 160, margin: 1 });
      } catch (err) {
        console.error('QR generation error for print:', err);
      }

      printAccountSlip({
        roleNameVi,
        fullName: getDisplayName(createdUserInfo),
        loginId,
        password: createdUserInfo?.password,
        email: createdUserInfo?.email,
        qrDataUrl,
        loginUrl,
      });
    };

    const handleResetForNextUser = () => {
      setCreatedUserInfo(null);
      setCurrentStep(1);
      const initialPass = generateStrongPassword(10);
      const initialUID = generateUID('student');
      setFormData({
        full_name: '',
        first_name: '',
        last_name: '',
        gender: 'male',
        role: 'student',
        student_code: initialUID,
        student_id: '',
        teacher_code: '',
        grade_level: 'Lớp 10',
        school_name: '',
        department: '',
        teacher_type: 'full_time',
        specialization: '',
        hourly_rate: 0,
        occupation: '',
        notes: '',
        email: `${initialUID.toLowerCase()}@student.bhedu.vn`,
        personal_email: '',
        phone: '',
        address: '',
        password: initialPass,
        is_active: true,
        is_managed: true,
      });
    };

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Pass Top Banner */}
        <div className="text-center space-y-2 print:hidden">
          <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            Tài khoản đã được khởi tạo!
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Hệ thống đã kích hoạt quyền truy cập. Vui lòng bàn giao thông tin đăng nhập bên dưới cho học sinh / người dùng.
          </p>
        </div>

        {/* Printable Executive Account Card */}
        <div className="printable-account-card p-6 md:p-8 rounded-[32px] bg-stone-900 text-white relative overflow-hidden border border-stone-800 shadow-2xl space-y-6 print:p-6 print:bg-white print:text-black print:border-2 print:border-black print:shadow-none print:rounded-2xl">
          {/* Header Brand */}
          <div className="flex justify-between items-start border-b border-stone-800 print:border-black pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black print:border-black print:text-black print:bg-transparent">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-amber-400 print:text-black">
                  Trung tâm Giáo dục Bùi Hoàng
                </h4>
                <p className="text-xs font-black text-stone-300 print:text-stone-800 uppercase tracking-wider mt-0.5">
                  Thẻ Tài Khoản Học Vụ
                </p>
                <p className="text-[10px] text-stone-400 print:text-stone-600 font-mono mt-0.5">
                  BH-EDU • Ngày cấp: {currentDate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-wider print:border print:border-black print:bg-transparent print:text-black inline-block">
                {roleNameVi}
              </span>
            </div>
          </div>

          {/* User & Credential Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1 print:bg-stone-50 print:border print:border-stone-300 print:text-black">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 print:text-stone-600 block">
                Họ và tên
              </span>
              <p className="text-base font-black text-white print:text-black">{getDisplayName(createdUserInfo)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1 print:bg-stone-50 print:border print:border-stone-300 print:text-black">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 print:text-stone-600">
                  Tên đăng nhập (Mã UID)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(loginId, 'UID')}
                  className="text-stone-400 hover:text-amber-400 transition-colors p-1 cursor-pointer print:hidden"
                >
                  {copiedField === 'UID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-base font-mono font-black text-amber-400 print:text-black">{loginId}</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1 print:bg-stone-50 print:border print:border-stone-300 print:text-black">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 print:text-stone-600">
                  Mật khẩu ban đầu
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdUserInfo?.password || '', 'Mật khẩu')}
                  className="text-stone-400 hover:text-amber-400 transition-colors p-1 cursor-pointer print:hidden"
                >
                  {copiedField === 'Mật khẩu' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-base font-mono font-black text-emerald-400 print:text-black tracking-wider">
                {createdUserInfo?.password}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1 print:bg-stone-50 print:border print:border-stone-300 print:text-black">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 print:text-stone-600 block">
                Email hệ thống
              </span>
              <p className="text-xs font-mono text-stone-300 print:text-black truncate">{createdUserInfo?.email}</p>
            </div>
          </div>

          {/* QR Code & Security Instructions */}
          <div className="p-4 rounded-2xl bg-stone-800/50 border border-stone-700/80 flex flex-col sm:flex-row items-center gap-4 print:bg-stone-50 print:border print:border-stone-300 print:text-black">
            <div className="w-24 h-24 bg-white p-1.5 rounded-xl border border-stone-300 shrink-0 flex items-center justify-center shadow-sm">
              <QRCode
                value={loginUrl}
                size={88}
                className="w-full h-full"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="font-black text-amber-300 print:text-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 print:text-black" />
                Hướng dẫn đăng nhập & Lưu ý:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-stone-300 print:text-stone-700 text-[11px] leading-relaxed">
                <li>Quét mã QR hoặc truy cập: <strong className="text-white print:text-black">{loginUrl}</strong></li>
                <li>Đăng nhập bằng <strong>Mã UID</strong> hoặc <strong>Email</strong> với mật khẩu ban đầu ở trên.</li>
                <li><strong className="text-amber-200 print:text-black font-black">Vui lòng đổi mật khẩu mới</strong> sau lần đăng nhập đầu tiên để bảo mật tài khoản.</li>
                <li>Hotline hỗ trợ học vụ: <strong>0899 060 686</strong></li>
              </ul>
            </div>
          </div>

          {/* Signatures Section for Official Handover */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-800 print:border-black text-center">
            <div className="space-y-16 print:space-y-10">
              <p className="text-xs font-bold uppercase text-stone-300 print:text-black">
                Học sinh / Người nhận
              </p>
              <p className="text-[11px] text-stone-400 print:text-stone-600 italic">
                (Ký và ghi rõ họ tên)
              </p>
            </div>
            <div className="space-y-16 print:space-y-10">
              <p className="text-xs font-bold uppercase text-stone-300 print:text-black">
                Giáo vụ trung tâm
              </p>
              <p className="text-[11px] text-stone-400 print:text-stone-600 italic">
                (Ký và ghi rõ họ tên)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 print:hidden">
          <Button
            variant="secondary"
            onClick={handleCopyFormattedMessage}
            className="h-12 rounded-2xl font-bold gap-2 text-xs"
          >
            <Copy className="w-4 h-4 text-amber-500" />
            Sao chép tin nhắn Zalo/SMS
          </Button>

          <Button
            variant="secondary"
            onClick={handlePrintPass}
            className="h-12 rounded-2xl font-bold gap-2 text-xs"
          >
            <Printer className="w-4 h-4 text-stone-600 dark:text-stone-300" />
            In thẻ tài khoản
          </Button>

          <Button
            variant="ghost"
            onClick={handleResetForNextUser}
            className="h-12 rounded-2xl font-bold gap-2 text-xs border border-stone-200 dark:border-stone-800"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            Tạo tiếp tài khoản khác
          </Button>

          <Button
            variant="gold"
            onClick={onSuccess}
            className="h-12 rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20"
          >
            Hoàn tất & Đóng
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        createdUserInfo
          ? 'Phiếu Bàn Giao Tài Khoản'
          : isEdit
          ? `Chỉnh sửa: ${formData.full_name || 'Người dùng'}`
          : 'Thêm Người Dùng Mới'
      }
      size="lg"
      footer={
        !createdUserInfo && !isEdit ? (
          <div className="flex justify-between items-center w-full gap-3">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFormError(null);
                    setCurrentStep((prev) => prev - 1);
                  }}
                  className="rounded-2xl font-bold text-xs gap-1.5 h-11 px-5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Quay lại
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="rounded-2xl font-bold text-xs h-11 px-5"
              >
                Hủy bỏ
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="gold"
                  onClick={() => {
                    if (currentStep === 1 && validateStep1()) {
                      setCurrentStep(2);
                    } else if (currentStep === 2 && validateStep2()) {
                      setCurrentStep(3);
                    }
                  }}
                  className="rounded-2xl font-black uppercase tracking-wider text-xs gap-1.5 h-11 px-6 shadow-lg shadow-amber-500/20"
                >
                  Tiếp tục
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="gold"
                  onClick={() => handleSubmit()}
                  isLoading={loading}
                  className="rounded-2xl font-black uppercase tracking-wider text-xs gap-1.5 h-11 px-8 shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  Tạo người dùng
                </Button>
              )}
            </div>
          </div>
        ) : isEdit ? (
          <div className="flex justify-end items-center w-full gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl font-bold text-xs h-11 px-5"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="gold"
              onClick={() => handleSubmit()}
              isLoading={loading}
              className="rounded-2xl font-black uppercase tracking-wider text-xs gap-1.5 h-11 px-8 shadow-lg shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              Lưu thay đổi
            </Button>
          </div>
        ) : null
      }
    >
      {createdUserInfo ? (
        renderAccountHandoverPass()
      ) : (
        <div className="space-y-6">
          {/* Error Banner */}
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-fade-in shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-black text-rose-900 dark:text-rose-200 text-xs mb-0.5">
                  Vui lòng kiểm tra lại
                </p>
                <p className="leading-relaxed">{formError}</p>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-1"
              >
                &times;
              </button>
            </div>
          )}

          {/* 3-Step Wizard Progress Header (Only on Create Mode) */}
          {!isEdit && (
            <div className="grid grid-cols-3 gap-2 border-b border-stone-100 dark:border-stone-800 pb-5">
              {[
                { step: 1, title: '1. Vai trò & Cá nhân' },
                { step: 2, title: '2. Học vụ & Chuyên môn' },
                { step: 3, title: '3. Tài khoản & Bảo mật' },
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isPassed = currentStep > item.step;

                return (
                  <div
                    key={item.step}
                    className={cn(
                      'p-2.5 rounded-2xl text-center transition-all border text-xs font-bold flex items-center justify-center gap-2',
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/10'
                        : isPassed
                        ? 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300'
                        : 'border-transparent text-stone-400 dark:text-stone-600'
                    )}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className={cn('w-4 h-4 rounded-full text-[10px] flex items-center justify-center', isActive ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-200 dark:bg-stone-800 text-stone-500')}>
                        {item.step}
                      </span>
                    )}
                    <span className="hidden sm:inline truncate">{item.title}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 1: Vai trò & Thông tin Cá nhân */}
          {(currentStep === 1 || isEdit) && (
            <div className="space-y-6 animate-fade-in">
              {/* Role Selection Grid */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                  Chọn vai trò người dùng <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roleCards.map((rc) => {
                    const Icon = rc.icon;
                    const isSelected = formData.role === rc.value;

                    return (
                      <button
                        key={rc.value}
                        type="button"
                        onClick={() => !isEdit && handleRoleSelect(rc.value)}
                        disabled={isEdit}
                        className={cn(
                          'p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 group cursor-pointer',
                          isSelected
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/50 shadow-md ring-2 ring-amber-500/20'
                            : 'bg-stone-50/60 dark:bg-white/[0.02] border-stone-200/70 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/15',
                          isEdit && !isSelected && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div
                            className={cn(
                              'p-2.5 rounded-xl transition-colors',
                              isSelected
                                ? 'bg-amber-500 text-stone-950 shadow-sm'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-black text-stone-900 dark:text-white block">
                            {rc.label}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2 block leading-tight">
                            {rc.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basic Personal Information */}
              <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Họ và tên đầy đủ"
                      required
                      placeholder="Nhập họ và tên học sinh / nhân sự..."
                      value={formData.full_name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      onBlur={handleNameBlur}
                      leftIcon={<User className="w-4 h-4 text-stone-400" />}
                      className="font-bold"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Select
                      label="Giới tính"
                      options={genderOptions}
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Số điện thoại liên hệ"
                    placeholder="09xx xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    leftIcon={<Phone className="w-4 h-4 text-stone-400" />}
                  />
                  <Input
                    label="Địa chỉ thường trú"
                    placeholder="Số nhà, tên đường, khu vực..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    leftIcon={<MapPin className="w-4 h-4 text-stone-400" />}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Học vụ & Chuyên môn (Dynamic by Role) */}
          {(currentStep === 2 || isEdit) && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Thông tin chuyên môn dành cho {roleCards.find((r) => r.value === formData.role)?.label}
                </h4>
              </div>

              {/* Student Role Fields */}
              {formData.role === 'student' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Khối lớp học tập"
                      required
                      options={gradeLevelOptions}
                      value={formData.grade_level}
                      onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    />
                    <Input
                      label="Trường học phổ thông đang theo học"
                      placeholder="Nhập tên trường học..."
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      leftIcon={<Building2 className="w-4 h-4 text-stone-400" />}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        label="Mã học sinh (UID định danh)"
                        value={formData.student_code}
                        onChange={(e) => {
                          const code = e.target.value.toUpperCase();
                          setFormData((prev) => ({
                            ...prev,
                            student_code: code,
                            email: code ? `${code.toLowerCase()}@student.bhedu.vn` : prev.email,
                          }));
                        }}
                        placeholder="HS26..."
                        leftIcon={<Sparkle className="w-4 h-4 text-amber-500" />}
                      />
                      {!isEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            const code = generateUID('student');
                            setFormData((prev) => ({
                              ...prev,
                              student_code: code,
                              email: `${code.toLowerCase()}@student.bhedu.vn`,
                            }));
                          }}
                          className="absolute right-3 top-[34px] px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Tạo mã mới ngẫu nhiên"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Đổi mã
                        </button>
                      )}
                    </div>

                    <Input
                      label="Mã định danh cá nhân / CCCD (Tùy chọn)"
                      placeholder="Số CCCD hoặc mã thẻ học sinh..."
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    />
                  </div>

                  <Textarea
                    label="Ghi chú học vụ / Mục tiêu đào tạo"
                    placeholder="Ghi chú về học lực, nhu cầu bồi dưỡng hoặc mục tiêu thi cử..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              )}

              {/* Teacher / Tutor Role Fields */}
              {(formData.role === 'teacher' || formData.role === 'tutor') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Môn học phụ trách"
                      required
                      options={subjectOptions}
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Chọn môn học chuyên trách..."
                    />

                    {formData.role === 'teacher' ? (
                      <Select
                        label="Hình thức hợp đồng"
                        options={[
                          { value: 'full_time', label: 'Toàn thời gian (Cơ hữu)' },
                          { value: 'part_time', label: 'Bán thời gian (Thỉnh giảng)' },
                        ]}
                        value={formData.teacher_type}
                        onChange={(e) => setFormData({ ...formData, teacher_type: e.target.value })}
                      />
                    ) : (
                      <div className="flex flex-col justify-end">
                        <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1">
                          Hình thức giảng dạy
                        </label>
                        <div className="px-4 py-2.5 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-bold text-stone-700 dark:text-stone-300 h-11 flex items-center">
                          Gia sư & Trợ giảng kèm 1-1
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Chuyên môn / Học vị"
                      placeholder="Học vị, bằng cấp hoặc chuyên môn..."
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      leftIcon={<BookOpen className="w-4 h-4 text-stone-400" />}
                    />
                    <Input
                      label="Mức chi trả theo ca / buổi dạy"
                      type="number"
                      min={0}
                      placeholder="VD: 150000 (VNĐ/buổi)..."
                      value={formData.hourly_rate || ''}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                      leftIcon={<Coins className="w-4 h-4 text-stone-400" />}
                      hint="Định mức chi trả áp dụng khi chấm công ca dạy"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      label="Mã giảng viên (UID)"
                      value={formData.teacher_code}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher_code: e.target.value.toUpperCase() })
                      }
                      placeholder="GV26..."
                      leftIcon={<Sparkle className="w-4 h-4 text-amber-500" />}
                    />
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          const code = generateUID(formData.role);
                          setFormData((prev) => ({ ...prev, teacher_code: code }));
                        }}
                        className="absolute right-3 top-[34px] px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Tạo mã mới ngẫu nhiên"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Đổi mã
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Parent Role Fields */}
              {formData.role === 'parent' && (
                <div className="space-y-4">
                  <Input
                    label="Nghề nghiệp / Cơ quan công tác (Tùy chọn)"
                    placeholder="Nghề nghiệp hoặc nơi công tác..."
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    leftIcon={<Briefcase className="w-4 h-4 text-stone-400" />}
                  />
                  <Textarea
                    label="Ghi chú về con em / học sinh cần liên kết"
                    placeholder="Thông tin học sinh liên kết hoặc yêu cầu theo dõi..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              )}

              {/* Admin / Owner / Super Admin Role Fields */}
              {(formData.role === 'admin' || formData.role === 'owner' || formData.role === 'super_admin') && (
                <div className="space-y-4">
                  <Input
                    label="Phòng ban / Bộ phận công tác"
                    placeholder="Bộ phận chuyên môn hoặc phòng ban..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    leftIcon={<Building2 className="w-4 h-4 text-stone-400" />}
                  />
                  <Textarea
                    label="Ghi chú trách nhiệm & phạm vi phụ trách"
                    placeholder="Ghi chú trách nhiệm phân công nội bộ..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Tài khoản, Mật khẩu & Liên hệ */}
          {(currentStep === 3 || isEdit) && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-[28px] bg-stone-50 dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-stone-200/60 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white">
                      Thiết lập thông tin tài khoản đăng nhập
                    </span>
                  </div>
                  <Badge variant="gold" className="text-[10px] font-bold">
                    Chuẩn hóa BH-EDU
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Tên đăng nhập (Email hệ thống)"
                    required
                    placeholder="tendangnhap@bhedu.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    leftIcon={<Mail className="w-4 h-4 text-stone-400" />}
                  />

                  <Input
                    label="Email cá nhân (Nhận thông báo)"
                    placeholder="email.canhan@gmail.com..."
                    value={formData.personal_email}
                    onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                    leftIcon={<Inbox className="w-4 h-4 text-stone-400" />}
                    hint="Nhận kết quả điểm, biên lai học phí & khôi phục tài khoản"
                  />
                </div>

                {!isEdit && (
                  <div className="relative">
                    <Input
                      label="Mật khẩu khởi tạo"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      leftIcon={<Lock className="w-4 h-4 text-stone-400" />}
                      hint="Tối thiểu 8 ký tự. Bạn có thể nhấn biểu tượng làm mới để tự sinh mật khẩu mạnh ngẫu nhiên."
                      rightIcon={
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-stone-400 hover:text-amber-500 p-1 cursor-pointer"
                            title={showPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, password: generateStrongPassword(10) })
                            }
                            className="text-stone-400 hover:text-amber-500 p-1 cursor-pointer"
                            title="Tạo mật khẩu mạnh ngẫu nhiên"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      }
                    />
                  </div>
                )}

                <div className="pt-2">
                  <Checkbox
                    label="Kích hoạt tài khoản ngay"
                    description="Cho phép người dùng đăng nhập vào cổng học vụ ngay sau khi tạo"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

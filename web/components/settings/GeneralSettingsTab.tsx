'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  GraduationCap,
  Award,
  Calendar,
  CreditCard,
  Building,
  Image as ImageIcon,
  FileBadge,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Setting } from '@/lib/settings/types';
import { cn } from '@/lib/utils';

interface GeneralSettingsTabProps {
  settings: Setting[];
  settingsForm: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
  isSearching: boolean;
  searchQuery: string;
}

interface FieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: 'text' | 'number' | 'url';
  description?: string;
  span?: 1 | 2;
}

const SECTION_FIELDS: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge: string;
  fields: FieldConfig[];
}> = [
  {
    id: 'branding',
    title: 'Hồ sơ & Nhận diện Trung tâm',
    subtitle: 'Thông tin pháp lý, thương hiệu và nhận diện của trung tâm giáo dục',
    icon: Building2,
    iconColor: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20',
    badge: 'Định danh',
    fields: [
      {
        key: 'school_name',
        label: 'Tên trung tâm',
        placeholder: 'Ví dụ: Trung tâm Giáo dục Bùi Hoàng',
        icon: Building2,
        span: 2,
      },
      {
        key: 'school_code',
        label: 'Mã định danh trung tâm',
        placeholder: 'Ví dụ: BH-EDU-HCM',
        icon: FileBadge,
        span: 1,
      },
      {
        key: 'school_license',
        label: 'Số giấy phép hoạt động',
        placeholder: 'Ví dụ: 1234/QĐ-SGDĐT',
        icon: Award,
        span: 1,
      },
      {
        key: 'school_slogan',
        label: 'Khẩu hiệu / Slogan',
        placeholder: 'Ví dụ: Khơi nguồn tri thức - Kiến tạo tương lai',
        icon: Sparkles,
        span: 2,
      },
      {
        key: 'school_logo',
        label: 'Đường dẫn Logo URL',
        placeholder: 'https://example.com/logo.png',
        icon: ImageIcon,
        type: 'url',
        span: 1,
      },
      {
        key: 'school_favicon',
        label: 'Đường dẫn Favicon URL',
        placeholder: 'https://example.com/favicon.ico',
        icon: ImageIcon,
        type: 'url',
        span: 1,
      },
    ],
  },
  {
    id: 'contact',
    title: 'Thông tin liên hệ & Địa chỉ',
    subtitle: 'Kênh liên lạc chính thức dùng để hiển thị trên hóa đơn, thông báo và website',
    icon: Phone,
    iconColor: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20',
    badge: 'Liên hệ',
    fields: [
      {
        key: 'school_phone',
        label: 'Hotline / Số điện thoại',
        placeholder: '028-1234-5678',
        icon: Phone,
        span: 1,
      },
      {
        key: 'school_email',
        label: 'Email chính thức',
        placeholder: 'contact@bhedu.vn',
        icon: Mail,
        span: 1,
      },
      {
        key: 'school_address',
        label: 'Địa chỉ trụ sở chính',
        placeholder: 'Số 123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
        icon: MapPin,
        span: 2,
      },
      {
        key: 'school_website',
        label: 'Website chính thức',
        placeholder: 'https://bhedu.vn',
        icon: Globe,
        type: 'url',
        span: 1,
      },
      {
        key: 'school_working_hours',
        label: 'Giờ làm việc',
        placeholder: 'Thứ 2 - Thứ 7: 07:30 - 21:00',
        icon: Clock,
        span: 1,
      },
    ],
  },
  {
    id: 'academic',
    title: 'Cấu hình học vụ mặc định',
    subtitle: 'Các tham số tiêu chuẩn áp dụng cho thời khóa biểu, điểm số và năm học',
    icon: GraduationCap,
    iconColor: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20',
    badge: 'Học vụ',
    fields: [
      {
        key: 'academic_year',
        label: 'Năm học hiện tại',
        placeholder: '2024-2025',
        icon: Calendar,
        span: 1,
      },
      {
        key: 'semester',
        label: 'Học kỳ mặc định',
        placeholder: 'Học kỳ 1 / Học kỳ 2',
        icon: Calendar,
        span: 1,
      },
      {
        key: 'grading_scale',
        label: 'Thang điểm chuẩn',
        placeholder: '10',
        icon: Award,
        span: 1,
      },
      {
        key: 'passing_grade',
        label: 'Điểm đạt tối thiểu (Passing Grade)',
        placeholder: '5.0',
        icon: Award,
        type: 'number',
        span: 1,
      },
      {
        key: 'class_slot_duration',
        label: 'Thời lượng tiết học tiêu chuẩn (phút)',
        placeholder: '90',
        icon: Clock,
        type: 'number',
        span: 2,
      },
    ],
  },
  {
    id: 'finance',
    title: 'Cấu hình tài chính & Tài khoản nhận học phí',
    subtitle: 'Thông tin tài khoản ngân hàng thụ hưởng hiển thị tự động trên phiếu thu và mã QR',
    icon: CreditCard,
    iconColor: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20',
    badge: 'Tài chính',
    fields: [
      {
        key: 'bank_name',
        label: 'Tên Ngân hàng thụ hưởng',
        placeholder: 'Ví dụ: Vietcombank / Techcombank / MBBank',
        icon: Building,
        span: 1,
      },
      {
        key: 'bank_branch',
        label: 'Chi nhánh ngân hàng',
        placeholder: 'Ví dụ: Chi nhánh TP. Hồ Chí Minh',
        icon: MapPin,
        span: 1,
      },
      {
        key: 'bank_account_number',
        label: 'Số tài khoản nhận học phí',
        placeholder: 'Ví dụ: 0123456789',
        icon: CreditCard,
        span: 1,
      },
      {
        key: 'bank_account_holder',
        label: 'Tên chủ tài khoản (In hoa không dấu)',
        placeholder: 'TRUNG TAM GIAO DUC BUI HOANG',
        icon: Building2,
        span: 1,
      },
      {
        key: 'tuition_due_days',
        label: 'Hạn nộp học phí mặc định (số ngày kể từ khi tạo hóa đơn)',
        placeholder: '7',
        icon: Clock,
        type: 'number',
        span: 1,
      },
      {
        key: 'currency',
        label: 'Đơn vị tiền tệ',
        placeholder: 'VNĐ',
        icon: CreditCard,
        span: 1,
      },
    ],
  },
];

export function GeneralSettingsTab({
  settings,
  settingsForm,
  onSettingChange,
  isSearching,
  searchQuery,
}: GeneralSettingsTabProps) {
  const query = searchQuery.trim().toLowerCase();

  // Filter sections and fields if searching
  const filteredSections = SECTION_FIELDS.map((section) => {
    if (!isSearching || !query) return section;

    const matchedFields = section.fields.filter(
      (f) =>
        f.label.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query) ||
        (settingsForm[f.key] || '').toLowerCase().includes(query)
    );

    const sectionTitleMatch =
      section.title.toLowerCase().includes(query) ||
      section.subtitle.toLowerCase().includes(query);

    if (sectionTitleMatch) return section;
    if (matchedFields.length > 0) {
      return { ...section, fields: matchedFields };
    }
    return null;
  }).filter(Boolean) as typeof SECTION_FIELDS;

  // Render preview badge for school
  const schoolName = settingsForm['school_name'] || 'Trung tâm Giáo dục';
  const schoolCode = settingsForm['school_code'] || 'BH-EDU';
  const schoolPhone = settingsForm['school_phone'] || '028-XXXX-XXXX';
  const schoolEmail = settingsForm['school_email'] || 'contact@domain.com';

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Live Branding Overview Card */}
      {!isSearching && (
        <div className="p-8 rounded-[32px] bg-stone-900 dark:bg-[#14120E] text-white relative overflow-hidden border border-stone-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3
                    className="text-2xl md:text-3xl font-black tracking-tight !text-white leading-tight"
                    style={{ color: '#ffffff' }}
                  >
                    {schoolName}
                  </h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full shrink-0">
                    {schoolCode}
                  </span>
                </div>
                <div
                  className="text-xs font-medium flex items-center gap-3 flex-wrap"
                  style={{ color: '#d6d3d1' }}
                >
                  <span className="font-mono">{schoolPhone}</span>
                  <span className="text-stone-500">&bull;</span>
                  <span>{schoolEmail}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-stone-800/90 rounded-2xl border border-stone-700 text-[11px] font-mono text-stone-200 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống đang hoạt động
            </div>
          </div>
        </div>
      )}

      {/* Bento Sections Grid */}
      <div className="space-y-8">
        {filteredSections.map((section) => (
          <div
            key={section.id}
            className="p-8 md:p-10 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-8 shadow-sm hover:border-amber-500/20 transition-all duration-500"
          >
            {/* Section Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className={cn('p-3.5 rounded-2xl shrink-0', section.iconColor)}>
                  <section.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                    {section.subtitle}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 rounded-full border border-stone-200/50 dark:border-white/10 shrink-0">
                {section.badge}
              </span>
            </div>

            {/* Quick Admin Links for Academic Section */}
            {section.id === 'academic' && (
              <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Quản lý chuyên sâu theo trang Cấu hình học vụ:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/admin/academic-years"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border border-stone-200/60 dark:border-white/10 shadow-sm"
                  >
                    <span>Quản lý Năm học & Học kỳ</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                  </Link>
                  <Link
                    href="/dashboard/admin/grading-scales"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border border-stone-200/60 dark:border-white/10 shadow-sm"
                  >
                    <span>Quản lý Thang điểm</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                  </Link>
                </div>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((field) => {
                const IconComponent = field.icon;
                const value = settingsForm[field.key] ?? '';
                const isDoubleSpan = field.span === 2;

                return (
                  <div
                    key={field.key}
                    className={cn(
                      'space-y-2 group',
                      isDoubleSpan ? 'md:col-span-2' : 'md:col-span-1'
                    )}
                  >
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider group-focus-within:text-amber-500 transition-colors flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5 opacity-60 group-focus-within:opacity-100 text-amber-500" />
                        {field.label}
                      </label>
                      <span className="text-[9px] font-mono text-stone-400/40 lowercase">
                        {field.key}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={field.type || 'text'}
                        value={value}
                        onChange={(e) => onSettingChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-5 py-4 bg-stone-50 dark:bg-white/[0.03] border border-stone-200/70 dark:border-white/10 focus:border-stone-900 dark:focus:border-amber-500 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400/60 placeholder:font-normal outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="p-16 text-center space-y-4 rounded-3xl bg-stone-50/50 dark:bg-white/5 border border-dashed border-stone-200 dark:border-white/10">
            <HelpCircle className="w-12 h-12 text-stone-400 mx-auto opacity-40" />
            <p className="text-stone-500 font-bold text-sm">
              Không tìm thấy thiết lập nào khớp với từ khóa "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

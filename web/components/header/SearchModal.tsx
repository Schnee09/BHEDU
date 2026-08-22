'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  type: 'feature' | 'student' | 'teacher' | 'class' | 'course';
  category: string;
  name: string;
  sub?: string;
  href: string;
  icon?: any;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Full Feature Directory (20+ features mapped to routes)
  const appFeatures: SearchItem[] = useMemo(
    () => [
      // Học vụ & Đào tạo
      { type: 'feature', category: 'Học vụ & Đào tạo', name: 'Lớp học', sub: 'Quản lý danh sách lớp, phòng học & môn', href: routes.classes.list(), icon: AcademicCapIcon },
      { type: 'feature', category: 'Học vụ & Đào tạo', name: 'Hồ sơ Học sinh', sub: 'Danh sách học sinh & mã định danh', href: routes.students.list(), icon: UserGroupIcon },
      { type: 'feature', category: 'Học vụ & Đào tạo', name: 'Thời khóa biểu', sub: 'Lịch học theo tuần và phòng học', href: routes.timetable.manage(), icon: ClockIcon },
      { type: 'feature', category: 'Học vụ & Đào tạo', name: 'Lịch dạy Gia sư', sub: 'Quản lý buổi kèm 1-1 và gia sư', href: '/dashboard/tutoring/schedule', icon: BookOpenIcon },
      { type: 'feature', category: 'Học vụ & Đào tạo', name: 'Nhập học sinh từ Excel', sub: 'Tải lên danh sách học sinh hàng loạt', href: routes.students.import(), icon: UserGroupIcon },
      
      // Điểm danh & Điểm số
      { type: 'feature', category: 'Điểm danh & Điểm số', name: 'Điểm danh lớp học', sub: 'Nhật ký chuyên cần hàng ngày', href: routes.attendance.list(), icon: ClipboardDocumentCheckIcon },
      { type: 'feature', category: 'Điểm danh & Điểm số', name: 'Nhập điểm học tập', sub: 'Sổ điểm, điểm thi và kiểm tra', href: routes.grades.entry(), icon: AcademicCapIcon },
      { type: 'feature', category: 'Điểm danh & Điểm số', name: 'Báo cáo & Phân tích', sub: 'Thống kê kết quả và học lực', href: routes.grades.analytics(), icon: SparklesIcon },

      // Tài chính
      { type: 'feature', category: 'Tài chính', name: 'Tài chính & Học phí', sub: 'Hóa đơn, khoản thu & thanh toán', href: '/dashboard/finance', icon: BanknotesIcon },

      // Nhân sự & Người dùng
      { type: 'feature', category: 'Nhân sự', name: 'Quản lý Giáo viên & Gia sư', sub: 'Danh sách đội ngũ nhân sự', href: '/dashboard/admin/teachers', icon: UserGroupIcon },
      { type: 'feature', category: 'Nhân sự', name: 'Lời mời tham gia', sub: 'Tạo mã mời phụ huynh và giáo viên', href: '/dashboard/admin/invitations', icon: UserGroupIcon },

      // Cấu hình Học vụ
      { type: 'feature', category: 'Cấu hình Học vụ', name: 'Năm học & Học kỳ', sub: 'Thiết lập niên khóa và giai đoạn', href: '/dashboard/admin/academic-years', icon: AcademicCapIcon },
      { type: 'feature', category: 'Cấu hình Học vụ', name: 'Thang điểm & Xếp loại', sub: 'Quy chuẩn tính GPA và xếp loại', href: '/dashboard/admin/grading-scales', icon: SparklesIcon },
      { type: 'feature', category: 'Cấu hình Học vụ', name: 'Thông báo trung tâm', sub: 'Đăng tin tức và thông báo', href: '/dashboard/admin/announcements', icon: SparklesIcon },

      // Quản trị Hệ thống
      { type: 'feature', category: 'Quản trị Hệ thống', name: 'Cài đặt Trung tâm', sub: 'Thông tin trung tâm, logo, quy định', href: '/dashboard/settings', icon: Cog6ToothIcon },
      { type: 'feature', category: 'Quản trị Hệ thống', name: 'Phân quyền & Vai trò', sub: 'Ma trận quyền và Custom Roles', href: '/dashboard/admin/permissions', icon: ShieldCheckIcon },
      { type: 'feature', category: 'Quản trị Hệ thống', name: 'Giám sát Hệ thống', sub: 'Tình trạng kết nối DB và RAM', href: '/dashboard/admin/health', icon: SparklesIcon },
      { type: 'feature', category: 'Quản trị Hệ thống', name: 'Sao lưu & Dữ liệu', sub: 'Tải bản backup và xuất phân hệ', href: '/dashboard/admin/backup', icon: ShieldCheckIcon },
      { type: 'feature', category: 'Cá nhân', name: 'Hồ sơ của tôi', sub: 'Thông tin tài khoản và đổi mật khẩu', href: routes.profile(), icon: UserGroupIcon },
    ],
    []
  );

  // Synchronous recommendation reset when modal opens or query is cleared
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults(appFeatures.slice(0, 8));
      setSelectedIndex(0);
      setIsSearching(false);
      return;
    }

    // Immediate local match for features
    const localMatches = appFeatures.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        (f.sub && f.sub.toLowerCase().includes(q))
    );
    setSearchResults(localMatches);
    setSelectedIndex(0);

    // Asynchronous database query for deep entity search
    if (q.length < 2) return;

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [profilesRes, classesRes, coursesRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .ilike('full_name', `%${q}%`)
            .limit(5),
          supabase.from('classes').select('id, name').ilike('name', `%${q}%`).limit(3),
          supabase.from('courses').select('id, name').ilike('name', `%${q}%`).limit(2),
        ]);

        const dbResults: SearchItem[] = [];

        profilesRes.data?.forEach((p: any) => {
          const roleLabel =
            p.role === 'super_admin'
              ? 'Quản trị Hệ thống'
              : p.role === 'owner'
              ? 'Chủ trung tâm'
              : p.role === 'admin'
              ? 'Quản trị viên'
              : p.role === 'teacher'
              ? 'Giáo viên'
              : p.role === 'tutor'
              ? 'Gia sư'
              : p.role === 'parent'
              ? 'Phụ huynh'
              : 'Học sinh';

          const href =
            p.role === 'student'
              ? `/dashboard/students/${p.id}`
              : p.role === 'teacher' || p.role === 'tutor'
              ? `/dashboard/admin/teachers`
              : `/dashboard/admin/users`;

          dbResults.push({
            type: p.role === 'student' ? 'student' : 'teacher',
            category: `Người dùng • ${roleLabel}`,
            name: p.full_name || p.email,
            sub: p.email ? `Email: ${p.email}` : undefined,
            href,
            icon: UserGroupIcon,
          });
        });

        classesRes.data?.forEach((c: any) =>
          dbResults.push({
            type: 'class',
            category: 'Lớp học',
            name: c.name,
            sub: 'Xem chi tiết và danh sách lớp',
            href: `/dashboard/classes/${c.id}`,
            icon: AcademicCapIcon,
          })
        );

        coursesRes.data?.forEach((co: any) =>
          dbResults.push({
            type: 'course',
            category: 'Môn học / Khóa học',
            name: co.name,
            sub: 'Khung chương trình đào tạo',
            href: `/dashboard/admin/subjects`,
            icon: BookOpenIcon,
          })
        );

        setSearchResults((prev) => {
          const combined = [...localMatches, ...dbResults];
          // Deduplicate by href + name
          const seen = new Set<string>();
          return combined.filter((item) => {
            const key = item.href + item.name;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).slice(0, 10);
        });
      } catch (e) {
        console.error('Search preview error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, appFeatures, supabase, isOpen]);

  // Handle keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        router.push(selected.href);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Solid Dim Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Solid Opaque Dialog Box */}
      <div className="fixed inset-x-4 top-16 md:inset-auto md:top-20 md:left-1/2 md:-translate-x-1/2 md:w-[720px] max-h-[85vh] bg-white dark:bg-[#14120E] rounded-3xl z-[210] flex flex-col overflow-hidden shadow-2xl border-2 border-stone-200 dark:border-stone-800 font-['Be_Vietnam_Pro'] animate-scale-in">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1A1814]">
          <MagnifyingGlassIcon className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Tìm tính năng, học sinh, lớp học, giáo viên (ví dụ: Điểm danh, Lớp 10A)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm md:text-base font-bold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 text-xs"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl bg-stone-200 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300 uppercase tracking-widest hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto max-h-[60vh] p-3 space-y-1.5 custom-scrollbar bg-white dark:bg-[#14120E]"
        >
          {isSearching && searchResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 font-bold flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              Đang tìm kiếm dữ liệu...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Không tìm thấy kết quả phù hợp</p>
              <p className="text-xs text-stone-400">Thử tìm kiếm với từ khóa khác như tên học sinh, tên lớp hoặc tên trang.</p>
            </div>
          ) : (
            <>
              {!searchQuery && (
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                  Gợi ý truy cập nhanh
                </div>
              )}

              {searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const IconComponent = item.icon || SparklesIcon;

                return (
                  <button
                    key={`${item.href}-${idx}`}
                    ref={isSelected ? selectedRef : null}
                    onClick={() => {
                      router.push(item.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer group',
                      isSelected
                        ? 'bg-amber-500/10 dark:bg-[#25221D] text-amber-900 dark:text-amber-300 border-2 border-amber-500/50 shadow-sm'
                        : 'bg-stone-50/50 dark:bg-[#181612] hover:bg-stone-100 dark:hover:bg-[#201D18] text-stone-800 dark:text-stone-200 border border-stone-100 dark:border-stone-800/60'
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          'p-2.5 rounded-xl shrink-0 transition-colors',
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-200/70 dark:bg-[#25221D] text-stone-600 dark:text-stone-300 group-hover:text-amber-500'
                        )}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs md:text-sm font-black truncate">{item.name}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase tracking-wider shrink-0">
                            {item.category}
                          </span>
                        </div>
                        {item.sub && (
                          <p className="text-[11px] text-stone-400 dark:text-stone-400 truncate mt-0.5">
                            {item.sub}
                          </p>
                        )}
                      </div>
                    </div>

                    <ArrowRightIcon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-transform',
                        isSelected ? 'text-amber-500 translate-x-0.5' : 'text-stone-300 dark:text-stone-700 opacity-0 group-hover:opacity-100'
                      )}
                    />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1A1814] flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-bold">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[9px] text-stone-700 dark:text-stone-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[9px] text-stone-700 dark:text-stone-300">↓</kbd>
              <span>Điều hướng</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[9px] text-stone-700 dark:text-stone-300">ENTER</kbd>
              <span>Truy cập</span>
            </span>
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">
            BH-EDU SPOTLIGHT SEARCH
          </span>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { routes } from "@/lib/routes";

// Heroicons SVG Components
const Icons = {
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Book: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  QrCode: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  DocumentText: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Wrench: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  AcademicCap: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ClipboardList: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  CurrencyDollar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Cog: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  links: NavLink[];
  collapsed?: boolean;
}

export default function Sidebar() {
  const { profile } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [_showProfileMenu, _setShowProfileMenu] = useState(false);
  const [_collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!profile) return null;

  const role = (profile.role ?? "student") as "admin" | "staff" | "teacher" | "student";

  const _handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const _toggleSection = (title: string) => {
    setCollapsedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  // Define navigation structure based on role (like Canvas/Moodle)
  const getNavSections = (): NavSection[] => {
    if (role === "admin") {
      return [
        {
          title: "Bảng điều khiển",
          links: [
            { href: "/dashboard", label: "Trang chủ", icon: <Icons.Home /> },
          ]
        },
        {
          title: "Học thuật",
          links: [
            { href: "/dashboard/courses", label: "Danh mục khóa học", icon: <Icons.Book /> },
            { href: "/dashboard/classes", label: "Lớp học của tôi", icon: <Icons.BookOpen /> },
            { href: "/dashboard/students", label: "Học sinh", icon: <Icons.Users /> },
          ]
        },
        {
          title: "Điểm danh",
          links: [
            { href: "/dashboard/attendance/mark", label: "Đánh dấu điểm danh", icon: <Icons.CheckCircle /> },
            { href: "/dashboard/attendance/qr", label: "Mã QR", icon: <Icons.QrCode /> },
            { href: "/dashboard/attendance/reports", label: "Báo cáo", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Điểm số",
          links: [
            { href: routes.grades.assignments(), label: "Bài tập", icon: <Icons.ClipboardList /> },
            { href: routes.grades.entry(), label: "Nhập điểm", icon: <Icons.Chart /> },
            { href: routes.grades.vietnameseEntry(), label: "Nhập điểm VN", icon: <Icons.Chart /> },
            { href: routes.grades.conductEntry(), label: "Điểm hạnh kiểm", icon: <Icons.AcademicCap /> },
            { href: routes.grades.reports(), label: "Báo cáo điểm", icon: <Icons.Document /> },
            { href: routes.grades.analytics(), label: "Phân tích", icon: <Icons.TrendingUp /> },
          ]
        },
        {
          title: "Quản trị",
          links: [
            { href: "/dashboard/admin/diagnostic", label: "🔧 Chẩn đoán API", icon: <Icons.Wrench /> },
            { href: "/dashboard/admin/students", label: "Quản trị — Học sinh", icon: <Icons.Users /> },
            { href: "/dashboard/classes", label: "Quản lý lớp học", icon: <Icons.Book /> },
            { href: "/dashboard/users", label: "Quản lý người dùng/giáo viên", icon: <Icons.User /> },
            { href: "/dashboard/assignments", label: "Quản lý bài tập", icon: <Icons.ClipboardList /> },
            { href: "/dashboard/attendance", label: "Quản lý điểm danh", icon: <Icons.Calendar /> },
            { href: "/dashboard/attendance/reports", label: "Báo cáo điểm danh", icon: <Icons.Chart /> },
            { href: routes.grades.list(), label: "Quản lý điểm số", icon: <Icons.AcademicCap /> },
            { href: "/dashboard/students/import", label: "Nhập học sinh", icon: <Icons.Download /> },
            { href: "/dashboard/admin/data", label: "Dữ liệu — Nhanh", icon: <Icons.Search /> },
            { href: "/dashboard/admin/data-viewer", label: "Trình xem dữ liệu (bảng)", icon: <Icons.Document /> },
            { href: "/dashboard/admin/data-dump", label: "Xuất dữ liệu", icon: <Icons.Download /> },
            // Impersonation removed: feature disabled / deferred
            { href: "/dashboard/admin/student", label: "Học sinh (cũ)", icon: <Icons.DocumentText /> },
            { href: "/dashboard/reports", label: "Báo cáo", icon: <Icons.DocumentText /> },
          ]
        },
        {
          title: "Cài đặt",
          links: [
            { href: "/dashboard/admin/academic-years", label: "Năm học", icon: <Icons.Calendar /> },
            { href: "/dashboard/admin/grading-scales", label: "Thang điểm", icon: <Icons.Chart /> },
            { href: "/dashboard/admin/fee-types", label: "Loại phí", icon: <Icons.CurrencyDollar /> },
            { href: "/dashboard/settings", label: "Cài đặt chung", icon: <Icons.Cog /> },
          ]
        },
        {
          title: "Tài chính",
          links: [
            { href: "/dashboard/admin/finance/student-accounts", label: "Tài khoản học sinh", icon: <Icons.Users /> },
            { href: "/dashboard/admin/finance/invoices", label: "Hóa đơn", icon: <Icons.Document /> },
            { href: "/dashboard/admin/finance/payments", label: "Thanh toán", icon: <Icons.CreditCard /> },
            { href: "/dashboard/admin/finance/reports", label: "Báo cáo tài chính", icon: <Icons.Chart /> },
          ]
        }
      ];
    } else if (role === "staff") {
      // Staff: Sub-admin with operational access (no system config)
      return [
        {
          title: "Bảng điều khiển",
          links: [
            { href: "/dashboard", label: "Trang chủ", icon: <Icons.Home /> },
          ]
        },
        {
          title: "Nhân sự",
          links: [
            { href: "/dashboard/students", label: "Học sinh", icon: <Icons.Users /> },
            { href: "/dashboard/users", label: "Giáo viên", icon: <Icons.User /> },
            { href: "/dashboard/students/import", label: "Nhập học sinh", icon: <Icons.Download /> },
          ]
        },
        {
          title: "Học thuật",
          links: [
            { href: "/dashboard/courses", label: "Khóa học", icon: <Icons.Book /> },
            { href: "/dashboard/classes", label: "Lớp học", icon: <Icons.BookOpen /> },
          ]
        },
        {
          title: "Điểm danh",
          links: [
            { href: "/dashboard/attendance", label: "Tổng quan", icon: <Icons.Calendar /> },
            { href: "/dashboard/attendance/mark", label: "Đánh dấu điểm danh", icon: <Icons.CheckCircle /> },
            { href: "/dashboard/attendance/qr", label: "Mã QR", icon: <Icons.QrCode /> },
            { href: "/dashboard/attendance/reports", label: "Báo cáo", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Điểm số",
          links: [
            { href: routes.grades.list(), label: "Tổng quan", icon: <Icons.AcademicCap /> },
            { href: routes.grades.reports(), label: "Báo cáo điểm", icon: <Icons.Document /> },
            { href: routes.grades.analytics(), label: "Phân tích", icon: <Icons.TrendingUp /> },
          ]
        },
        {
          title: "Tài chính",
          links: [
            { href: "/dashboard/admin/finance/student-accounts", label: "Tài khoản học sinh", icon: <Icons.Users /> },
            { href: "/dashboard/admin/finance/invoices", label: "Hóa đơn", icon: <Icons.Document /> },
            { href: "/dashboard/admin/finance/payments", label: "Thanh toán", icon: <Icons.CreditCard /> },
            { href: "/dashboard/admin/finance/reports", label: "Báo cáo", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Báo cáo",
          links: [
            { href: "/dashboard/reports", label: "Tất cả báo cáo", icon: <Icons.DocumentText /> },
            { href: "/dashboard/admin/data", label: "Xuất dữ liệu", icon: <Icons.Download /> },
          ]
        }
      ];
    } else if (role === "teacher") {
      return [
        {
          title: "Bảng điều khiển",
          links: [
            { href: "/dashboard", label: "Trang chủ", icon: <Icons.Home /> },
          ]
        },
        {
          title: "Dạy học",
          links: [
            { href: "/dashboard/courses", label: "Khóa học của tôi", icon: <Icons.Book /> },
            { href: "/dashboard/classes", label: "Lớp học của tôi", icon: <Icons.BookOpen /> },
          ]
        },
        {
          title: "Điểm danh",
          links: [
            { href: "/dashboard/attendance/mark", label: "Đánh dấu điểm danh", icon: <Icons.CheckCircle /> },
            { href: "/dashboard/attendance/qr", label: "Mã QR", icon: <Icons.QrCode /> },
            { href: "/dashboard/attendance/reports", label: "Báo cáo", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Điểm số",
          links: [
            { href: routes.grades.assignments(), label: "Bài tập", icon: <Icons.ClipboardList /> },
            { href: routes.grades.entry(), label: "Nhập điểm", icon: <Icons.Chart /> },
            { href: routes.grades.conductEntry(), label: "Điểm hạnh kiểm", icon: <Icons.AcademicCap /> },
            { href: routes.grades.reports(), label: "Báo cáo điểm", icon: <Icons.Document /> },
            { href: routes.grades.analytics(), label: "Phân tích", icon: <Icons.TrendingUp /> },
          ]
        }
      ];
    } else {
      // Student view
      return [
        {
          title: "Bảng điều khiển",
          links: [
            { href: "/dashboard", label: "Trang chủ", icon: <Icons.Home /> },
          ]
        },
        {
          title: "Học tập",
          links: [
            { href: "/dashboard/classes", label: "Lớp học của tôi", icon: <Icons.BookOpen /> },
            { href: "/dashboard/assignments", label: "Bài tập", icon: <Icons.ClipboardList /> },
            { href: "/dashboard/scores", label: "Điểm của tôi", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Điểm danh",
          links: [
            { href: "/dashboard/attendance", label: "Điểm danh của tôi", icon: <Icons.Calendar /> },
            { href: "/checkin", label: "Check-in QR", icon: <Icons.QrCode /> },
          ]
        }
      ];
    }
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 
          bg-primary text-white rounded-xl 
          shadow-md
          hover:bg-primary-hover
          transition-all duration-200 cursor-pointer"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72 fixed h-full overflow-y-auto z-40 transition-all duration-300 ease-out
        bg-surface border-r border-border
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-5">
        {/* Header - Brand Card */}
        <div className="mb-8">
          <div className="px-5 py-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <h2 className="text-2xl font-bold tracking-tight font-heading">BH-EDU</h2>
            <p className="text-sm mt-1 text-primary-100 font-medium">Bui Hoang Education</p>
          </div>
          <div className="mt-4 px-1">
            <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full
              bg-surface-secondary text-secondary border border-border">
              {role} Portal
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {navSections.map((section) => {
            return (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold border border-primary-100 dark:border-primary-800"
                            : "text-secondary hover:bg-surface-hover hover:text-foreground"
                        }`}
                      >
                        <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary dark:text-primary-400' : 'text-muted group-hover:text-secondary'}`}>{link.icon}</span>
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )})}
        </nav>
      </div>
    </aside>
    </>
  );
}

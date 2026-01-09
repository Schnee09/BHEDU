"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}

// Map routes to friendly names
const routeLabels: Record<string, string> = {
  dashboard: "Bảng điều khiển",
  students: "Học sinh",
  teachers: "Giáo viên",
  classes: "Lớp học",
  courses: "Khóa học",
  attendance: "Điểm danh",
  grades: "Điểm số",
  assignments: "Bài tập",
  reports: "Báo cáo",
  settings: "Cài đặt",
  profile: "Hồ sơ",
  users: "Người dùng",
  admin: "Quản trị",
  finance: "Tài chính",
  import: "Nhập dữ liệu",
  mark: "Đánh dấu điểm danh",
  qr: "Mã QR",
  entry: "Nhập điểm",
  analytics: "Phân tích",
  invoices: "Hóa đơn",
  payments: "Thanh toán",
  accounts: "Tài khoản",
  "student-accounts": "Tài khoản học sinh",
  "academic-years": "Năm học",
  "grading-scales": "Thang điểm",
  "fee-types": "Loại phí",
  diagnostic: "Chẩn đoán",
  notifications: "Thông báo",
  edit: "Chỉnh sửa",
  progress: "Tiến độ",
  transcript: "Bảng điểm",
};

export default function Breadcrumb() {
  const pathname = usePathname();

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    if (!pathname) return [];

    // Split the path and filter empty strings
    const segments = pathname.split("/").filter(Boolean);

    // Build breadcrumb items
    const items: BreadcrumbItem[] = [];
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip dynamic segments (IDs) - they start with common ID patterns
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
        /^\d+$/.test(segment);

      if (isId) {
        // Replace ID with a more meaningful label
        items.push({
          label: "Chi tiết",
          href: currentPath,
          isCurrentPage: index === segments.length - 1,
        });
      } else {
        items.push({
          label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
          href: currentPath,
          isCurrentPage: index === segments.length - 1,
        });
      }
    });

    return items;
  }, [pathname]);

  // Don't render if only one item (just dashboard)
  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 animate-fade-in">
      <ol className="flex items-center gap-2 text-sm">
        {/* Home Icon */}
        <li className="flex items-center">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg transition-all duration-200 group
              text-muted hover:text-primary hover:bg-primary/10
              dark:hover:bg-primary/20 dark:hover:text-primary"
            aria-label="Go to dashboard"
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </li>

        {breadcrumbs.map((item) => (
          <li key={item.href} className="flex items-center gap-2">
            {/* Separator */}
            <svg className="w-4 h-4 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>

            {item.isCurrentPage ? (
              <span
                className="px-2.5 py-1 rounded-lg font-medium text-foreground
                  bg-primary/10 dark:bg-primary/20"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="px-2.5 py-1 rounded-lg font-medium transition-all duration-200
                  text-muted hover:text-primary hover:bg-primary/5
                  dark:hover:bg-primary/10 dark:hover:text-primary
                  active:scale-95"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * PageHeader component with breadcrumb and title
 * Use this at the top of dashboard pages for consistent layout
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <Breadcrumb />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">{title}</h1>
          {description && (
            <p className="mt-1 text-muted">{description}</p>
          )}
        </div>
        {action && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

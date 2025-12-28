/**
 * Grades Navigation Page - Refactored with Modern Components
 * 
 * Features:
 * - Uses Card components for navigation
 * - Uses useUser hook for role checking
 * - Better visual hierarchy
 * - Responsive grid layout
 */

"use client";

import Link from "next/link";
import { useUser } from "@/hooks";
import { LoadingState } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { PencilSquareIcon, ClipboardDocumentListIcon, DocumentChartBarIcon, DocumentTextIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

interface NavCard {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
}

const navCards: NavCard[] = [
  {
    href: "/dashboard/grades/entry",
    title: "Nhập điểm",
    description: "Nhập điểm sử dụng thang điểm Việt Nam",
    icon: PencilSquareIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/grades/analytics",
    title: "Phân tích điểm",
    description: "Xem hiệu suất lớp học và phân bố điểm",
    icon: DocumentChartBarIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/grades/reports",
    title: "Báo cáo điểm",
    description: "Tạo và xuất báo cáo điểm chi tiết",
    icon: DocumentTextIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/scores",
    title: "Điểm của tôi",
    description: "Xem điểm và kết quả bài tập của bạn",
    icon: AcademicCapIcon,
    roles: ["student"],
  },
];

export default function GradesPageModern() {
  const { user, loading } = useUser();

  if (loading) {
    return <LoadingState message="Đang tải..." />;
  }

  const userRole = user?.role || "";
  const availableCards = navCards.filter(card =>
    card.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Điểm & Bài tập</h1>
              <p className="mt-2 text-gray-600">
                {userRole === "student"
                  ? "Xem điểm và tiến độ học tập của bạn"
                  : "Quản lý điểm, bài tập và báo cáo"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        {availableCards.length > 0 ? (
          <div className="mb-12">
            <h2 className="sr-only">Các chức năng điểm</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCards.map((card) => (
                <Link key={card.href} href={card.href}>
                  <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group cursor-pointer">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-200">
                          <card.icon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                            {card.title}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {card.description}
                          </p>
                          <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span>Mở chức năng</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quyền truy cập bị hạn chế
            </h3>
            <p className="text-gray-600">
              Bạn không có quyền truy cập các tính năng điểm.
            </p>
          </div>
        )}

        {/* Quick Stats for Teachers/Admins */}
        {(userRole === "teacher" || userRole === "admin") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê nhanh</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Điểm đang chờ</span>
                  <span className="font-bold text-xl text-gray-600">-</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Tổng số học sinh</span>
                  <span className="font-bold text-xl text-gray-600">-</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
              <div className="text-center py-8 text-gray-500">
                <Icons.Grades className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p>Không có hoạt động gần đây</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hạn nộp sắp tới</h3>
              <div className="text-center py-8 text-gray-500">
                <Icons.Attendance className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p>Không có hạn nộp sắp tới</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

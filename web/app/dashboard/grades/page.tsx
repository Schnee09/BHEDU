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
import { Card, LoadingState } from "@/components/ui";
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
    href: "/dashboard/grades/vietnamese-entry",
    title: "Nhập điểm Việt Nam",
    description: "Nhập điểm sử dụng thang điểm 10 của Việt Nam với trọng số",
    icon: AcademicCapIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/grades/entry",
    title: "Nhập điểm tiêu chuẩn",
    description: "Nhập và cập nhật điểm của học sinh cho bài tập",
    icon: PencilSquareIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/grades/assignments",
    title: "Quản lý bài tập",
    description: "Tạo và quản lý bài tập và danh mục",
    icon: ClipboardDocumentListIcon,
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Điểm & Bài tập</h1>
          <p className="text-lg text-gray-600">
            {userRole === "student" 
              ? "Xem điểm và tiến độ học tập của bạn"
              : "Quản lý điểm, bài tập và báo cáo"}
          </p>
        </div>
        
        {/* Navigation Cards */}
        {availableCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {availableCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <Card 
                  className="h-full p-8 bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer border-gray-200"
                >
                  <div className="flex flex-col items-start h-full">
                    <div className="p-3 bg-stone-100 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      <card.icon className="w-10 h-10 text-stone-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-900 mb-3">
                      {card.title}
                    </h2>
                    <p className="text-stone-500 text-base flex-grow leading-relaxed">
                      {card.description}
                    </p>
                    <div className="mt-6 px-6 py-2 bg-stone-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-stone-800 transition-colors">
                      Mở
                      <Icons.ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16" padding="lg">
            <Icons.Lock className="w-12 h-12 text-stone-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-stone-900 mb-3">
              Quyền truy cập bị hạn chế
            </h3>
            <p className="text-stone-500 text-lg">
              Bạn không có quyền truy cập các tính năng điểm.
            </p>
          </Card>
        )}
        
        {/* Quick Stats for Teachers/Admins */}
        {(userRole === "teacher" || userRole === "admin") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg" className="bg-stone-50 border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Thống kê nhanh</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <span className="text-stone-700 font-medium">Điểm đang chờ</span>
                  <span className="font-bold text-2xl text-stone-600">-</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <span className="text-stone-700 font-medium">Bài tập đang hoạt động</span>
                  <span className="font-bold text-2xl text-stone-600">-</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <span className="text-stone-700 font-medium">Tổng số học sinh</span>
                  <span className="font-bold text-2xl text-stone-600">-</span>
                </div>
              </div>
            </Card>
            
            <Card padding="lg" className="bg-stone-50 border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Hoạt động gần đây</h3>
              <div className="text-center py-8 text-stone-500">
                <Icons.Grades className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <p>Không có hoạt động gần đây</p>
              </div>
            </Card>
            
            <Card padding="lg" className="bg-stone-50 border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Hạn nộp sắp tới</h3>
              <div className="text-center py-8 text-stone-500">
                <Icons.Attendance className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <p>Không có hạn nộp sắp tới</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

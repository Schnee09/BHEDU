"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { School, CheckCircle2, BarChart3, Users, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">BH-EDU</span>
          </div>
          <Link href="/login">
            <Button>Đăng Nhập</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Simple */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900 dark:text-white">
                Hệ Thống Quản Lý Giáo Dục
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                Quản lý học sinh, điểm danh, điểm số và báo cáo cho trung tâm giáo dục BH-EDU.
              </p>
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 gap-2">
                  Đăng Nhập
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features - Simple Grid */}
        <section className="w-full py-12 md:py-20 bg-gray-50 dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl font-bold text-center mb-10 text-gray-900 dark:text-white">
              Tính Năng Chính
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Attendance */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Điểm Danh</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Điểm danh theo lớp, theo ngày. Báo cáo tự động.
                </p>
              </div>

              {/* Grades */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Điểm Số</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Nhập điểm miệng, 15 phút, 1 tiết, giữa kỳ, cuối kỳ.
                </p>
              </div>

              {/* Students */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Học Sinh</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Quản lý hồ sơ, lớp học, và tiến độ học tập.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Simple */}
      <footer className="w-full py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 Trung tâm Giáo dục Bùi Hoàng. Hệ thống nội bộ.
          </p>
        </div>
      </footer>
    </div>
  );
}

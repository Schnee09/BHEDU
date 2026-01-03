"use client";

import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import PublicHeader from "@/components/PublicHeader";
import { CheckCircle2, BarChart3, Users, ArrowRight, Phone, Mail, MapPin } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      {/* Navigation */}
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 -z-10"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-400/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300 animate-fade-in-up">
                <span className="flex h-2 w-2 rounded-full bg-amber-600 mr-2 animate-pulse"></span>
                Phiên bản Mới 2026
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-white animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                Hệ Thống Quản Lý <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Giáo Dục Toàn Diện</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Giải pháp tối ưu cho trung tâm <strong>Bùi Hoàng Education</strong>.
                Quản lý học sinh, điểm danh và báo cáo học tập chuyên nghiệp.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 gap-3 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 border-0 rounded-2xl">
                    Truy cập Hệ thống
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl hover:text-amber-600 dark:hover:text-amber-400">
                    Xem Tính Năng
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="w-full py-20 bg-white/50 dark:bg-gray-900/50 relative">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Tính Năng Nổi Bật</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Công cụ mạnh mẽ hỗ trợ quản lý hiệu quả</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="group glass-card rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Điểm Danh Thông Minh</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Hệ thống điểm danh nhanh chóng, chính xác. Tự động tổng hợp báo cáo chuyên cần hàng ngày, hàng tuần.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group glass-card rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Quản Lý Điểm Số</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Nhập điểm chi tiết từng môn học. Tự động tính điểm trung bình, xếp hạng và xuất phiếu báo điểm PDF.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group glass-card rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Hồ Sơ Học Sinh</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Lưu trữ thông tin học sinh, phụ huynh đầy đủ. Dễ dàng tra cứu và liên lạc khi cần thiết.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Info/Contact Section */}
        <section id="contact" className="w-full py-20 bg-gray-50 dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Về Bùi Hoàng Education
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    Chúng tôi cam kết mang đến môi trường giáo dục chất lượng cao, nơi mỗi học sinh được quan tâm và phát triển toàn diện. Hệ thống quản lý này là một phần trong nỗ lực chuyển đổi số để phục vụ phụ huynh và học sinh tốt hơn.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Địa chỉ trung tâm</p>
                      <p className="text-sm text-gray-500">TP. Hồ Chí Minh, Việt Nam</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Hotline liên hệ</p>
                      <p className="text-sm text-gray-500">0123 456 789</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Email hỗ trợ</p>
                      <p className="text-sm text-gray-500">contact@buihoang.edu.vn</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Image/Box */}
              <div className="relative h-[400px] rounded-3xl overflow-hidden glass-card flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20"></div>
                <div className="relative text-center p-8">
                  <div className="w-24 h-24 relative mx-auto mb-6 transform group-hover:scale-110 transition-transform duration-500">
                    <Image
                      src="/logo.png"
                      alt="Logo Large"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bùi Hoàng Education</h3>
                  <p className="text-amber-600 dark:text-amber-400 font-medium">Chất lượng - Đam mê - Sáng tạo</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">BH-EDU</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              © 2026 Trung tâm Giáo dục Bùi Hoàng. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-gray-500 hover:text-amber-600 transition-colors">Bảo mật</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-amber-600 transition-colors">Điều khoản</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

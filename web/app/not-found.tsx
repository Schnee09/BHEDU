'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search, Compass, BookOpen, Clock, HelpCircle } from 'lucide-react';
import Image from 'next/image';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0E0D0B] text-stone-900 dark:text-stone-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-['Be_Vietnam_Pro'] selection:bg-amber-500/30">
      {/* Glow Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Navbar Brand */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-white/10 shadow-xs group-hover:scale-105 transition-transform">
            <Image src="/logo.png" alt="BH-EDU Logo" fill sizes="32px" className="object-contain" />
          </div>
          <span className="font-black text-sm tracking-wider uppercase text-stone-800 dark:text-stone-200 group-hover:text-amber-600 transition-colors">
            BH-EDU
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          Trang giới thiệu →
        </Link>
      </header>

      {/* Main 404 Hero Container */}
      <main className="max-w-lg w-full mx-auto my-auto text-center space-y-6 sm:space-y-8 z-10 py-8">
        {/* Large 404 Visual with Glow */}
        <div className="relative inline-flex items-center justify-center">
          <span className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600/30 opacity-90 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 dark:bg-[#14120E]/90 backdrop-blur-md rounded-3xl border border-amber-500/25 shadow-xl shadow-amber-500/15 flex items-center justify-center">
              <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-white tracking-tight">
            Không tìm thấy trang này
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được thay đổi vị trí. Đừng lo, bạn có
            thể quay lại hoặc chọn các trang phổ biến bên dưới.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => router.back()}
            className="h-12 px-6 rounded-2xl bg-stone-100 dark:bg-[#1C1A16] hover:bg-stone-200 dark:hover:bg-[#25221D] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang trước</span>
          </button>

          <Link
            href="/dashboard"
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Vào Bảng điều khiển</span>
          </Link>
        </div>

        {/* Quick Links Suggestions */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-white/5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Trang thường truy cập:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/dashboard/my-schedule"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105"
            >
              <Clock className="w-3 h-3 text-amber-500" />
              Lịch học / Lịch dạy
            </Link>
            <Link
              href="/dashboard/classes"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105"
            >
              <BookOpen className="w-3 h-3 text-blue-500" />
              Danh sách lớp
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105"
            >
              <HelpCircle className="w-3 h-3 text-emerald-500" />
              Đăng nhập tài khoản
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="text-center py-2 z-10">
        <p className="text-[10px] text-stone-400 dark:text-stone-600">
          Trung tâm Giáo dục Bùi Hoàng • Cổng thông tin học vụ điện tử BH-EDU
        </p>
      </footer>
    </div>
  );
}

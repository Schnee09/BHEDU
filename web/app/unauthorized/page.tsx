'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0E0D0B] text-stone-900 dark:text-stone-100 flex items-center justify-center p-4 sm:p-6 font-['Be_Vietnam_Pro'] relative overflow-hidden selection:bg-amber-500/30">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 sm:space-y-8 z-10">
        {/* Shield Icon Box */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-[#14120E] rounded-3xl shadow-xl border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider border border-amber-500/20">
            Truy cập bị hạn chế (403)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-white tracking-tight">
            Không có quyền truy cập
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
            Tài khoản hiện tại của bạn không có quyền xem nội dung này. Nếu bạn cần truy cập chức
            năng này, vui lòng liên hệ Quản trị viên trung tâm.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => router.back()}
            className="h-12 px-6 rounded-2xl bg-stone-100 dark:bg-[#1C1A16] hover:bg-stone-200 dark:hover:bg-[#25221D] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <Link
            href="/dashboard"
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng điều khiển</span>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng nhập bằng tài khoản khác</span>
        </button>
      </div>
    </div>
  );
}

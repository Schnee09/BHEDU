'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-lg glass-premium border border-stone-200/80 dark:border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl shadow-stone-900/5 dark:shadow-black/40 text-center animate-fade-in">
        {/* Warning Icon Container */}
        <div className="mx-auto w-20 h-20 bg-amber-500/10 dark:bg-amber-500/15 rounded-3xl flex items-center justify-center mb-8 border border-amber-500/20 relative group hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-md opacity-50 animate-pulse" />
          <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-500 drop-shadow-[0_0_8px_rgba(245,166,35,0.4)] relative z-10" />
        </div>

        {/* Text details */}
        <h2 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight mb-4">
          Từ chối truy cập
        </h2>
        <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full mb-6" />

        <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base leading-relaxed mb-10 max-w-sm mx-auto">
          Tài khoản của bạn không có đủ quyền hạn để xem trang này. Vui lòng quay về trang chủ hoặc
          đăng nhập bằng tài khoản khác.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 rounded-2xl font-semibold border border-stone-200 dark:border-white/10 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-sm"
          >
            <LogOut className="w-4 h-4" />
            Tài khoản khác
          </button>
        </div>

        <button
          onClick={() => router.back()}
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" />
          Quay lại trang trước
        </button>
      </div>
    </div>
  );
}

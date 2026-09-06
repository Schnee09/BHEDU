'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { logger } from '@/lib/logger';
import { AlertCircle, RefreshCw, Home, Copy, Check, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const errorId = error.digest || `ERR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  useEffect(() => {
    // Log the error
    logger.error('Global App Router Error:', error, { errorId });

    // Report to Sentry
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error, {
        extra: { errorId, digest: error.digest },
      });
    });
  }, [error, errorId]);

  const handleCopy = () => {
    const errorDetails = `Mã lỗi: ${errorId}\nThông điệp: ${error.message || 'Lỗi không xác định'}\nThời gian: ${new Date().toLocaleString('vi-VN')}`;
    navigator.clipboard.writeText(errorDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-stone-50 dark:bg-[#0E0D0B] text-stone-900 dark:text-stone-100 font-['Be_Vietnam_Pro'] selection:bg-amber-500/30 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 dark:bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 sm:space-y-8 min-w-0 z-10">
        {/* Warning Icon Box */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-[#14120E] rounded-3xl shadow-xl border border-red-200 dark:border-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wider border border-red-500/20">
            Sự cố hệ thống
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-white tracking-tight">
            Đã có sự cố xảy ra
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
            Hệ thống vừa gặp phải một sự cố ngoài ý muốn. Dữ liệu của bạn vẫn an toàn. Hãy thử tải
            lại hoặc quay lại trang chủ.
          </p>
        </div>

        {/* Error Code Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Mã sự cố (Error ID)
            </p>
            <p className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
              {errorId}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
            title="Sao chép mã lỗi"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 text-[11px]">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Sao chép</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại ngay</span>
          </button>

          <Link
            href="/dashboard"
            className="h-12 px-6 rounded-2xl bg-stone-100 dark:bg-[#1C1A16] hover:bg-stone-200 dark:hover:bg-[#25221D] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng điều khiển</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

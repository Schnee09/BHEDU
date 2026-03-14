'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { logger } from '@/lib/logger';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        logger.error('Global App Router Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-50 dark:bg-stone-950">
            <div className="max-w-md w-full text-center space-y-8 min-w-0">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                        <div className="relative w-24 h-24 bg-white dark:bg-stone-900 rounded-[32px] shadow-xl border border-stone-200 dark:border-white/5 flex items-center justify-center">
                            <Icons.Warning className="w-12 h-12 text-red-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                        Đã có lỗi xảy ra
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                        Hệ thống gặp sự cố bất ngờ. Đừng lo lắng, dữ liệu của bạn vẫn an toàn. Vui lòng thử lại hoặc tải lại trang.
                    </p>
                    {error.digest && (
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                        onClick={() => reset()}
                        className="px-8 py-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                        Thử lại
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.assign('/dashboard')}
                        className="px-8 py-6 rounded-2xl border-stone-200 dark:border-white/10 font-bold uppercase tracking-wider transition-all active:scale-95"
                    >
                        Về Trang chủ
                    </Button>
                </div>
            </div>
        </div>
    );
}

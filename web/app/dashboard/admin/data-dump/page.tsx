'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, RefreshCw } from 'lucide-react';

export default function DataDumpRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin/backup');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4 font-['Be_Vietnam_Pro']">
      <div className="p-4 bg-amber-500/10 text-amber-500 rounded-3xl animate-bounce">
        <Database className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-black text-stone-900 dark:text-white">
          Chuyển hướng đến Trung tâm Dữ liệu & Sao lưu
        </h2>
        <p className="text-xs text-stone-500 max-w-md">
          Tính năng trích xuất dữ liệu thô (Data Dump) đã được tích hợp nâng cấp vào Trung tâm Sao lưu & Dữ liệu an toàn.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Đang chuyển hướng...
      </div>
    </div>
  );
}

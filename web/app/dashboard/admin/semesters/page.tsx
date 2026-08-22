'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { AcademicBackground } from '@/components/Academic/AcademicBackground';

export default function SemesterManagementRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin/academic-years');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-[#080808] gap-4">
      <AcademicBackground />
      <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      <p className="text-xs font-mono text-stone-400">
        Đang chuyển hướng sang trang Năm học & Học kỳ đồng bộ...
      </p>
    </div>
  );
}

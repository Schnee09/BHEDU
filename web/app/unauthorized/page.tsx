"use client";

import Link from 'next/link';
import { ShieldX, Home, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Không có quyền truy cập
          </h1>
          <p className="text-muted-foreground">
            Bạn không có quyền truy cập trang này. Nếu bạn nghĩ đây là lỗi,
            vui lòng liên hệ quản trị viên.
          </p>
        </div>

        {/* Error code */}
        <div className="py-4 px-6 bg-muted/50 rounded-xl inline-block">
          <p className="text-sm text-muted-foreground">Mã lỗi</p>
          <p className="font-mono text-2xl font-bold text-foreground">403</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground pt-4">
          Nếu bạn cần quyền truy cập, hãy liên hệ quản trị viên hoặc
          người có thẩm quyền trong tổ chức của bạn.
        </p>
      </div>
    </div>
  );
}

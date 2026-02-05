'use client';

/**
 * Payment Result Page
 * 
 * Displays the result of a VNPay payment transaction.
 */

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { formatCurrency } from '@/lib/payments/vnpay';
import { Suspense } from 'react';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

function PaymentResultContent() {
    const searchParams = useSearchParams();

    const success = searchParams.get('success') === 'true';
    const orderId = searchParams.get('orderId') || '';
    const amount = parseInt(searchParams.get('amount') || '0', 10);
    const message = searchParams.get('message') || '';
    const transactionNo = searchParams.get('transactionNo');

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50 dark:bg-stone-950 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className={cn(
                    "absolute -top-24 -right-24 w-96 h-96 blur-[120px] rounded-full opacity-20",
                    success ? "bg-emerald-500" : "bg-red-500"
                )} />
                <div className={cn(
                    "absolute -bottom-24 -left-24 w-96 h-96 blur-[120px] rounded-full opacity-10",
                    success ? "bg-blue-500" : "bg-orange-500"
                )} />
            </div>

            <Card className="max-w-md w-full rounded-[48px] border-none shadow-2xl bg-white/70 dark:bg-stone-900/40 backdrop-blur-2xl relative z-10 overflow-hidden">
                <div className="p-10 md:p-12 text-center space-y-10">
                    {/* Status Icon with Animation */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className={cn(
                                "absolute inset-0 blur-3xl rounded-full animate-pulse",
                                success ? "bg-emerald-500/30" : "bg-red-500/30"
                            )} />
                            <div className={cn(
                                "relative w-24 h-24 rounded-[32px] flex items-center justify-center border shadow-xl transition-transform hover:scale-105 duration-500",
                                success
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600"
                                    : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600"
                            )}>
                                {success ? (
                                    <Icons.Success className="w-12 h-12" />
                                ) : (
                                    <Icons.Error className="w-12 h-12" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Title & Message */}
                    <div className="space-y-4">
                        <h1 className={cn(
                            "text-3xl font-black uppercase tracking-tight",
                            success ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                        )}>
                            {success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 font-medium leading-relaxed px-2">
                            {message || (success ? 'Giao dịch của bạn đã được hệ thống ghi nhận thành công.' : 'Đã có lỗi xảy ra trong quá trình xử lý thanh toán.')}
                        </p>
                    </div>

                    {/* Transaction Details - Premium Glass List */}
                    <div className="bg-stone-100/50 dark:bg-stone-800/30 rounded-[32px] p-6 space-y-4 border border-white/40 dark:border-white/5">
                        {amount > 0 && (
                            <div className="pb-4 border-b border-stone-200 dark:border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Số tiền thanh toán</p>
                                <p className="text-3xl font-black text-amber-600 dark:text-amber-500">
                                    {formatCurrency(amount)}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {orderId && (
                                <DetailRow label="Mã đơn hàng" value={orderId} />
                            )}
                            {transactionNo && (
                                <DetailRow label="Mã VNPay" value={transactionNo} />
                            )}
                            <DetailRow label="Thời gian" value={new Date().toLocaleString('vi-VN')} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-4 pt-4">
                        <Link href="/dashboard/finance/payments" className="w-full">
                            <Button
                                className={cn(
                                    "w-full py-6 rounded-2xl font-black uppercase tracking-wider shadow-lg transition-all active:scale-95",
                                    success
                                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                        : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                                )}
                            >
                                {success ? 'Xem lịch sử' : 'Thử lại ngay'}
                            </Button>
                        </Link>
                        <Link href="/dashboard" className="w-full">
                            <Button
                                variant="outline"
                                className="w-full py-6 rounded-2xl border-stone-200 dark:border-white/10 font-black uppercase tracking-wider transition-all active:scale-95"
                            >
                                Về Trang chủ
                            </Button>
                        </Link>
                    </div>

                    {/* Support Info */}
                    {!success && (
                        <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] pt-4 opacity-60">
                            Hotline: 1900-xxxx | Email: support@bhedu.vn
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between group">
            <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-bold text-stone-700 dark:text-stone-200 font-mono group-hover:text-amber-600 transition-colors uppercase">{value}</span>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <PageErrorBoundary pageName="Kết quả thanh toán">
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-stone-200 dark:border-stone-800 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                </div>
            }>
                <PaymentResultContent />
            </Suspense>
        </PageErrorBoundary>
    );
}

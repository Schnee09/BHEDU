'use client';

/**
 * Payment Result Page
 * 
 * Displays the result of a VNPay payment transaction.
 */

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/payments/vnpay';
import { Suspense } from 'react';

function PaymentResultContent() {
    const searchParams = useSearchParams();

    const success = searchParams.get('success') === 'true';
    const orderId = searchParams.get('orderId') || '';
    const amount = parseInt(searchParams.get('amount') || '0', 10);
    const message = searchParams.get('message') || '';
    const transactionNo = searchParams.get('transactionNo');

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/5">
            <Card className="max-w-md w-full">
                <div className="p-8 text-center">
                    {/* Status Icon */}
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${success
                            ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20'
                            : 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/20'
                        }`}>
                        {success ? (
                            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>

                    {/* Status Title */}
                    <h1 className={`text-2xl font-bold mb-2 ${success ? 'text-emerald-600' : 'text-red-600'}`}>
                        {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
                    </h1>

                    {/* Message */}
                    <p className="text-muted-foreground mb-6">{message}</p>

                    {/* Transaction Details */}
                    <div className="bg-muted/5 rounded-xl p-4 mb-6 space-y-3">
                        {orderId && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Mã đơn hàng</span>
                                <span className="font-mono font-medium">{orderId}</span>
                            </div>
                        )}
                        {transactionNo && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Mã giao dịch VNPay</span>
                                <span className="font-mono font-medium">{transactionNo}</span>
                            </div>
                        )}
                        {amount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Số tiền</span>
                                <span className="font-bold text-lg text-primary">{formatCurrency(amount)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Thời gian</span>
                            <span>{new Date().toLocaleString('vi-VN')}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Link href="/dashboard/finance/payments">
                            <Button fullWidth variant={success ? 'primary' : 'outline'}>
                                {success ? 'Xem lịch sử thanh toán' : 'Thử lại'}
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button fullWidth variant="ghost">
                                Về trang chủ
                            </Button>
                        </Link>
                    </div>

                    {/* Support Info */}
                    {!success && (
                        <p className="mt-6 text-xs text-muted-foreground">
                            Nếu bạn gặp vấn đề, vui lòng liên hệ bộ phận hỗ trợ
                            <br />
                            Hotline: 1900-xxxx | Email: support@bhedu.vn
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <PaymentResultContent />
        </Suspense>
    );
}

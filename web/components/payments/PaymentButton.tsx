'use client';

/**
 * Payment Info Card Component (Simplified)
 * 
 * Displays payment information for manual bank transfer:
 * - Bank account details
 * - QR code for payment
 * - Amount due
 * - Payment status tracking
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

interface PaymentInfoProps {
    invoiceId: string;
    studentName: string;
    studentCode: string;
    amount: number;
    description: string;
    dueDate?: string;
    status: 'pending' | 'paid' | 'overdue';
    bankInfo?: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
        branch?: string;
    };
    qrCodeUrl?: string;
}

// Default bank info - can be configured in settings
const DEFAULT_BANK_INFO = {
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountHolder: 'TRƯỜNG THCS-THPT NGUYỄN BỈNH KHIÊM',
    branch: 'Chi nhánh TP.HCM',
};

/**
 * Format currency to Vietnamese Dong
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}

export default function PaymentInfoCard({
    invoiceId,
    studentName,
    studentCode,
    amount,
    description,
    dueDate,
    status,
    bankInfo = DEFAULT_BANK_INFO,
    qrCodeUrl,
}: PaymentInfoProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'paid':
                return <Badge variant="success">Đã thanh toán</Badge>;
            case 'overdue':
                return <Badge variant="danger">Quá hạn</Badge>;
            default:
                return <Badge variant="warning">Chờ thanh toán</Badge>;
        }
    };

    // Generate transfer content for bank transfer
    const transferContent = `${studentCode} ${studentName} - ${description}`;

    return (
        <Card className="overflow-hidden">
            {/* Header with status */}
            <div className="p-4 border-b border-border bg-muted/5 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-foreground">Thông tin thanh toán</h3>
                    <p className="text-sm text-muted-foreground">Mã hóa đơn: {invoiceId}</p>
                </div>
                {getStatusBadge()}
            </div>

            <div className="p-5 space-y-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 bg-muted/5 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{studentName}</p>
                        <p className="text-sm text-muted-foreground">Mã HS: {studentCode}</p>
                    </div>
                </div>

                {/* Amount */}
                <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-1">Số tiền cần thanh toán</p>
                    <p className="text-4xl font-bold text-primary">{formatCurrency(amount)}</p>
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    {dueDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Hạn thanh toán: <span className="font-medium text-foreground">{dueDate}</span>
                        </p>
                    )}
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Transfer Info */}
                    <div className="border border-border rounded-xl p-4">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Chuyển khoản ngân hàng
                        </h4>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Ngân hàng:</span>
                                <span className="font-medium">{bankInfo.bankName}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Số tài khoản:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium">{bankInfo.accountNumber}</span>
                                    <button
                                        onClick={() => copyToClipboard(bankInfo.accountNumber, 'account')}
                                        className="p-1 hover:bg-muted/20 rounded transition-colors"
                                        title="Sao chép"
                                    >
                                        {copied === 'account' ? (
                                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Chủ tài khoản:</span>
                                <span className="font-medium text-right text-xs">{bankInfo.accountHolder}</span>
                            </div>

                            {bankInfo.branch && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Chi nhánh:</span>
                                    <span className="font-medium">{bankInfo.branch}</span>
                                </div>
                            )}
                        </div>

                        {/* Transfer Content */}
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-xs text-amber-700 dark:text-amber-400 mb-1">Nội dung chuyển khoản:</p>
                            <div className="flex items-center gap-2">
                                <code className="text-sm font-medium text-amber-800 dark:text-amber-300 flex-1 truncate">
                                    {transferContent}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(transferContent, 'content')}
                                    className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded transition-colors"
                                    title="Sao chép"
                                >
                                    {copied === 'content' ? (
                                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="border border-border rounded-xl p-4">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            Quét mã QR
                        </h4>

                        <div className="flex flex-col items-center">
                            {qrCodeUrl ? (
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Code thanh toán"
                                    className="w-40 h-40 rounded-lg border border-border"
                                />
                            ) : (
                                <div className="w-40 h-40 bg-muted/10 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                                    <div className="text-center p-4">
                                        <svg className="w-12 h-12 mx-auto text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        <p className="text-xs text-muted-foreground mt-2">QR Code<br />chưa được cài đặt</p>
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                Quét mã bằng ứng dụng ngân hàng
                            </p>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">Lưu ý khi chuyển khoản:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>Vui lòng ghi đúng nội dung chuyển khoản để được xác nhận nhanh chóng</li>
                                <li>Sau khi chuyển khoản, vui lòng chờ 1-2 ngày làm việc để cập nhật trạng thái</li>
                                <li>Liên hệ văn phòng nếu sau 3 ngày chưa được cập nhật</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export { PaymentInfoCard };

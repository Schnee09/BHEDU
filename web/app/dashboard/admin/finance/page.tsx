'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Icons from '@/components/ui/Icons';
import { Button } from '@/components/ui';
import Badge from '@/components/ui/badge';
import PageGuard from '@/components/PageGuard';
import ReceivePaymentDialog from '@/components/finance/ReceivePaymentDialog';
import BankStatementImportDialog from '@/components/finance/BankStatementImportDialog';
import BankReconciliationPanel from '@/components/finance/BankReconciliationPanel';
import { useFetch } from '@/hooks/useFetch';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AcademicYear {
  id: string;
  name: string;
  is_current: boolean;
}

interface ClassOption {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes: string | null;
  student: {
    id: string;
    full_name: string;
    student_code: string;
  };
}

interface OverviewStats {
  totalInvoiced: number;
  totalPaid: number;
  totalDebt: number;
  paymentRate: number;
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
}

interface PaymentRecord {
  id: string;
  receipt_number: string | null;
  amount: number;
  refunded_amount: number;
  payment_date: string;
  status: string;
  reference_number: string | null;
  student: { id: string; full_name: string; student_code: string | null };
  payment_method: { id: string; name: string; type: string } | null;
  invoice: { id: string; invoice_number: string; total_amount: number } | null;
  allocations: Array<{
    id: string;
    amount: number;
    invoice: { id: string; invoice_number: string } | null;
  }>;
  refunds: Array<{ id: string; refund_number: string; amount: number; reason: string }>;
}

export default function FinanceDashboardPage() {
  return (
    <PageGuard permissions="finance.view">
      <FinanceDashboardContent />
    </PageGuard>
  );
}

function FinanceDashboardContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'invoices' | 'payments' | 'reconciliation'
  >('overview');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Invoice filters
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);

  // Dialog states
  const [showBulkGenModal, setShowBulkGenModal] = useState(false);
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkMonth, setBulkMonth] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkDesc, setBulkDesc] = useState('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceivePayment, setShowReceivePayment] = useState(false);
  const [showStatementImport, setShowStatementImport] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [refundPayment, setRefundPayment] = useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Fetch lookups
  const { data: yearsRes } = useFetch<{ success: boolean; data: AcademicYear[] }>(
    '/api/admin/academic-years'
  );
  const { data: classesRes } = useFetch<{ success: boolean; data: ClassOption[] }>(
    '/api/admin/classes?limit=100'
  );
  const { data: paymentMethodsRes } = useFetch<{
    success: boolean;
    data: Array<{ id: string; name: string; type: string }>;
  }>('/api/admin/finance/payment-methods');
  const paymentMethods = paymentMethodsRes?.data || [];

  const years = yearsRes?.data || [];
  const classes = classesRes?.data || [];

  // Set current year default
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      const current = years.find((y) => y.is_current);
      setSelectedYear(current ? current.id : years[0]?.id || '');
    }
  }, [years, selectedYear]);

  // Fetch overview stats
  const { data: overviewRes, refetch: refetchOverview } = useFetch<OverviewStats>(
    selectedYear ? `/api/admin/finance/overview?academic_year_id=${selectedYear}` : ''
  );
  const stats = overviewRes || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalDebt: 0,
    paymentRate: 0,
    totalInvoicesCount: 0,
    paidInvoicesCount: 0,
    pendingInvoicesCount: 0,
    overdueInvoicesCount: 0,
  };

  // Fetch invoices list
  const invoiceQuery = new URLSearchParams({
    page: String(invoicePage),
    limit: '15',
    ...(selectedYear && { academic_year_id: selectedYear }),
    ...(invoiceSearch && { search: invoiceSearch }),
    ...(selectedClass && { class_id: selectedClass }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(selectedMonth && { month: `${selectedMonth}-01` }),
  }).toString();

  const { data: invoicesRes, refetch: refetchInvoices } = useFetch<{
    success: boolean;
    data: Invoice[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }>(selectedYear ? `/api/admin/finance/invoices?${invoiceQuery}` : '');

  const invoices = invoicesRes?.data || [];
  const pagination = invoicesRes?.pagination || { total: 0, page: 1, pageSize: 15, totalPages: 1 };

  const { data: paymentsRes, refetch: refetchPayments } = useFetch<{
    success: boolean;
    data: PaymentRecord[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }>(
    selectedYear
      ? `/api/admin/finance/payments?academic_year_id=${selectedYear}&page=${paymentPage}&limit=20`
      : ''
  );
  const payments = paymentsRes?.data || [];
  const paymentPagination = paymentsRes?.pagination || {
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  };

  // Sync / Refetch helper
  const refreshAll = () => {
    refetchOverview();
    refetchInvoices();
    refetchPayments();
  };

  // Chart data mapping
  const chartData = [
    { name: 'Đã đóng', value: stats.totalPaid },
    { name: 'Nợ đọng', value: stats.totalDebt },
  ];

  const colors = ['#10b981', '#ef4444'];

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkClassId || !bulkMonth || !bulkDueDate) return;

    setIsSubmittingBulk(true);
    try {
      const res = await fetch('/api/admin/finance/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: bulkClassId,
          academic_year_id: selectedYear,
          month: `${bulkMonth}-01`,
          due_date: bulkDueDate,
          amount: bulkAmount ? Number(bulkAmount) : undefined,
          description: bulkDesc || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Tạo thành công ${data.data.generatedCount} hóa đơn học phí!`);
        setShowBulkGenModal(false);
        setBulkClassId('');
        setBulkMonth('');
        setBulkDueDate('');
        setBulkAmount('');
        setBulkDesc('');
        refreshAll();
      } else {
        alert(`Lỗi: ${data.error || 'Không thể tạo hóa đơn hàng loạt'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi kết nối');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleOpenPayModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPayAmount(String(invoice.total_amount - invoice.paid_amount));
    setPayMethod('');
    setPayRef('');
    setPayNotes('');
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !payAmount || !payMethod) return;

    setIsSubmittingPay(true);
    try {
      const res = await fetch(`/api/admin/finance/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payAmount),
          payment_method_id: payMethod,
          reference_number: payRef || null,
          notes: payNotes || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Ghi nhận thanh toán hóa đơn thành công!');
        setShowPayModal(false);
        setSelectedInvoice(null);
        refreshAll();
      } else {
        alert(`Lỗi: ${data.error || 'Không thể ghi nhận thanh toán'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi kết nối');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleOpenRefund = (payment: PaymentRecord) => {
    setRefundPayment(payment);
    setRefundAmount(String(Number(payment.amount) - Number(payment.refunded_amount || 0)));
    setRefundReason('');
  };

  const handleRefund = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!refundPayment) return;
    setIsSubmittingRefund(true);
    try {
      const response = await fetch(`/api/admin/finance/payments/${refundPayment.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(refundAmount), reason: refundReason }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Không thể hoàn tiền');
      setRefundPayment(null);
      refreshAll();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể hoàn tiền');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    const reason = window.prompt('Nhập lý do hủy hóa đơn (ít nhất 3 ký tự):');
    if (!reason) return;
    const response = await fetch(`/api/admin/finance/invoices/${invoice.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.error || 'Không thể hủy hóa đơn');
      return;
    }
    refreshAll();
  };

  const handleCopyZaloTuition = (inv: Invoice) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bhedu.vn';
    const invoiceUrl = `${origin}/dashboard/students/${inv.student?.id || ''}`;
    const dueDateStr = new Date(inv.due_date).toLocaleDateString('vi-VN');

    const msg = `[TRUNG TÂM GIÁO DỤC BÙI HOÀNG - THÔNG BÁO HỌC PHÍ]
Kính gửi Quý Phụ huynh học sinh ${inv.student?.full_name || ''},
Trung tâm xin gửi thông báo học phí:
- Mã hóa đơn: ${inv.invoice_number}
- Số tiền cần đóng: ${(inv.total_amount - inv.paid_amount).toLocaleString('vi-VN')} VNĐ (Tổng: ${inv.total_amount.toLocaleString('vi-VN')} VNĐ)
- Hạn nộp: ${dueDateStr}
- Trạng thái: ${inv.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
- Tra cứu chi tiết hóa đơn: ${invoiceUrl}
(Mọi thắc mắc xin liên hệ Hotline/Kế toán trung tâm: 0899 060 686).`;

    navigator.clipboard.writeText(msg);
    alert('Đã sao chép tin nhắn Zalo thông báo học phí!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Icons.Finance className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
              Quản lý Tài chính & Học phí
            </h1>
          </div>
          <p className="text-sm text-stone-500 max-w-2xl">
            Trung tâm BHEDU: Quản lý học phí học sinh, tự động phát hành hóa đơn hàng tháng và quản
            lý dòng tiền.
          </p>
        </div>

        {/* Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                Năm học {y.name}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setShowStatementImport(true)}
            variant="outline"
            className="rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Icons.Upload className="w-4 h-4" />
            Nhập sao kê
          </Button>

          <Button
            onClick={() => setShowReceivePayment(true)}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Icons.Finance className="w-4 h-4" />
            Ghi nhận khoản thu
          </Button>

          <Button
            onClick={() => setShowBulkGenModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Icons.Add className="w-4 h-4" />
            Tạo hóa đơn tháng
          </Button>

          <a href="/dashboard/admin/finance/tuition-matrix">
            <Button className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90 rounded-xl text-sm font-bold flex items-center gap-2">
              <Icons.Layout className="w-4 h-4" />
              Học phí theo lớp
            </Button>
          </a>
        </div>
      </div>

      <ReceivePaymentDialog
        open={showReceivePayment}
        academicYearId={selectedYear}
        paymentMethods={paymentMethods}
        onClose={() => setShowReceivePayment(false)}
        onSuccess={refreshAll}
      />
      <BankStatementImportDialog
        open={showStatementImport}
        onClose={() => setShowStatementImport(false)}
        onSuccess={refreshAll}
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Danh sách hóa đơn
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Phiếu thu & hoàn tiền
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'reconciliation'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Đối soát ngân hàng
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-12 animate-fadeIn">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="glass-crystal rounded-3xl p-6 border-l-4 border-l-blue-500">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                Tổng phát hành
              </p>
              <p className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
                ₫{stats.totalInvoiced.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-stone-400 mt-2 font-medium">
                Hóa đơn đã tạo trong năm học
              </p>
            </Card>

            <Card className="glass-crystal rounded-3xl p-6 border-l-4 border-l-green-500">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                Tổng thu thực tế
              </p>
              <p className="text-3xl font-black tracking-tight text-green-600 dark:text-green-400">
                ₫{stats.totalPaid.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-stone-400 mt-2 font-medium">
                Doanh thu thực tế đã hoàn thành
              </p>
            </Card>

            <Card className="glass-crystal rounded-3xl p-6 border-l-4 border-l-red-500">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                Công nợ (Còn nợ)
              </p>
              <p className="text-3xl font-black tracking-tight text-red-600 dark:text-red-400">
                ₫{stats.totalDebt.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-stone-400 mt-2 font-medium">
                Số tiền học sinh còn nợ trung tâm
              </p>
            </Card>

            <Card className="glass-crystal rounded-3xl p-6 border-l-4 border-l-amber-500">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                Tỷ lệ thanh toán
              </p>
              <p className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                {stats.paymentRate}%
              </p>
              <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${stats.paymentRate}%` }}
                />
              </div>
            </Card>
          </div>

          {/* Charts & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="glass-crystal rounded-3xl p-6 lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold tracking-tight">Doanh thu vs Công nợ</h3>
              <div className="h-64 w-full min-w-0">
                {mounted && (
                  <ResponsiveContainer
                    width="100%"
                    height={256}
                    minWidth={0}
                    minHeight={256}
                    initialDimension={{ width: 500, height: 256 }}
                  >
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis
                        stroke="#888888"
                        tickFormatter={(v) => `₫${(v / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        formatter={(v: any) => [`₫${v.toLocaleString('vi-VN')}`, 'Số tiền']}
                      />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="glass-crystal rounded-3xl p-6 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-4">Trạng thái Hóa đơn</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Đã thanh toán</span>
                    </div>
                    <span className="text-sm font-bold">{stats.paidInvoicesCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">Chờ thanh toán</span>
                    </div>
                    <span className="text-sm font-bold">{stats.pendingInvoicesCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Quá hạn</span>
                    </div>
                    <span className="text-sm font-bold">{stats.overdueInvoicesCount}</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-stone-100 dark:border-white/5 flex items-center justify-between text-xs text-stone-500">
                <span>Tổng số hóa đơn:</span>
                <span className="font-bold text-stone-800 dark:text-white">
                  {stats.totalInvoicesCount}
                </span>
              </div>
            </Card>
          </div>
        </div>
      ) : activeTab === 'invoices' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters Bar */}
          <Card className="glass-crystal rounded-3xl p-6 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên học sinh hoặc Mã số..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm font-semibold focus:outline-none"
            >
              <option value="">Tất cả Lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm font-semibold focus:outline-none"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="pending">Chờ thanh toán (Pending)</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="paid">Đã thanh toán (Paid)</option>
              <option value="overdue">Quá hạn</option>
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
            />

            <Button
              onClick={() => {
                setInvoiceSearch('');
                setSelectedClass('');
                setSelectedStatus('');
                setSelectedMonth('');
                setInvoicePage(1);
              }}
              className="bg-stone-200 hover:bg-stone-300 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-bold"
            >
              Xóa lọc
            </Button>
          </Card>

          {/* Invoices Table */}
          <Card className="glass-crystal rounded-3xl p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-150 dark:divide-white/5">
                <thead>
                  <tr className="text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Mã hóa đơn</th>
                    <th className="px-6 py-4">Học sinh</th>
                    <th className="px-6 py-4">Mã số</th>
                    <th className="px-6 py-4">Ngày phát hành</th>
                    <th className="px-6 py-4">Hạn đóng</th>
                    <th className="px-6 py-4">Tổng tiền</th>
                    <th className="px-6 py-4">Đã đóng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-stone-400 font-medium">
                        Không tìm thấy hóa đơn nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-sm">{inv.invoice_number}</td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          {inv.student?.full_name}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-stone-500">
                          {inv.student?.student_code || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500">
                          {new Date(inv.issue_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500">
                          {new Date(inv.due_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">
                          ₫{inv.total_amount.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                          ₫{inv.paid_amount.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            color={
                              inv.status === 'paid'
                                ? 'green'
                                : inv.status === 'cancelled'
                                  ? 'gray'
                                  : inv.status === 'overdue'
                                    ? 'red'
                                    : 'yellow'
                            }
                            className="rounded-full uppercase text-[9px] font-black px-2.5 py-1"
                          >
                            {inv.status === 'paid'
                              ? 'Đã đóng'
                              : inv.status === 'partial'
                                ? 'Đã đóng một phần'
                                : inv.status === 'cancelled'
                                  ? 'Đã hủy'
                                  : inv.status === 'pending'
                                    ? 'Chờ thu'
                                    : 'Quá hạn'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyZaloTuition(inv)}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold transition-colors"
                              title="Sao chép tin nhắn Zalo gửi phụ huynh"
                            >
                              Sao chép Zalo
                            </button>
                            {!['paid', 'cancelled'].includes(inv.status) && (
                              <Button
                                onClick={() => handleOpenPayModal(inv)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs py-1.5 px-3 font-semibold"
                              >
                                Ghi nhận đóng
                              </Button>
                            )}
                            {Number(inv.paid_amount) === 0 && inv.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleCancelInvoice(inv)}
                                className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
                              >
                                Hủy hóa đơn
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-white/5 mt-4">
                <span className="text-xs text-stone-500">
                  Hiển thị hóa đơn thứ {pagination.page} của {pagination.totalPages} trang
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                    disabled={invoicePage === 1}
                    className="px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-900 border rounded-lg"
                  >
                    Trước
                  </Button>
                  <Button
                    onClick={() => setInvoicePage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={invoicePage === pagination.totalPages}
                    className="px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-900 border rounded-lg"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : activeTab === 'payments' ? (
        <div className="space-y-6 animate-fadeIn">
          <Card className="glass-crystal overflow-hidden rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-stone-900 dark:text-white">
                  Lịch sử phiếu thu
                </h2>
                <p className="text-xs text-stone-500">
                  Phiếu đã hoàn vẫn được giữ lại để đối soát và kiểm tra lịch sử.
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                {paymentPagination.total} phiếu
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-150 dark:divide-white/5">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-stone-500">
                    <th className="px-4 py-3">Số phiếu</th>
                    <th className="px-4 py-3">Học sinh</th>
                    <th className="px-4 py-3">Phân bổ</th>
                    <th className="px-4 py-3">Ngày thu</th>
                    <th className="px-4 py-3">Phương thức</th>
                    <th className="px-4 py-3 text-right">Đã thu</th>
                    <th className="px-4 py-3 text-right">Đã hoàn</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-stone-500">
                        Chưa có phiếu thu trong năm học này.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => {
                      const refundable =
                        Number(payment.amount) - Number(payment.refunded_amount || 0);
                      const allocated = (payment.allocations || []).reduce(
                        (sum, allocation) => sum + Number(allocation.amount),
                        0
                      );
                      const unallocated = Math.max(0, refundable - allocated);
                      return (
                        <tr key={payment.id} className="hover:bg-stone-50/60 dark:hover:bg-white/5">
                          <td className="px-4 py-3 text-sm font-bold">
                            {payment.receipt_number || 'Phiếu cũ'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold">{payment.student?.full_name}</p>
                            <p className="text-[11px] text-stone-500">
                              {payment.student?.student_code || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">
                            <p className="font-bold">{payment.allocations?.length || 0} khoản</p>
                            {unallocated > 0 ? (
                              <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                Chưa phân bổ ₫{unallocated.toLocaleString('vi-VN')}
                              </p>
                            ) : (
                              <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                                Đã phân bổ đủ
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-500">
                            {new Date(payment.payment_date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {payment.payment_method?.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">
                            ₫{Number(payment.amount).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-rose-600">
                            {Number(payment.refunded_amount || 0) > 0
                              ? `₫${Number(payment.refunded_amount).toLocaleString('vi-VN')}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              disabled={refundable <= 0}
                              onClick={() => handleOpenRefund(payment)}
                              className="cursor-pointer rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900 dark:hover:bg-rose-950/30"
                            >
                              {refundable > 0 ? 'Hoàn tiền' : 'Đã hoàn hết'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {paymentPagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-100 pt-5 dark:border-white/5">
                <Button
                  disabled={paymentPage === 1}
                  onClick={() => setPaymentPage((page) => Math.max(1, page - 1))}
                  className="px-3 py-1.5 text-xs"
                >
                  Trước
                </Button>
                <span className="text-xs text-stone-500">
                  {paymentPage}/{paymentPagination.totalPages}
                </span>
                <Button
                  disabled={paymentPage === paymentPagination.totalPages}
                  onClick={() =>
                    setPaymentPage((page) => Math.min(paymentPagination.totalPages, page + 1))
                  }
                  className="px-3 py-1.5 text-xs"
                >
                  Sau
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <BankReconciliationPanel />
      )}

      {/* Modal 1: Bulk Generate Invoices */}
      {showBulkGenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white dark:bg-stone-950 max-w-lg w-full p-8 rounded-3xl space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowBulkGenModal(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-700"
            >
              <Icons.Close className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold tracking-tight uppercase text-emerald-600">
              Tạo Hóa Đơn Hàng Loạt Theo Lớp
            </h2>

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Lớp học</label>
                <select
                  required
                  value={bulkClassId}
                  onChange={(e) => setBulkClassId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Chọn lớp học...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    Tháng xuất hóa đơn
                  </label>
                  <input
                    type="month"
                    required
                    value={bulkMonth}
                    onChange={(e) => setBulkMonth(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    Hạn đóng học phí
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkDueDate}
                    onChange={(e) => setBulkDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">
                  Số tiền đóng tháng (VND - Tùy chọn)
                </label>
                <input
                  type="number"
                  placeholder="Để trống để lấy học phí mặc định của lớp"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">
                  Nội dung / Mô tả hóa đơn (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Học phí Lớp 9T2 - Tháng 9"
                  value={bulkDesc}
                  onChange={(e) => setBulkDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setShowBulkGenModal(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingBulk}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  {isSubmittingBulk ? 'Đang tạo...' : 'Tạo hóa đơn'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 2: Record Invoice Payment */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white dark:bg-stone-950 max-w-md w-full p-8 rounded-3xl space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowPayModal(false);
                setSelectedInvoice(null);
              }}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-700"
            >
              <Icons.Close className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold tracking-tight uppercase text-emerald-600">
              Ghi Nhận Thanh Toán Học Phí
            </h2>

            <div className="p-4 bg-stone-50 dark:bg-stone-900/40 rounded-2xl space-y-2">
              <p className="text-sm">
                Học sinh: <span className="font-bold">{selectedInvoice.student?.full_name}</span>
              </p>
              <p className="text-sm">
                Hóa đơn: <span className="font-mono">{selectedInvoice.invoice_number}</span>
              </p>
              <p className="text-sm text-red-500 font-semibold">
                Còn nợ: ₫
                {(selectedInvoice.total_amount - selectedInvoice.paid_amount).toLocaleString(
                  'vi-VN'
                )}
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">
                  Số tiền đóng thực tế (VND)
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">
                  Phương thức đóng
                </label>
                <select
                  required
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Chọn phương thức...</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">
                  Mã tham chiếu giao dịch (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mã GD ngân hàng"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Ghi chú thêm</label>
                <textarea
                  placeholder="Nhập ghi chú nếu có..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl text-sm focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyZaloTuition(selectedInvoice)}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all"
                >
                  Sao chép Zalo
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowPayModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingPay}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                  >
                    {isSubmittingPay ? 'Đang ghi nhận...' : 'Xác nhận đóng học phí'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {refundPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="relative w-full max-w-md space-y-5 rounded-3xl bg-white p-7 shadow-2xl dark:bg-stone-950">
            <button
              onClick={() => setRefundPayment(null)}
              className="absolute right-4 top-4 cursor-pointer text-stone-500 hover:text-stone-800"
              aria-label="Đóng"
            >
              <Icons.Close className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-rose-600">Hoàn tiền phiếu thu</h2>
              <p className="mt-1 text-sm text-stone-500">
                {refundPayment.receipt_number || refundPayment.id} ·{' '}
                {refundPayment.student?.full_name}
              </p>
            </div>
            <form onSubmit={handleRefund} className="space-y-4">
              <label className="block text-xs font-bold uppercase text-stone-500">
                Số tiền hoàn (VND)
                <input
                  required
                  min="1"
                  max={Number(refundPayment.amount) - Number(refundPayment.refunded_amount || 0)}
                  type="number"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-stone-900/50"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-stone-500">
                Lý do hoàn tiền
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={refundReason}
                  onChange={(event) => setRefundReason(event.target.value)}
                  className="mt-1.5 h-24 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-stone-900/50"
                  placeholder="Nhập lý do để lưu lịch sử đối soát"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setRefundPayment(null)}
                  className="rounded-xl bg-stone-100 text-stone-700"
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
                >
                  {isSubmittingRefund ? 'Đang hoàn...' : 'Xác nhận hoàn tiền'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

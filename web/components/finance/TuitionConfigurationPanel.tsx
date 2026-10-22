'use client';

import { useMemo, useState } from 'react';
import { BadgePercent, Save, Settings2, X } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';

interface StudentOption {
  id: string;
  full_name: string;
  student_code: string | null;
}
interface TuitionRate {
  id: string;
  monthly_amount: number;
  effective_from: string;
  is_active: boolean;
}
interface TuitionDiscount {
  id: string;
  student_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  effective_from: string;
  is_active: boolean;
  student?: { full_name: string; student_code: string | null };
}
interface Props {
  academicYearId: string;
  academicYearStart: string;
  classId: string;
  className: string;
  students: StudentOption[];
  onClose: () => void;
}

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
const inputClass =
  'mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-stone-700 dark:bg-stone-900';

export default function TuitionConfigurationPanel(props: Props) {
  const { academicYearId, academicYearStart, classId, className, students, onClose } = props;
  const toast = useToast();
  const effectiveDate = academicYearStart || new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState('');
  const [rateDate, setRateDate] = useState(effectiveDate);
  const [studentId, setStudentId] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountDate, setDiscountDate] = useState(effectiveDate);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState<'rate' | 'discount' | null>(null);
  const query = new URLSearchParams({
    academic_year_id: academicYearId,
    class_id: classId,
  }).toString();
  const { data: rateRes, refetch: refetchRates } = useFetch<{
    success: boolean;
    data: TuitionRate[];
  }>(`/api/admin/finance/tuition-rates?${query}`);
  const { data: discountRes, refetch: refetchDiscounts } = useFetch<{
    success: boolean;
    data: TuitionDiscount[];
  }>(`/api/admin/finance/discounts?${query}`);
  const rates = rateRes?.data || [];
  const discounts = useMemo(
    () => (discountRes?.data || []).filter((item) => item.is_active),
    [discountRes]
  );

  async function submit(url: string, body: object, type: 'rate' | 'discount') {
    setSaving(type);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Không thể lưu dữ liệu');
      toast.success(
        'Đã lưu',
        type === 'rate' ? 'Mức học phí đã được cập nhật.' : 'Ưu đãi đã được cập nhật.'
      );
      type === 'rate' ? refetchRates() : refetchDiscounts();
    } catch (error) {
      toast.error('Không thể lưu', error instanceof Error ? error.message : 'Vui lòng thử lại');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-stone-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cấu hình học phí"
    >
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Đóng cấu hình"
      />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-stone-50 p-5 shadow-2xl dark:bg-[#100F0C] sm:p-7">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Settings2 className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-wider">Cấu hình học phí</span>
            </div>
            <h2 className="text-2xl font-black text-stone-950 dark:text-white">Lớp {className}</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Mức phí và ưu đãi áp dụng riêng cho lớp và năm học này.
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-white/10"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(
                '/api/admin/finance/tuition-rates',
                {
                  class_id: classId,
                  academic_year_id: academicYearId,
                  monthly_amount: Number(amount),
                  effective_from: rateDate,
                  is_active: true,
                },
                'rate'
              );
            }}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-[#171510]"
          >
            <h3 className="font-black text-stone-900 dark:text-white">Mức học phí tháng</h3>
            {rates[0] && (
              <p className="mt-1 text-xs text-stone-500">
                Gần nhất: {money(Number(rates[0].monthly_amount))} từ {rates[0].effective_from}
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Số tiền mỗi tháng
                <input
                  required
                  min="0"
                  step="1000"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Áp dụng từ ngày
                <input
                  required
                  type="date"
                  value={rateDate}
                  onChange={(e) => setRateDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <button
              disabled={saving === 'rate'}
              className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-amber-500 dark:text-stone-950"
            >
              <Save className="h-4 w-4" />
              {saving === 'rate' ? 'Đang lưu...' : 'Lưu mức phí'}
            </button>
          </form>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(
                '/api/admin/finance/discounts',
                {
                  student_id: studentId,
                  class_id: classId,
                  academic_year_id: academicYearId,
                  discount_type: discountType,
                  discount_value: Number(discountValue),
                  effective_from: discountDate,
                  reason: reason || null,
                  is_active: true,
                },
                'discount'
              );
            }}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-[#171510]"
          >
            <div className="flex items-center gap-2">
              <BadgePercent className="h-5 w-5 text-amber-600" />
              <h3 className="font-black text-stone-900 dark:text-white">Ưu đãi học viên</h3>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 sm:col-span-2">
                Học viên
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn học viên</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                      {student.student_code ? ` (${student.student_code})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Loại ưu đãi
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className={inputClass}
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định</option>
                </select>
              </label>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Giá trị
                <input
                  required
                  min="0"
                  max={discountType === 'percentage' ? 100 : undefined}
                  step={discountType === 'percentage' ? 1 : 1000}
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Áp dụng từ ngày
                <input
                  required
                  type="date"
                  value={discountDate}
                  onChange={(e) => setDiscountDate(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Lý do
                <input
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputClass}
                  placeholder="VD: Anh chị em"
                />
              </label>
            </div>
            <button
              disabled={saving === 'discount'}
              className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving === 'discount' ? 'Đang lưu...' : 'Lưu ưu đãi'}
            </button>
          </form>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#171510]">
            <h3 className="font-black text-stone-900 dark:text-white">
              Ưu đãi đang hoạt động ({discounts.length})
            </h3>
            <div className="mt-3 space-y-2">
              {discounts.length === 0 ? (
                <p className="text-sm text-stone-500">Chưa có ưu đãi nào.</p>
              ) : (
                discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2.5 text-sm dark:bg-stone-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-stone-800 dark:text-stone-200">
                        {discount.student?.full_name || discount.student_id}
                      </p>
                      <p className="text-xs text-stone-500">Từ {discount.effective_from}</p>
                    </div>
                    <span className="shrink-0 font-black text-amber-700 dark:text-amber-400">
                      {discount.discount_type === 'percentage'
                        ? `${discount.discount_value}%`
                        : money(Number(discount.discount_value))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

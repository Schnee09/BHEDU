/**
 * Student Status Panel
 * Refactored with premium stone/amber theme and Vietnamese localization
 */

'use client'

import { useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'
import { Icons } from '@/components/ui/Icons'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended'

const statusConfig: Record<StudentStatus, { label: string; variant: 'success' | 'danger' | 'info' | 'warning'; description: string }> = {
  active: {
    label: 'Kích hoạt',
    variant: 'success',
    description: 'Học sinh đang theo học chính thức, có quyền tham gia lớp và nhận điểm.'
  },
  inactive: {
    label: 'Ngưng học',
    variant: 'danger',
    description: 'Hồ sơ đã được lưu trữ hoặc học sinh đã thôi học. Không xuất hiện trong danh sách hoạt động.'
  },
  graduated: {
    label: 'Tốt nghiệp',
    variant: 'info',
    description: 'Học sinh đã hoàn thành chương trình. Hồ sơ được bảo toàn ở trạng thái chỉ đọc.'
  },
  suspended: {
    label: 'Đình chỉ',
    variant: 'warning',
    description: 'Học sinh tạm thời bị đình chỉ học tập do vi phạm nội quy hoặc chính sách.'
  },
}

export default function StudentStatusPanel({
  studentId,
  currentStatus,
  isAdmin
}: {
  studentId: string
  currentStatus: StudentStatus
  isAdmin: boolean
}) {
  const [status, setStatus] = useState<StudentStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState('')

  const changed = useMemo(() => status !== currentStatus, [status, currentStatus])

  const handleSave = async () => {
    if (!isAdmin) return

    setSaving(true)
    const toastId = showToast.loading('Đang cập nhật trạng thái...')

    try {
      const res = await apiFetch(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reason.trim() || undefined })
      })

      const json = await res.json()
      showToast.dismiss(toastId)

      if (!res.ok) {
        showToast.error(json?.error || 'Không thể cập nhật trạng thái')
        return
      }

      showToast.success('Đã cập nhật trạng thái thành công')
      setReason('')
    } catch (err) {
      showToast.dismiss(toastId)
      console.error(err)
      showToast.error('Lỗi hệ thống khi cập nhật trạng thái')
    } finally {
      setSaving(false)
    }
  }

  const cfg = statusConfig[status]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-6 flex-wrap pb-6 border-b border-stone-100 dark:border-white/5">
        <div className="space-y-1">
          <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Icons.Archive className="w-6 h-6 text-amber-500" /> Quản lý Trạng thái
          </h2>
          <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest leading-relaxed max-w-md">
            Thay đổi hồ sơ học sinh sang các trạng thái lưu trữ, đình chỉ hoặc tốt nghiệp.
          </p>
        </div>
        <Badge variant={cfg.variant} className="font-black text-[10px] uppercase tracking-widest h-8 px-4 shadow-sm">
          {cfg.label}
        </Badge>
      </div>

      <div className="rounded-[2rem] bg-stone-50/50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 p-8 space-y-8 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-1">
              <Icons.History className="w-3.5 h-3.5" /> Trạng thái hồ sơ
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StudentStatus)}
              disabled={!isAdmin || saving}
              className="w-full h-12 bg-white dark:bg-stone-950 rounded-2xl border-stone-200 dark:border-white/10 px-4 font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
            >
              <option value="active">Kích hoạt (Active)</option>
              <option value="inactive">Ngưng học (Inactive)</option>
              <option value="graduated">Tốt nghiệp (Graduated)</option>
              <option value="suspended">Đình chỉ (Suspended)</option>
            </select>
            <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 italic mt-2 pl-2">
              {cfg.description}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-1">
              <Icons.Edit className="w-3.5 h-3.5" /> Lý do thay đổi
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!isAdmin || saving}
              className="w-full h-12 bg-white dark:bg-stone-950 rounded-2xl border-stone-200 dark:border-white/10 px-4 font-medium text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
              placeholder="VD: Vi phạm nội quy, Đã hoàn thành học phí..."
            />
          </div>
        </div>

        {!isAdmin && (
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-center gap-4 text-amber-700 dark:text-amber-400">
            <Icons.Warning className="w-5 h-5 flex-shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Chỉ Quản trị viên (Admin) mới có quyền thay đổi trạng thái học sinh.
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center justify-between pt-4 border-t border-stone-200/50 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !changed}
                isLoading={saving}
                className="font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-amber-glow"
              >
                Cập nhật Trạng thái
              </Button>
              {changed && !saving && (
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse ml-4 italic">
                  Thay đổi sẽ có hiệu lực ngay lập tức.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[2rem] bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 p-8 shadow-sm">
        <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Icons.Info className="w-4 h-4 text-stone-400" /> Ghi chú quy trình
        </h3>
        <ul className="space-y-3">
          {[
            { tag: 'Ngưng học', note: 'Thường được dùng cho học sinh đã nghỉ học hoặc bị xóa tạm. Hồ sơ sẽ bị ẩn khỏi danh sách lớp.' },
            { tag: 'Đình chỉ', note: 'Áp dụng cho các trường hợp vi phạm chính sách của trung tâm. Quyền truy cập có thể bị hạn chế.' },
            { tag: 'Tốt nghiệp', note: 'Lưu giữ hồ sơ học tập trọn đời sau khi học sinh hoàn thành chương trình tại trung tâm.' }
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-4 text-[11px] leading-relaxed group">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-amber-500 mt-1.5 transition-colors" />
              <div className="space-x-2">
                <span className="font-black text-stone-900 dark:text-stone-200 uppercase tracking-widest">{item.tag}:</span>
                <span className="text-stone-500 dark:text-stone-400 font-medium">{item.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

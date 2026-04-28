/**
 * Import History Panel
 * Refactored with premium stone/amber theme and Vietnamese localization
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'
import { Icons } from '@/components/ui/Icons'
import { Badge, Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

type ImportLog = {
  id: string
  import_type: string
  status: string
  total_rows: number | null
  processed_rows: number | null
  success_count: number | null
  error_count: number | null
  error_summary: string | null
  created_at: string
  importer?: { id: string; full_name: string | null; email: string | null } | null
}

type ImportErrorRow = {
  id: string
  import_log_id: string
  row_number: number | null
  field_name: string | null
  error_type: string | null
  error_message: string | null
  severity: string | null
  created_at: string
}

export default function ImportHistoryPanel() {
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [errors, setErrors] = useState<ImportErrorRow[]>([])
  const [errorsLoading, setErrorsLoading] = useState(false)

  const selectedLog = useMemo(() => logs.find((l) => l.id === selectedLogId) || null, [logs, selectedLogId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/api/admin/students/import/history?limit=10&offset=0')
        const json = await res.json()
        if (!res.ok) {
          showToast.error(json?.error || 'Không thể tải lịch sử nhập liệu')
          return
        }
        setLogs(json.logs || [])
      } catch (err) {
        console.error(err)
        showToast.error('Không thể tải lịch sử nhập liệu')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const loadErrors = async (importLogId: string) => {
    setErrorsLoading(true)
    try {
      const res = await apiFetch(`/api/admin/students/import/errors?import_log_id=${encodeURIComponent(importLogId)}`)
      const json = await res.json()
      if (!res.ok) {
        showToast.error(json?.error || 'Không thể tải chi tiết lỗi')
        return
      }
      setErrors(json.data || [])
    } catch (err) {
      console.error(err)
      showToast.error('Không thể tải chi tiết lỗi')
    } finally {
      setErrorsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Đang tải lịch sử...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="pb-6 border-b border-stone-100 dark:border-white/5">
        <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
          <Icons.History className="w-6 h-6 text-amber-500" /> Lịch sử Nhập liệu (Bulk Import)
        </h2>
        <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">
          Báo cáo kết quả kiểm soát và chi tiết lỗi từ các đợt nhập học viên hàng loạt.
        </p>
      </div>

      {logs.length === 0 ? (
        <Card borderStyle="dashed" className="p-16 text-center rounded-[2.5rem] bg-stone-50/50 dark:bg-white/[0.01]">
          <div className="w-16 h-16 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icons.Archive className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-stone-500 font-medium">Chưa có dữ liệu nhập liệu hàng loạt nào được ghi nhận.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Recent Imports List */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Các lượt nhập gần đây</h3>
            <div className="grid gap-3">
              {logs.map((log) => {
                const isSelected = log.id === selectedLogId
                const statusVariant = 
                  log.status === 'completed' ? 'success' : 
                  log.status === 'failed' ? 'danger' : 'secondary';
                
                const statusLabel = 
                  log.status === 'completed' ? 'Hoàn tất' : 
                  log.status === 'failed' ? 'Thất bại' : 'Đang xử lý';

                return (
                  <div
                    key={log.id}
                    onClick={async () => {
                      setSelectedLogId(log.id)
                      await loadErrors(log.id)
                    }}
                    className={cn(
                      "group cursor-pointer p-5 rounded-3xl border transition-all duration-300",
                      isSelected 
                        ? "bg-amber-500 text-white border-amber-600 shadow-xl shadow-amber-500/20 translate-x-2" 
                        : "bg-white dark:bg-stone-900 border-stone-100 dark:border-white/5 hover:border-amber-500/20 hover:shadow-lg"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className={cn("font-serif font-black text-sm uppercase tracking-tight", isSelected ? "text-white" : "text-stone-900 dark:text-white")}>
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </div>
                        <div className={cn("text-[9px] font-black uppercase tracking-widest mt-0.5", isSelected ? "text-amber-100" : "text-stone-400")}>
                          Bởi {log.importer?.full_name || log.importer?.email || 'Hệ thống'} • Tổng {log.total_rows ?? 0} dòng
                        </div>
                      </div>
                      <Badge 
                        variant={statusVariant} 
                        className={cn(
                          "font-black text-[8px] uppercase tracking-widest px-2 h-5",
                          isSelected && "bg-white/20 border-white/30 text-white"
                        )}
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Icons.Check className={cn("w-3 h-3", isSelected ? "text-amber-100" : "text-emerald-500")} />
                        <span className={cn("text-[10px] font-bold", isSelected ? "text-white" : "text-stone-700 dark:text-stone-300")}>{log.success_count ?? 0} thành công</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icons.Error className={cn("w-3 h-3", isSelected ? "text-amber-100" : "text-red-500")} />
                        <span className={cn("text-[10px] font-bold", isSelected ? "text-white" : "text-stone-700 dark:text-stone-300")}>{log.error_count ?? 0} lỗi</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Details & Errors Panel */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Chi tiết lỗi dòng dữ liệu</h3>
            <Card className="rounded-[2rem] p-0 overflow-hidden min-h-[400px]">
              {!selectedLog ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <Icons.Search className="w-10 h-10 text-stone-200 mb-4" />
                  <p className="text-stone-400 text-sm font-medium">Chọn một lượt nhập để xem chi tiết báo cáo.</p>
                </div>
              ) : errorsLoading ? (
                <div className="p-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Đang tải báo cáo lỗi...</p>
                </div>
              ) : errors.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <Icons.Success className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-stone-500 font-bold mb-1">Không có lỗi nào!</p>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">Toàn bộ dữ liệu đã được xử lý thành công.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-50 dark:divide-white/5">
                  <div className="bg-stone-50/50 dark:bg-white/[0.02] px-6 py-4 grid grid-cols-12 gap-4 text-[9px] font-black text-stone-400 uppercase tracking-widest">
                    <div className="col-span-2">Dòng</div>
                    <div className="col-span-3">Trường dữ liệu</div>
                    <div className="col-span-5">Thông báo lỗi</div>
                    <div className="col-span-2 text-right">Mức độ</div>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {errors.slice(0, 100).map((e) => (
                      <div key={e.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-stone-50/50 dark:hover:bg-white/[0.01] transition-colors">
                        <div className="col-span-2 font-mono text-xs font-bold text-stone-400">#{e.row_number ?? '?'}</div>
                        <div className="col-span-3 text-[11px] font-black text-stone-700 dark:text-stone-200 uppercase tracking-wide truncate">{e.field_name ?? '—'}</div>
                        <div className="col-span-5 text-[11px] text-stone-600 dark:text-stone-400 font-medium leading-relaxed">{e.error_message ?? 'Không có thông báo'}</div>
                        <div className="col-span-2 text-right">
                          <Badge 
                            variant={e.severity === 'warning' ? 'secondary' : 'danger'}
                            className="font-black text-[8px] uppercase tracking-widest px-2 h-5"
                          >
                            {e.severity || 'Lỗi'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {errors.length > 100 && (
                      <div className="p-4 text-center bg-stone-50/50 dark:bg-white/[0.02]">
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Chỉ hiển thị 100 lỗi đầu tiên</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

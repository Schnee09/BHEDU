'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, deleteStudent } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'
import { Icons } from '@/components/ui/Icons'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface StudentActionsProps {
  studentId: string
  studentName: string
  isAdmin: boolean
}

export default function StudentActions({ studentId, studentName, isAdmin }: StudentActionsProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleArchive = async () => {
    setDeleting(true)
    const loadingToast = showToast.loading('Đang lưu trữ hồ sơ...')

    try {
      await deleteStudent(studentId);

      showToast.dismiss(loadingToast)
      showToast.success('Hồ sơ đã được lưu trữ thành công!')
      setShowDeleteModal(false)
      setTimeout(() => {
        router.push('/dashboard/students')
      }, 1500)

    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to archive student:', error)
      showToast.error('Không thể lưu trữ hồ sơ. Vui lòng thử lại.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/dashboard/students/${studentId}/edit`}>
        <Button
          variant="secondary"
          size="sm"
          className="font-black uppercase tracking-widest text-[10px] h-10 px-4"
          leftIcon={<Icons.Edit className="w-3.5 h-3.5" />}
        >
          Chỉnh sửa thông tin
        </Button>
      </Link>

      <Link href={`/dashboard/grades/transcripts?student_id=${studentId}`}>
        <Button
          variant="secondary"
          size="sm"
          className="font-black uppercase tracking-widest text-[10px] h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
          leftIcon={<Icons.Grades className="w-3.5 h-3.5" />}
        >
          Xem Học Bạ
        </Button>
      </Link>

      <Link href={`/dashboard/admin/finance/invoices?student_id=${studentId}`}>
        <Button
          variant="outline"
          size="sm"
          className="font-black uppercase tracking-widest text-[10px] h-10 px-4 border-stone-200"
          leftIcon={<Icons.Finance className="w-3.5 h-3.5" />}
        >
          Hóa đơn học phí
        </Button>
      </Link>

      <Link href={`/dashboard/admin/finance/payments?student_id=${studentId}`}>
        <Button
          variant="outline"
          size="sm"
          className="font-black uppercase tracking-widest text-[10px] h-10 px-4 border-stone-200"
          leftIcon={<Icons.Download className="w-3.5 h-3.5" />}
        >
          Lịch sử đóng phí
        </Button>
      </Link>

      {isAdmin && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="font-black uppercase tracking-widest text-[10px] h-10 px-4"
          leftIcon={<Icons.Archive className="w-3.5 h-3.5" />}
        >
          Lưu trữ hồ sơ
        </Button>
      )}

      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              const loading = showToast.loading('Đang đặt lại mật mã...')
              const res = await apiFetch(`/api/admin/users/${studentId}/reset-password`, { method: 'POST' })
              const json = await res.json()
              showToast.dismiss(loading)
              if (res.ok) {
                showToast.success(json.message || 'Email khôi phục đã được gửi')
              } else {
                showToast.error(json.error || 'Đặt lại mật mã thất bại')
              }
            } catch (err) {
              console.error(err)
              showToast.error('Lỗi hệ thống khi đặt lại mật mã')
            }
          }}
          className="font-black uppercase tracking-widest text-[10px] h-10 px-4 border-stone-200"
          leftIcon={<Icons.Lock className="w-3.5 h-3.5" />}
        >
          Đặt lại mật mã
        </Button>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000] transition-opacity duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-stone-200 dark:border-white/5 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Icons.Archive className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Lưu trữ học sinh?
              </h2>
            </div>
            
            <p className="text-stone-600 dark:text-stone-400 mb-2 font-medium">
              Xác nhận lưu trữ hồ sơ của học sinh <strong>{studentName}</strong>?
            </p>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Thao tác này sẽ chuyển trạng thái học sinh sang &quot;Ngưng học&quot; và ẩn khỏi danh sách hoạt động. Toàn bộ dữ liệu điểm số, điểm danh và học phí sẽ được bảo toàn.
            </p>

            <div className="flex gap-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="font-black uppercase tracking-widest text-[10px] h-12"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleArchive}
                isLoading={deleting}
                className="font-black uppercase tracking-widest text-[10px] h-12 shadow-md"
              >
                Xác nhận lưu trữ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


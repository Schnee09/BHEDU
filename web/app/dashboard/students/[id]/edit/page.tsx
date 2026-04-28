'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'
import { routes } from '@/lib/routes'
import { Icons } from '@/components/ui/Icons'
import { Button, Card } from '@/components/ui'
import Badge from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StudentFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  gender: string
  student_id: string
  student_code: string
  grade_level: string
  enrollment_date: string
  status: string
  notes: string
}

interface FieldError {
  field: string
  message: string
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [studentId, setStudentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    student_id: '',
    student_code: '',
    grade_level: '',
    enrollment_date: '',
    status: 'active',
    notes: ''
  })

  useEffect(() => {
    setStudentId(resolvedParams.id)
    loadStudent(resolvedParams.id)
  }, [resolvedParams.id])

  const loadStudent = async (id: string) => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/students/${id}`)
      if (response.ok) {
        const result = await response.json()
        const student = result.data
        setFormData({
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          email: student.email || '',
          phone: student.phone || '',
          address: student.address || '',
          date_of_birth: student.date_of_birth || '',
          gender: student.gender || '',
          student_id: student.student_id || '',
          student_code: student.student_code || '',
          grade_level: student.grade_level || '',
          enrollment_date: student.enrollment_date || '',
          status: student.status || 'active',
          notes: student.notes || ''
        })
      } else {
        showToast.error('Không thể tải dữ liệu học sinh')
        router.push('/dashboard/students')
      }
    } catch (error) {
      console.error('Failed to load student:', error)
      showToast.error('Lỗi khi tải dữ liệu học sinh')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FieldError[] = []

    if (!formData.first_name.trim()) {
      newErrors.push({ field: 'first_name', message: 'Vui lòng nhập Tên' })
    }

    if (!formData.last_name.trim()) {
      newErrors.push({ field: 'last_name', message: 'Vui lòng nhập Họ' })
    }

    if (!formData.email.trim()) {
      newErrors.push({ field: 'email', message: 'Vui lòng nhập Email' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ field: 'email', message: 'Email không hợp lệ' })
    }

    if (formData.student_id && formData.student_id.length > 50) {
      newErrors.push({ field: 'student_id', message: 'Mã định danh quá dài (tối đa 50 ký tự)' })
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast.error('Vui lòng kiểm tra lại các thông tin lỗi')
      return
    }

    setSaving(true)
    const loadingToast = showToast.loading('Đang cập nhật học sinh...')

    try {
      const response = await apiFetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      showToast.dismiss(loadingToast)

      if (response.ok) {
        showToast.success('Cập nhật học sinh thành công!')
        setTimeout(() => {
          router.push(routes.students.detail(studentId))
        }, 800)
      } else {
        showToast.error(result.error || 'Cập nhật thất bại')
      }
    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to update student:', error)
      showToast.error('Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors.some(e => e.field === field)) {
      setErrors(errors.filter(e => e.field !== field))
    }
  }

  const getFieldError = (field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200 dark:border-white/5">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-accent-glow" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Cập nhật hồ sơ</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
            Chỉnh sửa học sinh
          </h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium flex gap-4">
            <span>UID: <span className="text-stone-900 dark:text-white font-black">{formData.student_code || '—'}</span></span>
            <span>CID: <span className="text-amber-600 font-black">{formData.student_id || 'Chưa cấp'}</span></span>
          </p>
        </div>
        
        <div className="flex gap-3 justify-center">
          <Link href={routes.students.detail(studentId)}>
            <Button variant="outline" className="font-black uppercase tracking-widest text-[10px] px-6">
              Hủy bỏ
            </Button>
          </Link>
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
            className="font-black uppercase tracking-widest text-[10px] px-8 bg-stone-900 dark:bg-amber-500 text-white shadow-xl hover:scale-105 transition-transform"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                <Icons.Students className="w-5 h-5 font-black" />
              </div>
              <h3 className="text-lg font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Thông tin cá nhân
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormInput
                label="Họ"
                required
                value={formData.last_name}
                onChange={(v: string) => handleChange('last_name', v)}
                error={getFieldError('last_name')}
                icon={<span className="text-amber-500">H</span>}
                placeholder="Nhập họ..."
              />
              <FormInput
                label="Tên"
                required
                value={formData.first_name}
                onChange={(v: string) => handleChange('first_name', v)}
                error={getFieldError('first_name')}
                icon={<span className="text-amber-500">T</span>}
                placeholder="Nhập tên..."
              />
              <FormInput
                label="Địa chỉ Email"
                required
                type="email"
                value={formData.email}
                onChange={(v: string) => handleChange('email', v)}
                error={getFieldError('email')}
                icon={<Icons.Mail className="w-4 h-4 text-amber-500" />}
                placeholder="email@example.com"
              />
              <FormInput
                label="Số điện thoại"
                value={formData.phone}
                onChange={(v: string) => handleChange('phone', v)}
                error={getFieldError('phone')}
                icon={<Icons.Phone className="w-4 h-4 text-amber-500" />}
                placeholder="09xx xxx xxx"
              />
              <FormInput
                label="Ngày sinh"
                type="date"
                value={formData.date_of_birth}
                onChange={(v: string) => handleChange('date_of_birth', v)}
                icon={<Icons.Calendar className="w-4 h-4 text-amber-500" />}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Giới tính</label>
                <div className="relative group">
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl px-12 py-4 font-black transition-all focus:ring-2 focus:ring-amber-500/20 appearance-none"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">
                    <Icons.Students className="w-4 h-4" />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                    ▼
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Địa chỉ thường trú</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  className="w-full bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 font-black transition-all focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                <Icons.Edit className="w-5 h-5 font-black" />
              </div>
              <h3 className="text-lg font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Ghi chú nội bộ
              </h3>
            </div>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={5}
              placeholder="Nhập ghi chú quan trọng về học sinh này..."
              className="w-full bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-[2rem] px-8 py-6 font-medium transition-all focus:ring-2 focus:ring-emerald-500/20"
            />
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <Card className="p-8 border-t-4 border-amber-500 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                  <Icons.Success className="w-5 h-5 font-black" />
                </div>
                <h3 className="text-lg font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  Đào tạo
                </h3>
              </div>
              
              <FormInput
                label="UID (Mã truy cập)"
                value={formData.student_code}
                readOnly
                icon={<Icons.Lock className="w-4 h-4 text-stone-400" />}
                className="opacity-70 bg-stone-100"
              />

              <FormInput
                label="CID (Mã định danh)"
                value={formData.student_id}
                onChange={(v: string) => handleChange('student_id', v)}
                error={getFieldError('student_id')}
                icon={<Icons.Clipboard className="w-4 h-4 text-amber-600" />}
                placeholder="Nhập ID cá nhân/quốc gia"
              />

              <FormInput
                label="Khối lớp"
                value={formData.grade_level}
                onChange={(v: string) => handleChange('grade_level', v)}
                icon={<Icons.Classes className="w-4 h-4 text-emerald-600" />}
                placeholder="Ví dụ: 9, 10, 11..."
              />

              <FormInput
                label="Ngày nhập học"
                type="date"
                value={formData.enrollment_date}
                onChange={(v: string) => handleChange('enrollment_date', v)}
                icon={<Icons.History className="w-4 h-4 text-blue-600" />}
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Trạng thái hồ sơ</label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl px-12 py-4 font-black transition-all appearance-none"
                  >
                    <option value="active">Đang học (Active)</option>
                    <option value="inactive">Nghi học (Inactive)</option>
                    <option value="graduated">Đã tốt nghiệp</option>
                    <option value="transferred">Chuyển trường</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 text-amber-600">
                    <Icons.History className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <div className="p-8 bg-gradient-to-br from-stone-900 to-stone-800 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Icons.Edit className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-amber-500 font-black uppercase tracking-[0.2em] text-[10px]">Lưu ý bảo mật</h4>
              <p className="text-stone-400 text-xs leading-relaxed font-medium">
                Mọi thay đổi thông tin quan trọng như Mã định danh hoặc Email sẽ được ghi lại trong nhật ký hệ thống để đảm bảo tính minh bạch.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function FormInput({ label, required, value, onChange, error, icon, type = 'text', placeholder }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          {label} {required && <span className="text-amber-500">*</span>}
        </label>
        {error && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{error}</span>}
      </div>
      <div className="relative group">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-stone-50 dark:bg-white/5 border rounded-2xl px-12 py-4 font-black transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600",
            error 
              ? "border-rose-500/50 focus:ring-rose-500/20" 
              : "border-stone-200 dark:border-white/10 focus:ring-amber-500/20 focus:border-amber-500/50"
          )}
        />
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

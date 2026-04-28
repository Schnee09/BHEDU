import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button, Input, Modal } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { useToast } from "@/hooks";
import { logger } from "@/lib/logger";
import { Copy, Check } from "lucide-react";

export interface Student {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  student_code?: string;
  student_id?: string;
  grade_level?: string;
  status?: string;
  gender?: string;
  created_at: string;
}

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess: () => void;
}

export default function StudentFormModal({ isOpen, onClose, student, onSuccess }: StudentFormModalProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    student_code: '',
    student_id: '',
    grade_level: '',
    status: 'active',
    gender: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        email: student.email || '',
        phone: student.phone || '',
        date_of_birth: student.date_of_birth || '',
        address: student.address || '',
        student_code: student.student_code || '',
        student_id: student.student_id || '',
        grade_level: student.grade_level || '',
        status: student.status || 'active',
        gender: student.gender || ''
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        student_code: '',
        student_id: '',
        grade_level: '',
        status: 'active',
        gender: ''
      });
    }
    setErrors({});
    setTempPassword(null);
  }, [student, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Họ tên là bắt buộc';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Định dạng số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const url = student
        ? `/api/students/${student.id}`
        : '/api/students';

      const method = student ? 'PUT' : 'POST';

      // Sanitize payload: convert empty strings to null or undefined for optional fields
      const payload = {
        ...formData,
        email: formData.email.trim() || undefined,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        student_code: formData.student_code.trim() || undefined,
        student_id: formData.student_id.trim() || null,
        grade_level: formData.grade_level || null,
        gender: formData.gender || null,
      };

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể lưu học sinh');
      }

      if (data.tempPassword) {
        setTempPassword(data.tempPassword);
        // Do not close yet - let user see password
      } else {
        onSuccess();
      }
    } catch (error: any) {
      toast.error('Error', error.message);
      logger.error('Student form error', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success("Đã sao chép", "Mật khẩu đã được lưu vào clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tempPassword ? 'TẠO HỒ SƠ THÀNH CÔNG' : (student ? 'CẬP NHẬT HỒ SƠ HỌC SINH' : 'THÊM MỚI HỌC SINH')}
      className="bg-stone-50/50 dark:bg-stone-900 shadow-2xl rounded-[2.5rem] border border-stone-200 dark:border-white/5"
      size="lg"
      footer={
        tempPassword ? (
          <div className="flex justify-end w-full px-4 pb-4">
            <Button 
                variant="primary" 
                onClick={onSuccess}
                className="font-black uppercase tracking-widest text-[10px] h-12 px-10 shadow-emerald-glow"
            >
              Hoàn tất (Done)
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3 px-4 pb-4">
            <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={submitting}
                className="font-black uppercase tracking-widest text-[10px] h-12 px-8 border-stone-200"
            >
              Hủy bỏ (Cancel)
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={submitting}
              className="font-black uppercase tracking-widest text-[10px] h-12 px-10 shadow-amber-glow"
              leftIcon={student ? <Icons.Save className="w-4 h-4" /> : <Icons.Add className="w-4 h-4" />}
            >
              {student ? 'Cập nhật' : 'Thêm mới'} (Submit)
            </Button>
          </div>
        )
      }
    >
      {tempPassword ? (
        <div className="space-y-6 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Icons.Success className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800">Tài khoản học sinh đã được tạo</h3>
              <p className="text-green-700 text-sm mt-1">
                Vui lòng sao chép thông tin đăng nhập dưới đây và gửi cho học sinh.
                Lưu ý: Mật khẩu này chỉ hiện <strong>một lần duy nhất</strong>.
              </p>
            </div>
          </div>

          <div className="grid gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                Họ và Tên
              </label>
              <div className="text-lg font-medium text-slate-900">{formData.full_name}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  UID (Mã truy cập)
                </label>
                <div className="text-lg font-mono font-medium text-slate-900 bg-white px-3 py-2 rounded border border-slate-200">
                  {formData.student_code}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Mật khẩu
                </label>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-mono font-medium text-slate-900 bg-white px-3 py-2 rounded border border-slate-200 flex-1">
                    {tempPassword}
                  </div>
                  <button
                    onClick={handleCopyPassword}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                    title="Copy Password"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ và tên"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={errors.full_name}
            placeholder="Nhập họ và tên học sinh"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              placeholder="hocsinh@example.com"
              className="bg-white dark:bg-stone-900 border-stone-200"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="UID (Mã truy cập)"
                value={formData.student_code}
                onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                placeholder="HS20260001 (Tự động nếu để trống)"
                className="bg-white dark:bg-stone-900 border-stone-200"
              />

              <Input
                label="CID (Mã định danh)"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="Nhập ID quốc gia hoặc ID cá nhân"
                className="bg-white dark:bg-stone-900 border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số điện thoại"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
              placeholder="0912 345 678"
            />

            <Input
              label="Ngày sinh"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn khối lớp</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                  <option key={grade} value={`Lớp ${grade}`}>Lớp {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Đang học</option>
                <option value="inactive">Nghỉ học</option>
                <option value="graduated">Đã tốt nghiệp</option>
                <option value="suspended">Đình chỉ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập địa chỉ học sinh"
            />
          </div>
          {!student && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm flex items-start gap-3 mt-6">
              <Icons.Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Thông tin tài khoản</p>
                <p className="mt-1">
                  Hệ thống sẽ tự động tạo tài khoản đăng nhập cho học sinh.
                  Mật khẩu sẽ được hiển thị sau khi tạo thành công.
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}

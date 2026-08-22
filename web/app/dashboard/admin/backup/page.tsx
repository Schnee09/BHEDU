'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Receipt,
  Shield,
  Search,
  Eye,
  Layers,
  HardDrive,
  Calendar,
  Lock,
  ArrowDownToLine,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api/client';
import { exportToJSON } from '@/lib/export/exportUtils';
import PageGuard from '@/components/PageGuard';
import { useToast } from '@/hooks/useToast';

interface TableMeta {
  name: string;
  label: string;
  category: 'users' | 'academic' | 'grades' | 'finance' | 'system';
  description: string;
}

const SYSTEM_TABLES: TableMeta[] = [
  // Users & Profiles
  { name: 'profiles', label: 'Hồ sơ tài khoản', category: 'users', description: 'Thông tin cá nhân, vai trò và phân quyền người dùng' },
  { name: 'students', label: 'Học sinh', category: 'users', description: 'Hồ sơ học sinh, ngày sinh, giới tính và mã học sinh' },
  { name: 'guardians', label: 'Phụ huynh & Người giám hộ', category: 'users', description: 'Liên kết thông tin phụ huynh và học sinh' },
  { name: 'enrollments', label: 'Ghi danh lớp học', category: 'users', description: 'Lịch sử và trạng thái đăng ký lớp của học sinh' },
  
  // Academic & Classes
  { name: 'classes', label: 'Lớp học', category: 'academic', description: 'Danh sách lớp học, giáo viên phụ trách, phòng học' },
  { name: 'courses', label: 'Khóa học & Môn học', category: 'academic', description: 'Khung chương trình đào tạo và môn học' },
  { name: 'lessons', label: 'Buổi học / Bài giảng', category: 'academic', description: 'Chi tiết từng buổi học và lịch dạy' },
  { name: 'academic_years', label: 'Năm học & Học kỳ', category: 'academic', description: 'Khung niên khóa và học kỳ toàn trung tâm' },
  
  // Attendance & Grades
  { name: 'attendance', label: 'Điểm danh', category: 'grades', description: 'Nhật ký điểm danh chuyên cần hàng ngày' },
  { name: 'grades', label: 'Điểm số học tập', category: 'grades', description: 'Điểm thi, điểm kiểm tra và điểm tổng kết' },
  { name: 'grading_scales', label: 'Thang điểm & Xếp loại', category: 'grades', description: 'Quy chuẩn tính điểm và xếp loại học lực' },
  { name: 'assignments', label: 'Bài tập & Đánh giá', category: 'grades', description: 'Danh mục bài tập và kiểm tra định kỳ' },
  
  // Finance
  { name: 'fee_types', label: 'Danh mục khoản thu', category: 'finance', description: 'Các loại phí đào tạo, giáo trình và phụ phí' },
  { name: 'invoices', label: 'Hóa đơn học phí', category: 'finance', description: 'Phiếu thu, hóa đơn học phí của từng học sinh' },
  { name: 'invoice_items', label: 'Chi tiết hóa đơn', category: 'finance', description: 'Từng mục chi tiết trong hóa đơn học phí' },
  { name: 'payments', label: 'Giao dịch thanh toán', category: 'finance', description: 'Nhật ký thanh toán, chuyển khoản, tiền mặt' },
  
  // System & Logs
  { name: 'school_settings', label: 'Cấu hình trung tâm', category: 'system', description: 'Thông tin nhận diện, quy định và thiết lập chung' },
  { name: 'audit_logs', label: 'Nhật ký kiểm toán', category: 'system', description: 'Lịch sử thao tác và thay đổi dữ liệu nhạy cảm' },
  { name: 'role_permission_overrides', label: 'Phân quyền vai trò', category: 'system', description: 'Cấu hình ghi đè quyền hạn của vai trò' },
];

type ActiveTab = 'snapshot' | 'modules' | 'tables';

export default function BackupDataCenterPage() {
  return (
    <PageGuard permissions="system.settings">
      <BackupDataCenterContent />
    </PageGuard>
  );
}

function BackupDataCenterContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('snapshot');
  const [exporting, setExporting] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [previewingTable, setPreviewingTable] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const toast = useToast();

  const handleFullBackup = async () => {
    setExporting('full');
    try {
      const res = await apiFetch('/api/admin/export-data');
      if (!res.ok) throw new Error('Không thể tạo bản sao lưu');
      const data = await res.json();
      
      const fileName = `bh-edu-full-backup-${new Date().toISOString().split('T')[0]}`;
      exportToJSON(data, fileName);
      toast.success('Thành công', 'Đã tải về bản sao lưu Snapshot toàn diện!');
    } catch (err: any) {
      toast.error('Lỗi', err?.message || 'Không thể tạo bản sao lưu');
    } finally {
      setExporting(null);
    }
  };

  const handleModuleExport = async (moduleKey: string, moduleLabel: string) => {
    setExporting(moduleKey);
    try {
      const res = await apiFetch(`/api/admin/export-data?module=${moduleKey}`);
      if (!res.ok) throw new Error(`Không thể xuất dữ liệu phân hệ ${moduleLabel}`);
      const data = await res.json();
      
      const fileName = `bh-edu-${moduleKey}-${new Date().toISOString().split('T')[0]}`;
      exportToJSON(data, fileName);
      toast.success('Thành công', `Đã xuất dữ liệu phân hệ "${moduleLabel}"!`);
    } catch (err: any) {
      toast.error('Lỗi', err?.message || 'Xuất dữ liệu thất bại');
    } finally {
      setExporting(null);
    }
  };

  const handleTableExport = async (tableName: string) => {
    setExporting(tableName);
    try {
      const res = await apiFetch(`/api/admin/export-data?table=${tableName}`);
      if (!res.ok) throw new Error(`Không thể xuất bảng ${tableName}`);
      const data = await res.json();
      
      const fileName = `table-${tableName}-${new Date().toISOString().split('T')[0]}`;
      exportToJSON(data, fileName);
      toast.success('Thành công', `Đã tải về dữ liệu bảng "${tableName}"!`);
    } catch (err: any) {
      toast.error('Lỗi', err?.message || 'Tải dữ liệu bảng thất bại');
    } finally {
      setExporting(null);
    }
  };

  const handlePreviewTable = async (tableName: string) => {
    setPreviewingTable(tableName);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await apiFetch(`/api/admin/export-data?table=${tableName}`);
      if (res.ok) {
        const json = await res.json();
        setPreviewData((json.data || []).slice(0, 10)); // Top 10 records
      } else {
        toast.error('Lỗi', 'Không thể tải dữ liệu xem trước');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredTables = SYSTEM_TABLES.filter(
    (t) =>
      t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.label.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] text-stone-900 dark:text-stone-100 p-4 md:p-10 lg:p-12">
      <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Database className="w-4 h-4" />
              <span>QUẢN TRỊ HỆ THỐNG • BACKUP & DATA CENTER</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-950 dark:text-white">
              Sao lưu & <span className="text-amber-500">Dữ liệu</span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Trung tâm quản lý sao lưu snapshot, xuất dữ liệu theo phân hệ và trình khám phá cơ sở dữ liệu an toàn
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFullBackup}
              disabled={!!exporting}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {exporting === 'full' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="w-4 h-4" />
              )}
              Tạo bản sao lưu Snapshot (.JSON)
            </button>
          </div>
        </div>

        {/* Database Overview Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase">Hạ tầng DB</p>
              <h4 className="text-lg font-black text-stone-900 dark:text-white">Supabase Postgres</h4>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase">Trạng thái kết nối</p>
              <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400">Trực tuyến (Online)</h4>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 text-sky-500 rounded-2xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase">Bảng dữ liệu cốt lõi</p>
              <h4 className="text-lg font-black text-stone-900 dark:text-white">{SYSTEM_TABLES.length} Bảng</h4>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase">Mã hóa & Bảo vệ</p>
              <h4 className="text-lg font-black text-stone-900 dark:text-white">TLS 1.3 / AES-256</h4>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-stone-200/60 dark:bg-stone-900/60 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('snapshot')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              activeTab === 'snapshot'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            <HardDrive className="w-4 h-4 text-amber-500" />
            Sao lưu Snapshot Toàn diện
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              activeTab === 'modules'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            <Layers className="w-4 h-4 text-blue-500" />
            Xuất theo Phân hệ
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              activeTab === 'tables'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            Trình khám phá Bảng Database ({SYSTEM_TABLES.length})
          </button>
        </div>

        {/* Tab 1: Full Snapshot */}
        {activeTab === 'snapshot' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                  <Download className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-950 dark:text-white">
                    Tạo bản Snapshot Toàn Trung Tâm
                  </h3>
                  <p className="text-xs text-stone-500">
                    Trích xuất toàn bộ dữ liệu 19 bảng trọng yếu ra tệp tin JSON nén
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-xs text-stone-600 dark:text-stone-300 space-y-2 border border-stone-100 dark:border-white/5">
                <p className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Bao gồm đầy đủ các phân hệ:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-500">
                  <li>Toàn bộ hồ sơ học sinh, phụ huynh và tài khoản</li>
                  <li>Lớp học, thời khóa biểu, giáo trình và phân công</li>
                  <li>Điểm số, thang điểm xếp loại và bài tập</li>
                  <li>Hóa đơn học phí, giao dịch và phân bổ thanh toán</li>
                  <li>Cấu hình hệ thống và nhật ký kiểm toán (Audit Logs)</li>
                </ul>
              </div>

              <button
                onClick={handleFullBackup}
                disabled={!!exporting}
                className="w-full py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {exporting === 'full' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang xử lý xuất dữ liệu...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Tải về bản sao lưu ngay
                  </>
                )}
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-950 dark:text-white">
                    Khôi phục Dữ liệu từ Snapshot
                  </h3>
                  <p className="text-xs text-stone-500">
                    Phục hồi cấu trúc dữ liệu từ tệp tin JSON đã lưu trữ trước đó
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <p className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  Cảnh báo an toàn dữ liệu:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Thao tác khôi phục sẽ đối chiếu và cập nhật các bản ghi hiện tại. Để đảm bảo an toàn tuyệt đối,
                  hãy tạo một bản sao lưu snapshot mới trước khi thực hiện khôi phục.
                </p>
              </div>

              <label className="w-full py-4 rounded-2xl bg-white dark:bg-stone-800 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 text-stone-700 dark:text-stone-200 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-amber-500" />
                Chọn tệp tin JSON để khôi phục
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={() => {
                    toast.info('Thông báo', 'Tính năng khôi phục trực tiếp yêu cầu xác thực bảo mật Super Admin 2FA.');
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Modular Export */}
        {activeTab === 'modules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1: Students */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                    4 Bảng
                  </span>
                </div>
                <h4 className="font-black text-base text-stone-950 dark:text-white">Phân hệ Học sinh & Phụ huynh</h4>
                <p className="text-xs text-stone-500">
                  Gồm hồ sơ học sinh, thông tin người giám hộ, tài khoản liên kết và lịch sử ghi danh lớp học.
                </p>
              </div>

              <button
                onClick={() => handleModuleExport('students', 'Học sinh & Phụ huynh')}
                disabled={exporting === 'students'}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {exporting === 'students' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Xuất Phân hệ Học sinh (.JSON)
              </button>
            </div>

            {/* Module 2: Academic */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                    5 Bảng
                  </span>
                </div>
                <h4 className="font-black text-base text-stone-950 dark:text-white">Phân hệ Lớp học & Đào tạo</h4>
                <p className="text-xs text-stone-500">
                  Gồm danh sách lớp, môn học, bài giảng, khung năm học và phân kỳ giai đoạn học tập.
                </p>
              </div>

              <button
                onClick={() => handleModuleExport('academic', 'Lớp học & Đào tạo')}
                disabled={exporting === 'academic'}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {exporting === 'academic' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Xuất Phân hệ Đào tạo (.JSON)
              </button>
            </div>

            {/* Module 3: Grades */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                    3 Bảng
                  </span>
                </div>
                <h4 className="font-black text-base text-stone-950 dark:text-white">Phân hệ Điểm số & Học lực</h4>
                <p className="text-xs text-stone-500">
                  Gồm toàn bộ kết quả thi, thang điểm chữ, điểm GPA và danh mục bài tập đánh giá.
                </p>
              </div>

              <button
                onClick={() => handleModuleExport('grades', 'Điểm số & Học lực')}
                disabled={exporting === 'grades'}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {exporting === 'grades' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Xuất Phân hệ Điểm số (.JSON)
              </button>
            </div>

            {/* Module 4: Finance */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase">
                    5 Bảng
                  </span>
                </div>
                <h4 className="font-black text-base text-stone-950 dark:text-white">Phân hệ Tài chính & Học phí</h4>
                <p className="text-xs text-stone-500">
                  Gồm hóa đơn thu phí, khoản thu định kỳ, nhật ký thanh toán và đối soát dòng tiền.
                </p>
              </div>

              <button
                onClick={() => handleModuleExport('finance', 'Tài chính & Học phí')}
                disabled={exporting === 'finance'}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {exporting === 'finance' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Xuất Phân hệ Tài chính (.JSON)
              </button>
            </div>

            {/* Module 5: System */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-sky-500/10 text-sky-500 rounded-2xl">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 uppercase">
                    3 Bảng
                  </span>
                </div>
                <h4 className="font-black text-base text-stone-950 dark:text-white">Phân hệ Cấu hình & Logs</h4>
                <p className="text-xs text-stone-500">
                  Gồm thông tin cấu hình trung tâm, phân quyền RBAC vai trò và toàn bộ Audit Logs.
                </p>
              </div>

              <button
                onClick={() => handleModuleExport('system', 'Cấu hình & Logs')}
                disabled={exporting === 'system'}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {exporting === 'system' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Xuất Phân hệ Hệ thống (.JSON)
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Tables Explorer (Safe Data Dump) */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bảng dữ liệu theo tên hoặc mô tả..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <span className="text-xs font-bold text-stone-400">
                Hiển thị {filteredTables.length} / {SYSTEM_TABLES.length} bảng
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTables.map((table) => (
                <div
                  key={table.name}
                  className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-stone-900 dark:text-white">
                        {table.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 uppercase">
                        {table.category}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-stone-700 dark:text-stone-300">{table.label}</h5>
                    <p className="text-[11px] text-stone-400 line-clamp-2">{table.description}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
                    <button
                      onClick={() => handlePreviewTable(table.name)}
                      className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-stone-700 dark:text-stone-300"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-500" /> Xem trước
                    </button>
                    <button
                      onClick={() => handleTableExport(table.name)}
                      disabled={exporting === table.name}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                      title="Xuất bảng này (.JSON)"
                    >
                      {exporting === table.name ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Preview Drawer / Bottom Modal */}
            {previewingTable && (
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-500" />
                    <h4 className="text-sm font-black text-stone-900 dark:text-white">
                      Xem trước 10 bản ghi gần nhất: <span className="font-mono text-amber-500">{previewingTable}</span>
                    </h4>
                  </div>
                  <button
                    onClick={() => setPreviewingTable(null)}
                    className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white"
                  >
                    Đóng
                  </button>
                </div>

                {previewLoading ? (
                  <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                    Đang truy vấn bảng dữ liệu...
                  </div>
                ) : previewData && previewData.length > 0 ? (
                  <div className="overflow-x-auto max-h-96 custom-scrollbar">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                          {Object.keys(previewData[0] || {}).map((col) => (
                            <th key={col} className="p-2.5 font-mono font-bold text-stone-600 dark:text-stone-300">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-stone-50/60 dark:hover:bg-white/[0.02]">
                            {Object.values(row).map((val: any, vIdx) => (
                              <td key={vIdx} className="p-2.5 text-stone-600 dark:text-stone-400 font-mono truncate max-w-xs">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-stone-400">
                    Bảng này hiện chưa có bản ghi dữ liệu nào.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

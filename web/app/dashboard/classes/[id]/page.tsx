"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { LoadingState, Badge, Button, Modal } from "@/components/ui";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import {
  GraduationCap,
  Users,
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  Edit3,
  MoreVertical,
  FileText,
  ClipboardCheck,
  TrendingUp,
  UserPlus,
  Mail,
  ExternalLink,
  BookOpen,
  Info,
  Download,
  AlertCircle
} from "lucide-react";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getDisplayName } from "@/lib/utils/names";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";

interface ClassDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  schedule?: string;
  room?: string;
  created_at: string;
  capacity?: number | null;
  max_capacity?: number | null;
  status?: 'active' | 'inactive' | 'completed';
  teacher?: {
    id: string;
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
  };
  enrollment_count?: number;
  students?: Array<{
    id: string;
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    student_code?: string;
    status?: string;
  }>;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  academic_year?: {
    id: string;
    name: string;
  };
  timetable?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room?: string | null;
    notes?: string | null;
    subject?: { id: string; name: string; code: string } | null;
    teacher?: { id: string; full_name: string } | null;
  }>;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const { isExactTeacher, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (!permissionsLoading && isExactTeacher) {
      router.replace(routes.teacher.classDetail(classId));
    }
  }, [isExactTeacher, permissionsLoading, classId, router]);

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'details' | 'actions'>('students');

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);

        const response = await apiFetch(`/api/classes/${classId}?include_students=true&include_timetable=true`);
        if (!response.ok) throw new Error("Không thể tải thông tin lớp học");

        const resJson = await response.json();
        const cls = resJson.class;

        setClassData(cls);
      } catch (err: any) {
        console.error("[ClassDetail] Error:", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassDetail();
    }
  }, [classId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-8">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-blue-500/20 border-t-blue-600 rounded-full animate-spin shadow-2xl shadow-blue-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Đang trích xuất dữ liệu</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hệ thống đang tải thông tin lớp học...</p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="max-w-4xl mx-auto p-12">
        <div className="bg-white dark:bg-gray-800 rounded-[4rem] border border-gray-100 dark:border-gray-700 shadow-2xl p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight uppercase">
            {error === "Class not found" ? "Không tìm thấy lớp học" : "Lỗi hệ thống"}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-md mx-auto leading-relaxed">
            {error || "Không thể tải thông tin lớp học. Vui lòng xác nhận ID lớp học và thử lại."}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-10 py-4 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 dark:border-gray-700 flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lại
            </button>
            <Link href={routes.classes.list()}>
              <button className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-200 dark:shadow-none">
                Về danh sách
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-10">
      <div className="p-4 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 relative z-10">
        {/* Unified Class Dashboard Header */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
          <div className="absolute top-0 right-0 w-[400px] h-full bg-blue-500/5 dark:bg-blue-500/10 skew-x-12 translate-x-20 transition-transform group-hover:skew-x-6 duration-700" />
          
          <div className="relative p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between gap-6">
            {/* Left: Class Basic Info */}
            <div className="flex flex-col md:flex-row items-center gap-6 flex-[1.5] min-w-[240px]">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full" />
                <div className="relative w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-blue-600 to-sky-600 p-0.5 shadow-lg overflow-hidden">
                  <div className="w-full h-full rounded-[26px] bg-white dark:bg-gray-900 flex items-center justify-center">
                    <GraduationCap className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="text-center md:text-left flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 flex-wrap mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">{classData.code}</span>
                  </div>
                  {classData.status && (
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none",
                      classData.status === "active" && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      classData.status === "inactive" && "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      classData.status === "completed" && "bg-stone-100 dark:bg-stone-500/10 text-stone-600 dark:text-stone-400"
                    )}>
                      {classData.status === "active" ? "Hoạt động" : classData.status === "inactive" ? "Tạm ngưng" : "Đã hoàn thành"}
                    </div>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                  {classData.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-gray-500 dark:text-gray-400 font-bold">
                  {classData.course && (
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      Khóa: {classData.course.name}
                    </span>
                  )}
                  {classData.academic_year && (
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                      Năm: {classData.academic_year.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Lead Teacher Info */}
            <div className="w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-gray-100 dark:border-gray-700 pt-6 xl:pt-0 xl:pl-8 flex items-center gap-4 justify-center xl:justify-start flex-1 min-w-[220px]">
              {classData.teacher ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 p-0.5 shadow-md shadow-blue-500/5 shrink-0">
                    <div className="w-full h-full rounded-[10px] bg-white dark:bg-gray-950 flex items-center justify-center font-black text-blue-600 text-base">
                      {getDisplayName(classData.teacher).charAt(0)}
                    </div>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{getDisplayName(classData.teacher)}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Giáo viên chủ nhiệm</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{classData.teacher.email}</p>
                  </div>
                </>
              ) : (
                <div className="text-center xl:text-left">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 italic">Chưa giao giáo viên chủ nhiệm</p>
                </div>
              )}
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex flex-row gap-3 shrink-0 w-full xl:w-auto justify-center">
              <button
                onClick={() => router.back()}
                className="flex-1 xl:flex-none px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại
              </button>
              <PermissionGuard permissions="classes.manage">
                <Link href={routes.classes.edit(classId)} className="flex-1 xl:flex-none">
                  <button className="w-full px-5 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs rounded-2xl hover:scale-105 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Quản lý lớp
                  </button>
                </Link>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Dashboard Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sĩ số lớp</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">
              {(classData.students?.length !== undefined ? classData.students.length : classData.enrollment_count) || 0}
              {(classData.capacity || classData.max_capacity) && (
                <span className="text-sm font-bold text-gray-400">
                  / {classData.capacity || classData.max_capacity}
                </span>
              )}
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">học sinh</span>
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số buổi học</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">
              {classData.timetable?.length || 0}
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">buổi/tuần</span>
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phòng học</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">
              {classData.room || "---"}
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">cố định</span>
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngày bắt đầu</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">
              {classData.created_at ? format(new Date(classData.created_at), 'dd/MM') : '---'}
              <span className="text-xs font-bold text-gray-400 font-sans">{classData.created_at ? format(new Date(classData.created_at), 'yyyy') : ''}</span>
            </span>
          </div>
        </div>

        {/* Main Tabbed Panel */}
        <div className="space-y-8">
          {/* Tabs Navigation */}
          <div className="flex p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-[2rem] border border-white dark:border-gray-700 shadow-sm max-w-2xl">
            <button
              onClick={() => setActiveTab('actions')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-3xl font-black text-sm transition-all",
                activeTab === 'actions' ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xl" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <TrendingUp className="w-5 h-5" />
              Hoạt động lớp học
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-3xl font-black text-sm transition-all",
                activeTab === 'students' ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xl" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Users className="w-5 h-5" />
              Danh sách học sinh
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-3xl font-black text-sm transition-all",
                activeTab === 'details' ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xl" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Info className="w-5 h-5" />
              Thông tin chung
            </button>
          </div>

          {/* Tab Content: Actions / Operations */}
          {activeTab === 'actions' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PermissionGuard
                  permissions="attendance.mark"
                  fallback={
                    <div className="p-10 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-700 text-center text-sm text-gray-400 italic bg-white dark:bg-gray-800 flex items-center justify-center">
                      Bạn không có quyền điểm danh lớp này.
                    </div>
                  }
                >
                  <Link href={`/dashboard/attendance/mark?class=${classId}`} className="group relative bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 p-8">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl group-hover:rotate-12 transition-transform">
                        <ClipboardCheck className="w-8 h-8 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Điểm danh</h3>
                      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">Ghi nhận sự vắng mặt và hiện diện của học sinh trong buổi học.</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all mt-6">
                      Bắt đầu ngay <MoreVertical className="w-4 h-4" />
                    </div>
                  </Link>
                </PermissionGuard>

                <PermissionGuard
                  permissions="grades.entry"
                  fallback={
                    <div className="p-10 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-700 text-center text-sm text-gray-400 italic bg-white dark:bg-gray-800 flex items-center justify-center">
                      Bạn không có quyền nhập điểm lớp này.
                    </div>
                  }
                >
                  <Link href={`/dashboard/grades/entry?class=${classId}`} className="group relative bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 p-8">
                      <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl group-hover:rotate-12 transition-transform">
                        <FileText className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Sổ điểm</h3>
                      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">Nhập điểm định kỳ, điểm kiểm tra và theo dõi tiến độ học tập.</p>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all mt-6">
                      Vào sổ điểm <MoreVertical className="w-4 h-4" />
                    </div>
                  </Link>
                </PermissionGuard>

                {/* Quick Actions Panel as 3rd Grid column */}
                <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="absolute top-0 right-0 p-8">
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                      <Info className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Tiện ích</h3>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">Xuất báo cáo danh sách lớp học hoặc gửi thông báo nhanh.</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-6 w-full">
                    <Link href={`/dashboard/admin/announcements/create?classId=${classId}`} className="w-full">
                      <button className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Gửi thông báo</span>
                      </button>
                    </Link>
                    <button 
                      onClick={() => window.print()}
                      className="w-full py-3.5 px-4 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Xuất PDF/In</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Weekly Schedule Grid */}
              <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8">
                  <Calendar className="w-12 h-12 text-blue-500/5 group-hover:scale-125 transition-transform duration-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 border-l-4 border-blue-500 pl-4">Thời khóa biểu chi tiết</h3>
                {classData.timetable && classData.timetable.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classData.timetable.map((slot) => {
                      const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
                      return (
                        <div key={slot.id} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-blue-500 transition-colors">
                          <div className="min-w-0 pr-3">
                            <p className="text-base font-black text-gray-900 dark:text-white truncate">
                              {slot.subject?.name || classData.course?.name || "Môn học"}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest leading-none">
                              {days[slot.day_of_week] || "Chưa xếp"} | {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </p>
                            {slot.teacher && (
                              <p className="text-xs text-gray-500 mt-2 truncate">GV: {slot.teacher.full_name}</p>
                            )}
                          </div>
                          {slot.room && (
                            <span className="shrink-0 text-xs font-black px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                              Phòng {slot.room}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-400 italic bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    Chưa cấu hình thời khóa biểu cho lớp học này.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Students */}
          {activeTab === 'students' && (
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Học sinh trong lớp</h2>
                  <p className="text-sm text-gray-400">Tổng số {classData.students?.length || 0} học sinh đã ghi danh</p>
                </div>
                <PermissionGuard permissions="attendance.mark">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-100 transition-all border border-gray-100 dark:border-gray-700">
                    <Download className="w-4 h-4" />
                    Xuất PDF
                  </button>
                </PermissionGuard>
              </div>

              {classData.students && classData.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Học sinh</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã số</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Liên hệ</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {classData.students.map((student) => (
                        <tr key={student.id} className="group hover:bg-gray-50 dark:hover:bg-gray-950/20 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {getDisplayName(student).charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900 dark:text-white">{getDisplayName(student)}</p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Học sinh</span>
                                  <span className="text-gray-300">•</span>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                    student.status === "active" && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                    student.status === "enrolled" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
                                    student.status === "inactive" && "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                    student.status === "dropped" && "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
                                  )}>
                                    {student.status === "active" ? "Đang học" : student.status === "enrolled" ? "Đã ghi danh" : student.status === "dropped" ? "Thôi học" : "Tạm ngưng"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-mono text-xs font-bold text-gray-600 dark:text-gray-400">
                            {student.student_code || '---'}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Mail className="w-3.5 h-3.5" />
                              {student.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Link href={`/dashboard/students/${student.id}`}>
                              <button className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-blue-600 hover:shadow-lg transition-all">
                                <ExternalLink className="w-5 h-5" />
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Chưa có học sinh</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">Lớp học này hiện đang trống. Hãy ghi danh học sinh từ trang quản lý lớp học.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Details */}
          {activeTab === 'details' && (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-gray-50 dark:border-gray-700 pb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Thông tin tổng quan lớp học</h2>
                <p className="text-sm text-gray-400">Các thông tin cơ bản và mô tả của lớp học</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tên lớp học</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{classData.name}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Mã lớp</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{classData.code || "---"}</span>
                </div>
                {classData.course && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Khóa học liên kết</span>
                    <span className="text-sm font-black text-gray-950 dark:text-white">{classData.course.name} ({classData.course.code})</span>
                  </div>
                )}
                {classData.academic_year && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Năm học</span>
                    <span className="text-sm font-black text-gray-950 dark:text-white">{classData.academic_year.name}</span>
                  </div>
                )}
              </div>

              {classData.description && (
                <div className="pt-6 border-t border-gray-50 dark:border-gray-700 space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Mô tả chi tiết</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {classData.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

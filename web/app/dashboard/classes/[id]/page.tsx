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

interface ClassDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  schedule?: string;
  room?: string;
  created_at: string;
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
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'details' | 'actions'>('students');

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);

        const response = await apiFetch(`/api/v2/classes/${classId}`);
        if (!response.ok) throw new Error("Không thể tải thông tin lớp học");

        const resJson = await response.json();
        const cls = resJson.class;

        const studentsRes = await apiFetch(`/api/v2/classes/${classId}/students`);
        let students: any[] = [];
        if (studentsRes.ok) {
          const studentsJson = await studentsRes.json();
          students = (studentsJson.data || studentsJson.students || []) as any[];
        }

        setClassData({
          ...cls,
          students,
          enrollment_count: Array.isArray(students) ? students.length : (cls._count?.enrollments || cls.enrollment_count),
        });
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
        {/* Premium Hero Header */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
          <div className="absolute top-0 right-0 w-[400px] h-full bg-blue-500/5 dark:bg-blue-500/10 skew-x-12 translate-x-20 transition-transform group-hover:skew-x-6 duration-700" />

          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl overflow-hidden">
                <div className="w-full h-full rounded-[2rem] bg-white dark:bg-gray-900 flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-full mb-4">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">{classData.code}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">
                {classData.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                {classData.course && (
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-purple-50 dark:bg-purple-500/10 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest leading-none mb-1">Khóa học</span>
                      <span className="text-sm font-black text-purple-700 dark:text-purple-300">{classData.course.name}</span>
                    </div>
                  </div>
                )}
                {classData.academic_year && (
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Năm học</span>
                      <span className="text-sm font-black text-blue-700 dark:text-blue-300">{classData.academic_year.name}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <Users className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300">{classData.enrollment_count || 0} Học viên</span>
                </div>
                {classData.room && (
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-black text-gray-700 dark:text-gray-300">Phòng {classData.room}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.back()}
                className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Quay lại
              </button>
              <Link href={routes.classes.edit(classId)}>
                <button className="w-full px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-gray-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95">
                  <Edit3 className="w-5 h-5" />
                  Quản lý lớp
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs Navigation */}
            <div className="flex p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-[2rem] border border-white dark:border-gray-700 shadow-sm">
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
                Thông tin chi tiết
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-3xl font-black text-sm transition-all",
                  activeTab === 'actions' ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xl" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <TrendingUp className="w-5 h-5" />
                Hoạt động
              </button>
            </div>

            {/* Tab Content: Students */}
            {activeTab === 'students' && (
              <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Học sinh trong lớp</h2>
                    <p className="text-sm text-gray-400">Tổng số {classData.students?.length || 0} học sinh đã ghi danh</p>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-100 transition-all border border-gray-100 dark:border-gray-700">
                    <Download className="w-4 h-4" />
                    Xuất PDF
                  </button>
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
                          <tr key={student.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  {getDisplayName(student).charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-gray-900 dark:text-white">{getDisplayName(student)}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Học viên</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8">
                    <BookOpen className="w-12 h-12 text-blue-500/5 group-hover:scale-125 transition-transform duration-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 border-l-4 border-blue-500 pl-4">Giáo viên chủ nhiệm</h3>
                  {classData.teacher ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-[2rem] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                          <span className="text-2xl font-black text-blue-600">{getDisplayName(classData.teacher).charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{getDisplayName(classData.teacher)}</p>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Giáo viên phụ trách</p>
                        </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="font-bold">{classData.teacher.email}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-orange-50 dark:bg-orange-500/5 rounded-3xl border border-dashed border-orange-200 dark:border-orange-500/20 text-center">
                      <p className="text-sm font-bold text-orange-600 italic">Chưa giao giáo viên chủ nhiệm</p>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8">
                    <Calendar className="w-12 h-12 text-purple-500/5 group-hover:scale-125 transition-transform duration-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 border-l-4 border-purple-500 pl-4">Lịch học & Phòng</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Thời gian</p>
                        <p className="text-sm font-black text-gray-700 dark:text-gray-300 leading-relaxed">{classData.schedule || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-3xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Địa điểm</p>
                        <p className="text-sm font-black text-gray-700 dark:text-gray-300">Phòng {classData.room || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Actions */}
            {activeTab === 'actions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <Link href={`/dashboard/attendance/mark?class=${classId}`} className="group relative bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl group-hover:rotate-12 transition-transform">
                      <ClipboardCheck className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>
                  <div className="relative">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Điểm danh</h3>
                    <p className="text-sm text-gray-400 mb-8 max-w-xs">Ghi nhận sự vắng mặt và hiện diện của học sinh trong buổi học này.</p>
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                      Bắt đầu ngay <MoreVertical className="w-4 h-4" />
                    </div>
                  </div>
                </Link>

                <Link href={`/dashboard/grades/entry?class=${classId}`} className="group relative bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                    <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl group-hover:rotate-12 transition-transform">
                      <FileText className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                  <div className="relative">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Sổ điểm</h3>
                    <p className="text-sm text-gray-400 mb-8 max-w-xs">Nhập điểm định kỳ, điểm kiểm tra và theo dõi tiến độ học tập.</p>
                    <div className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                      Vào sổ điểm <MoreVertical className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-gray-900 dark:bg-black p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
              <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Lưu ý hệ thống
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed font-bold italic mb-10">
                "Trái tim của quản lý lớp học nằm ở sự chính xác. Mọi dữ liệu bạn cập nhật sẽ được thông báo ngay lập tức cho phụ huynh qua ứng dụng Mobile."
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Đăng ký mới</span>
                  <span className="text-xs font-black text-white">+0 hôm nay</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ngày khởi tạo</span>
                  <span className="text-xs font-black text-white">{classData.created_at ? format(new Date(classData.created_at), 'dd/MM/yyyy', { locale: vi }) : '---'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest">Lớp học liên quan</h3>
              <div className="space-y-4">
                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:border-blue-500 transition-all cursor-pointer">
                  <div className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">Lớp song hành</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cùng khối 10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getClassById } from "@/lib/api/client";
import { LoadingState, Badge, Button } from "@/components/ui";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
    email: string;
  };
  enrollment_count?: number;
  students?: Array<{
    id: string;
    full_name: string;
    email: string;
    student_code?: string;
  }>;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);

        const [cls, studentsRes] = await Promise.all([
          getClassById(classId),
          apiFetch(`/api/classes/${classId}/students`) // Keep legacy student fetch for now
        ]);

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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-stone-900 rounded-[48px] border border-stone-100 dark:border-white/5 shadow-2xl p-12 text-center">
          <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <Icons.Classes className="w-10 h-10 text-stone-400" />
          </div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight">
            {error === "Class not found" ? "Không tìm thấy lớp học" : "Lỗi tải thông tin"}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-sm mx-auto">
            {error || "Không thể tải thông tin lớp học. Vui lòng thử lại sau."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.back()} variant="outline" className="rounded-2xl px-8 h-12">
              Quay lại
            </Button>
            <Link href={routes.classes.list()}>
              <Button variant="gold" className="rounded-2xl px-8 h-12">Xem tất cả lớp</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in relative">
      {/* Subtle Background Effects */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* Reworked Compact Hero Header */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="bg-stone-50/50 dark:bg-white/[0.02] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-1 shadow-lg">
              <div className="w-full h-full rounded-xl bg-stone-900 flex items-center justify-center text-2xl font-bold text-white uppercase">
                {classData.name?.charAt(0) || "C"}
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight truncate">
                {classData.name}
              </h1>
              <Badge variant="gold" className="px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider">
                {classData.code}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Icons.Users className="w-4 h-4 text-emerald-500" />
                <span>{classData.enrollment_count || 0} học sinh</span>
              </div>
              {classData.room && (
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Icons.Location className="w-4 h-4 text-amber-500" />
                  <span>Phòng {classData.room}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-11 px-5 border-stone-200 dark:border-white/10 font-semibold"
              onClick={() => router.back()}
              leftIcon={<Icons.Back className="w-4 h-4" />}
            >
              Quay lại
            </Button>
            <Link href={routes.classes.edit(classId)} className="w-full md:w-auto">
              <Button
                variant="gold"
                size="sm"
                className="w-full rounded-xl h-11 px-5 font-semibold shadow-md shadow-amber-500/10"
                leftIcon={<Icons.Edit className="w-4 h-4" />}
              >
                Chỉnh sửa
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-stone-200 dark:border-white/10 shadow-sm glass-premium p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Icons.Info className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="font-bold text-stone-900 dark:text-white">Thông tin cơ bản</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Mã lớp & Tên lớp</label>
                  <p className="font-bold text-stone-900 dark:text-white">{classData.code} - {classData.name}</p>
                </div>
                {classData.teacher && (
                  <div>
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Giáo viên phụ trách</label>
                    <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-100 dark:border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-white text-sm">
                        {classData.teacher.full_name.charAt(0)}
                      </div>
                      <span className="font-semibold text-stone-900 dark:text-white text-sm">{classData.teacher.full_name}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="rounded-2xl border-stone-200 dark:border-white/10 shadow-sm glass-premium p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Icons.Calendar className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="font-bold text-stone-900 dark:text-white">Lịch học & Phòng</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Thời gian học</label>
                  <p className="font-semibold text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
                    {classData.schedule || "Chưa cập nhật lịch học"}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Vị trí</label>
                  <p className="font-semibold text-stone-700 dark:text-stone-300 text-sm">
                    {classData.room ? `Phòng ${classData.room}` : "Chưa chỉ định phòng"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Student List */}
          <Card className="rounded-2xl border-stone-200 dark:border-white/10 shadow-sm glass-premium overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/30 dark:bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200 dark:bg-stone-800 rounded-lg">
                  <Icons.Users className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                </div>
                <h2 className="font-bold text-stone-900 dark:text-white">Học sinh tham gia</h2>
                <Badge variant="default" className="ml-2 font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">{classData.students?.length || 0}</Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-9 px-3 text-stone-500 hover:text-stone-900 dark:hover:text-white">
                <Icons.Download className="w-4 h-4 mr-2" /> Xuất danh sách
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {classData.students && classData.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-stone-50/50 dark:bg-stone-900/50">
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider">Học sinh</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider">MSSV</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-stone-400 uppercase tracking-wider">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {classData.students.map((student) => (
                        <tr key={student.id} className="group hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-500 text-sm">
                                {student.full_name?.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-stone-900 dark:text-white text-[13px]">{student.full_name}</span>
                                <span className="text-[11px] text-stone-400">{student.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-[12px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/50 px-2.5 py-1 rounded-md">
                              {student.student_code || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/dashboard/students/${student.id}`}>
                              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg text-stone-400 group-hover:text-amber-600 group-hover:bg-amber-500/10 transition-all">
                                <Icons.ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <Icons.Users className="w-10 h-10 text-stone-200 dark:text-stone-800 mx-auto mb-3" />
                  <p className="text-stone-400 text-sm font-medium">Chưa có học sinh trong lớp này</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border-stone-200 dark:border-white/10 shadow-sm glass-premium p-6">
            <h2 className="font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
              <Icons.Magic className="w-5 h-5 text-amber-500" />
              Thao tác nhanh
            </h2>

            <div className="space-y-3">
              <Link href={`/dashboard/attendance/mark?class=${classId}`} className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/5 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all group">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                  <Icons.Attendance className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Điểm danh</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Ghi nhận chuyên cần lớp học</p>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-500" />
              </Link>

              <Link href={`/dashboard/grades/entry?class=${classId}`} className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/5 hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all group">
                <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-600">
                  <Icons.Grades className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Nhập điểm</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Cập nhật kết quả bài kiểm tra</p>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-orange-500" />
              </Link>

              <Link href={`/dashboard/grades/assignments?class=${classId}`} className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/5 hover:border-teal-500/50 hover:bg-teal-50 dark:hover:bg-teal-500/5 transition-all group">
                <div className="p-2.5 bg-teal-500/10 rounded-lg text-teal-600">
                  <Icons.Assignments className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Bài tập</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Quản lý các cột điểm bài tập</p>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-teal-500" />
              </Link>
            </div>
          </Card>

          <Card className="rounded-2xl bg-stone-900 dark:bg-stone-950 p-6 border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                <Icons.Info className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Lưu ý quản lý</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-medium">
              Dữ liệu thay đổi sẽ được đồng bộ thời gian thực đến phụ huynh qua ứng dụng BH-EDU Mobile. Hãy đảm bảo thông tin chính xác.
            </p>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <span>Ngày tạo</span>
              <span className="text-stone-300">{classData.created_at ? format(new Date(classData.created_at), 'dd/MM/yyyy', { locale: vi }) : '---'}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

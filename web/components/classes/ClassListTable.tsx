import Link from "next/link";
import { GraduationCap, Users, MapPin, Calendar, Search, Edit3 } from "lucide-react";
import { PermissionGuard } from "@/hooks/usePermissions";
import { Icons } from "@/components/ui/Icons";
import { routes } from "@/lib/routes";
import { getDisplayName } from "@/lib/utils/names";

interface Teacher {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  description?: string;
  room?: string;
  schedule?: string;
  teacher?: Teacher;
  course?: { id: string; name: string; code: string };
  academic_year?: { id: string; name: string };
  enrollment_count?: number;
}

interface ClassListTableProps {
  classes: ClassData[];
  searchQuery: string;
}

export default function ClassListTable({ classes, searchQuery }: ClassListTableProps) {
  const filtered = classes.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800">
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">
          {searchQuery ? `Không tìm thấy lớp học phù hợp với từ khóa "${searchQuery}"` : "Không có lớp học nào"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-stone-50 dark:bg-stone-900/50">
            <th className="px-6 py-4 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Lớp học</th>
            <th className="px-6 py-4 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Khóa học</th>
            <th className="px-6 py-4 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Giáo viên</th>
            <th className="px-6 py-4 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Sĩ số</th>
            <th className="px-6 py-4 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Phòng/Lịch</th>
            <th className="px-6 py-4 text-right text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50 dark:divide-stone-800/80">
          {filtered.map((cls) => (
            <tr key={cls.id} className="group hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <Link href={routes.classes.detail(cls.id)} className="text-sm font-bold text-stone-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {cls.name}
                    </Link>
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">{cls.code || cls.course?.code || 'Chưa thiết lập'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {cls.course ? (
                  <div className="flex items-center gap-1.5">
                    <Icons.Classes className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">{cls.course.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-stone-450 dark:text-stone-500 italic">Chưa chọn</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 flex items-center justify-center font-bold text-[10px] text-stone-550 dark:text-stone-450">
                    {cls.teacher ? getDisplayName(cls.teacher).charAt(0).toUpperCase() : "?"}
                  </div>
                  <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    {cls.teacher ? getDisplayName(cls.teacher) : "Chưa giao"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg">
                  <Users className="w-3.5 h-3.5" />
                  {cls.enrollment_count || 0}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-stone-550 dark:text-stone-400">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{cls.room || "Chưa xếp phòng"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-550 dark:text-stone-400">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{cls.schedule || "Chưa xếp lịch"}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={routes.classes.detail(cls.id)} title="Chi tiết lớp học">
                    <button className="p-2 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700/60 rounded-xl text-stone-500 hover:text-blue-600 hover:border-blue-500/30 dark:hover:text-blue-400 shadow-sm transition-all">
                      <Search className="w-4 h-4" />
                    </button>
                  </Link>
                  <PermissionGuard permissions="classes.manage">
                    <Link href={routes.classes.edit(cls.id)} title="Chỉnh sửa lớp học">
                      <button className="p-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold shadow-md hover:scale-105 transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </Link>
                  </PermissionGuard>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

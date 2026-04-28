import Link from "next/link";
import { GraduationCap, Users, MapPin, Calendar, Search, Plus } from "lucide-react";
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
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900/50">
            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Lớp học</th>
            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Khóa học</th>
            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Giáo viên</th>
            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sĩ số</th>
            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Phòng/Lịch</th>
            <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
          {filtered.map((cls) => (
            <tr key={cls.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{cls.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cls.code || cls.course?.code || 'N/A'}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                {cls.course ? (
                  <div className="flex items-center gap-2">
                    <Icons.Classes className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cls.course.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">N/A</span>
                )}
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-[10px] text-gray-500">
                    {cls.teacher ? cls.teacher.full_name.charAt(0) : "?"}
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {cls.teacher ? getDisplayName(cls.teacher) : "Chưa giao"}
                  </span>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 text-xs font-black rounded-full">
                  <Users className="w-3.5 h-3.5" />
                  {cls.enrollment_count || 0}
                </span>
              </td>
              <td className="px-8 py-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {cls.room || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {cls.schedule || "N/A"}
                  </div>
                </div>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={routes.classes.detail(cls.id)}>
                    <button className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-600 hover:text-blue-600 shadow-sm transition-all">
                      <Search className="w-4 h-4" />
                    </button>
                  </Link>
                  <PermissionGuard permissions="classes.manage">
                    <Link href={routes.classes.edit(cls.id)}>
                      <button className="p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg transition-all">
                        <Plus className="w-4 h-4" />
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

import Link from "next/link";
import { GraduationCap, Users, MapPin, Calendar, MoreVertical } from "lucide-react";
import { PermissionGuard } from "@/hooks/usePermissions";
import { Icons } from "@/components/ui/Icons";
import { routes } from "@/lib/routes";
import { getDisplayName } from "@/lib/utils/names";

interface Teacher {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  created_at: string;
  teacher_id: string;
  description?: string;
  room?: string;
  teacher?: Teacher;
  course?: { id: string; name: string; code: string };
  academic_year?: { id: string; name: string };
  enrollment_count?: number;
}

interface ClassListGridProps {
  classes: ClassData[];
  searchQuery: string;
  canEnrollStudents: boolean;
  onEnrollClick: (cls: ClassData) => void;
}

export default function ClassListGrid({ classes, searchQuery, canEnrollStudents, onEnrollClick }: ClassListGridProps) {
  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {filtered.map((cls) => (
        <div
          key={cls.id}
          className="group relative bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 group-hover:rotate-12 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <span className="inline-block px-4 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                {cls.code}
              </span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                {cls.name}
              </h2>
              {cls.course && (
                <div className="flex items-center gap-2 mb-3">
                  <Icons.Classes className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {cls.course.name}
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-400 line-clamp-2 italic">
                {cls.description || "Lớp học chưa có mô tả chi tiết."}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giáo viên</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {cls.teacher ? getDisplayName(cls.teacher) : "Chưa được giao"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{cls.room || "N/A"}</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700/50 col-span-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {cls.academic_year?.name || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-700">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                  >
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-blue-500 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">+{cls.enrollment_count || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={routes.classes.detail(cls.id)}>
                  <button className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl text-gray-600 dark:text-gray-300 transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </Link>
                <PermissionGuard permissions="classes.manage">
                  <Link href={routes.classes.edit(cls.id)}>
                    <button className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-lg">
                      Quản lý
                    </button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

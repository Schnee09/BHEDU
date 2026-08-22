import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Users, MapPin, Calendar, Edit3, Clock, User } from "lucide-react";
import { PermissionGuard } from "@/hooks/usePermissions";
import { Icons } from "@/components/ui/Icons";
import { routes } from "@/lib/routes";
import { getDisplayName } from "@/lib/utils/names";
import { cn } from "@/lib/utils";

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
  schedule?: string;
  capacity?: number | null;
  status?: "active" | "inactive" | "completed";
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
  const router = useRouter();
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filtered.map((cls) => (
        <div
          key={cls.id}
          className="group relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-150 dark:border-stone-800 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full"
        >
          {/* Clickable Card Body linking to detail */}
          <Link href={routes.classes.detail(cls.id)} className="p-6 flex-1 flex flex-col justify-between cursor-pointer">
            <div>
              {/* Header: Class Code & Status */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="inline-block px-2.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                  {cls.code || "LỚP HỌC"}
                </span>
                {cls.status && (
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0",
                    cls.status === "active" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-950/20",
                    cls.status === "inactive" && "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100/50 dark:border-amber-950/20",
                    cls.status === "completed" && "bg-stone-50 text-stone-500 dark:bg-stone-800/40 dark:text-stone-400 border-stone-150 dark:border-stone-800"
                  )}>
                    {cls.status === "active" ? "Hoạt động" : cls.status === "inactive" ? "Tạm ngưng" : "Đã xong"}
                  </span>
                )}
              </div>

              {/* Class Title */}
              <h2 className="text-lg font-bold text-stone-900 dark:text-white leading-snug mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors">
                {cls.name}
              </h2>

              {/* Course Info */}
              {cls.course && (
                <div className="flex items-center gap-1 mb-3">
                  <Icons.Classes className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                    {cls.course.name}
                  </span>
                </div>
              )}

              {/* Clean 2x2 Information Grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 my-4 pt-3.5 border-t border-stone-100 dark:border-stone-800/50 text-[11px] text-stone-500 dark:text-stone-400 font-semibold">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate" title={cls.teacher ? getDisplayName(cls.teacher) : "Chưa giao giáo viên"}>
                    {cls.teacher ? getDisplayName(cls.teacher) : "Chưa giao"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate" title={cls.room || "Chưa xếp phòng"}>
                    {cls.room || "Chưa xếp phòng"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate" title={cls.schedule || "Chưa xếp lịch"}>
                    {cls.schedule || "Chưa xếp lịch"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate" title={cls.academic_year?.name || "Chưa gán năm học"}>
                    {cls.academic_year?.name || "Chưa gán năm"}
                  </span>
                </div>
              </div>

              {/* Thin Sĩ số progress bar */}
              {(() => {
                const studentCount = cls.enrollment_count || 0;
                const maxCapacity = cls.capacity || 40;
                const fillPct = Math.min(100, Math.round((studentCount / maxCapacity) * 100));
                return (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      <span>Lớp lấp đầy ({fillPct}%)</span>
                      <span>{studentCount}/{maxCapacity} HS</span>
                    </div>
                    <div className="h-1 bg-stone-50 dark:bg-stone-850 border border-stone-100 dark:border-stone-800/80 rounded-full overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          fillPct >= 90
                            ? "bg-rose-500"
                            : fillPct >= 70
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        )}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </Link>

          {/* Action Footer (Excluded from the main Link to avoid nested links) */}
          <div className="px-6 pb-6 pt-4 border-t border-stone-50 dark:border-stone-800/60 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-150 dark:border-stone-800 rounded-lg text-[10px] font-bold text-stone-500 dark:text-stone-400">
              <Users className="w-3 h-3 text-stone-400" />
              <span>{cls.enrollment_count || 0} học sinh</span>
            </div>

            <div className="flex gap-1.5 items-center justify-end">
              {canEnrollStudents && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onEnrollClick(cls);
                  }}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-all border border-blue-100/50 dark:border-blue-500/20 flex items-center gap-1"
                  title="Ghi danh học sinh"
                >
                  <Users className="w-3 h-3" />
                  Ghi danh
                </button>
              )}
              <PermissionGuard permissions="classes.manage">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(routes.classes.edit(cls.id));
                  }}
                  className="p-1.5 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-500 dark:text-stone-450 transition-all border border-stone-100 dark:border-stone-800"
                  title="Chỉnh sửa cấu hình lớp"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

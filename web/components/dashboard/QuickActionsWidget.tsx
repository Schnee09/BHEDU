import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface QuickActionsWidgetProps {
    isAdmin: boolean;
    isTeacher: boolean;
    isStudent: boolean;
}

export function QuickActionsWidget({ isAdmin, isTeacher, isStudent }: QuickActionsWidgetProps) {
    return (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h2 className="text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-3 border-l-4 border-amber-500 mx-2">Tác vụ nhanh</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
                {isAdmin && (
                    <>
                        <QuickActionSmall href={routes.students.list()} icon={<Icons.Students />} title="Học sinh" color="orange" />
                        <QuickActionSmall href="/dashboard/users" icon={<Icons.Teachers />} title="Giảng viên" color="purple" />
                        <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp học" color="green" />
                        <QuickActionSmall href="/dashboard/settings" icon={<Icons.Settings />} title="Cài đặt" color="slate" />
                    </>
                )}
                {isTeacher && (
                    <>
                        <QuickActionSmall href={routes.classes.list()} icon={<Icons.Classes />} title="Lớp dạy" color="blue" />
                        <QuickActionSmall href="/dashboard/grades" icon={<Icons.Grades />} title="Nhập điểm" color="purple" />
                        <QuickActionSmall href={routes.attendance.mark()} icon={<Icons.Attendance />} title="Điểm danh" color="orange" />
                        <QuickActionSmall href="/dashboard/timetable" icon={<Icons.Calendar />} title="Lịch dạy" color="amber" />
                    </>
                )}
                {isStudent && (
                    <>
                        <QuickActionSmall href={routes.grades.assignments()} icon={<Icons.Assignments />} title="Bài tập" color="green" />
                        <QuickActionSmall href={routes.grades.list()} icon={<Icons.Grades />} title="Kết quả" color="purple" />
                        <QuickActionSmall href={routes.timetable.mySchedule()} icon={<Icons.Calendar />} title="Thời khóa biểu" color="blue" />
                        <QuickActionSmall href={routes.profile()} icon={<Icons.Users />} title="Hồ sơ" color="slate" />
                    </>
                )}
            </div>
        </section>
    );
}

/**
* Small PC-optimized Quick Action - Academic Style
*/
function QuickActionSmall({ href, icon, title, color }: any) {
    return (
        <Link href={href} className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl border border-stone-200/50 dark:border-white/5 hover:border-amber-500/50 hover:shadow-[0_25px_50px_-20px_rgba(245,158,11,0.15)] transition-all duration-500 active:scale-95 overflow-hidden">
            {/* Background Accent */}
            <div className={cn("absolute right-[-15%] top-[-15%] w-24 h-24 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700",
                color === 'orange' ? 'bg-orange-500' :
                    color === 'purple' ? 'bg-purple-500' :
                        color === 'green' ? 'bg-green-500' :
                            color === 'blue' ? 'bg-blue-500' :
                                color === 'amber' ? 'bg-amber-500' : 'bg-stone-500'
            )} />

            <div className={cn("p-4 rounded-2xl transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 shadow-sm relative z-10",
                color === 'orange' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                    color === 'purple' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                        color === 'green' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                            color === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                color === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-stone-500/10 text-stone-600 dark:text-stone-400'
            )}>
                <div className="scale-125">{icon}</div>
            </div>
            <span className="font-black text-xs text-stone-800 dark:text-white uppercase tracking-wider relative z-10">{title}</span>
        </Link>
    );
}

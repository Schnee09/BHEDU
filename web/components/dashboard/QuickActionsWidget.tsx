import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  adminQuickActions,
  teacherQuickActions,
  studentQuickActions,
  tutorQuickActions,
  QuickActionItem,
} from './config/quick-actions';
import { getDashboardColorStyles } from './styles/color-variants';

interface QuickActionsWidgetProps {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isTutor?: boolean;
}

export function QuickActionsWidget({
  isAdmin,
  isTeacher,
  isStudent,
  isTutor,
}: QuickActionsWidgetProps) {
  let actions: QuickActionItem[] = [];
  if (isAdmin) actions = adminQuickActions;
  else if (isTeacher) actions = teacherQuickActions;
  else if (isTutor) actions = tutorQuickActions;
  else if (isStudent) actions = studentQuickActions;

  if (actions.length === 0) return null;

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      <h2 className="text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest pl-3 border-l-4 border-amber-500 mx-2">
        Tác vụ nhanh
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
        {actions.map((action, index) => (
          <QuickActionSmall key={index} {...action} />
        ))}
      </div>
    </section>
  );
}

/**
 * Small PC-optimized Quick Action - Academic Style
 */
function QuickActionSmall({ href, icon, title, color }: QuickActionItem) {
  const styles = getDashboardColorStyles(color);

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl border border-stone-200/50 dark:border-white/5 transition-all duration-500 active:scale-95 overflow-hidden',
        'hover:border-amber-500/50 hover:shadow-[0_25px_50px_-20px_rgba(245,158,11,0.15)]'
      )}
    >
      {/* Background Accent */}
      <div
        className={cn(
          'absolute right-[-15%] top-[-15%] w-24 h-24 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700',
          styles.accent
        )}
      />

      <div
        className={cn(
          'p-4 rounded-2xl transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 shadow-sm relative z-10',
          styles.container
        )}
      >
        <div className="scale-125">{icon}</div>
      </div>
      <span className="font-black text-xs text-stone-800 dark:text-white uppercase tracking-wider relative z-10">
        {title}
      </span>
    </Link>
  );
}

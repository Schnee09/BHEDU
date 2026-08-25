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
    <section className="space-y-2.5 sm:space-y-4 animate-in fade-in duration-500">
      <h2 className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider pl-2.5 border-l-3 border-amber-500 mx-1">
        Tác vụ nhanh
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 px-1">
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
        'group relative flex flex-col items-center justify-center gap-2 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-stone-900/60 backdrop-blur-xl border border-stone-200/70 dark:border-white/5 transition-all duration-300 active:scale-95 overflow-hidden shadow-2xs hover:shadow-md',
        'hover:border-amber-500/50 hover:shadow-amber-500/5'
      )}
    >
      {/* Background Accent */}
      <div
        className={cn(
          'absolute right-[-15%] top-[-15%] w-16 h-16 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500',
          styles.accent
        )}
      />

      <div
        className={cn(
          'p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 group-hover:scale-105 shadow-2xs relative z-10',
          styles.container
        )}
      >
        <div className="scale-95 sm:scale-105">{icon}</div>
      </div>
      <span className="font-bold text-[10px] sm:text-xs text-stone-800 dark:text-stone-200 text-center uppercase tracking-wider relative z-10 truncate max-w-full px-1">
        {title}
      </span>
    </Link>
  );
}

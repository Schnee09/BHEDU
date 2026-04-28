export type DashboardColor = 'orange' | 'emerald' | 'green' | 'blue' | 'amber' | 'slate';

export const dashboardColors: Record<DashboardColor, { accent: string; container: string }> = {
  orange: {
    accent: 'bg-orange-500',
    container: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  emerald: {
    accent: 'bg-emerald-500',
    container: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  green: {
    accent: 'bg-green-500',
    container: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  blue: {
    accent: 'bg-blue-500',
    container: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  amber: {
    accent: 'bg-amber-500',
    container: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  slate: {
    accent: 'bg-slate-500',
    container: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
};

export const getDashboardColorStyles = (color: DashboardColor) => {
  return dashboardColors[color] || dashboardColors.slate;
};

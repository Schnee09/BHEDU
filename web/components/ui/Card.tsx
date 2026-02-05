/**
 * Card Component - Clean, Readable Design
 * Light: Soft white with subtle shadow
 * Dark: Dark gray with visible borders
 */

import { ReactNode, memo, useMemo } from 'react';
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  as?: 'div' | 'article' | 'section';
}

export const Card = memo(function Card({
  children,
  className = '',
  hover = false,
  onClick,
  as: Component = 'div'
}: CardProps) {
  const isClickable = !!onClick;

  const cardClassName = useMemo(() => `
    rounded-2xl transition-all duration-200
    glass-card text-foreground
    ${hover || isClickable ? 'hover:shadow-lg hover:-translate-y-0.5' : ''}
    ${isClickable ? 'cursor-pointer press-effect' : ''}
    ${className}
  `, [hover, isClickable, className]);

  return (
    <Component
      onClick={onClick}
      className={cardClassName}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </Component>
  );
});

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = memo(({ children, className = '' }: CardHeaderProps) => {
  return (
    <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100/10 dark:border-white/5 ${className}`}>
      {children}
    </div>
  );
});

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody = memo(({ children, className = '' }: CardBodyProps) => {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 ${className}`}>
      {children}
    </div>
  );
});

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = memo(function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 ${className}`}>
      {children}
    </div>
  );
});

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const CardDescription = memo(function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </p>
  );
});

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = memo(function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-xl font-bold leading-none tracking-tight text-white dark:text-white ${className}`}>
      {children}
    </h3>
  );
});

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = memo(function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100/10 dark:border-white/5 ${className}`}>
      {children}
    </div>
  );
});

/**
 * Stat Card - DUAL THEME Style Dashboard Metrics
 * Light: Neumorphic with soft colors
 * Dark: Glassmorphism with glowing accents
 */
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'slate';
  onClick?: () => void;
  className?: string;
}

const COLOR_CLASSES = {
  blue: {
    icon: 'bg-primary-50 dark:bg-primary-900/20 text-primary dark:text-primary-400',
  },
  green: {
    icon: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  },
  orange: {
    icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  },
  purple: {
    icon: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  },
  slate: {
    icon: 'bg-surface-secondary text-secondary',
  },
} as const;

export const StatCard = memo(function StatCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  onClick,
  className = ""
}: StatCardProps) {
  const styles = useMemo(() => COLOR_CLASSES[color], [color]);

  const containerClassName = useMemo(() => `
    group relative overflow-hidden rounded-[20px] transition-all duration-300
    bg-white dark:bg-stone-900/60 backdrop-blur-xl
    border border-stone-200 dark:border-white/10
    hover:border-amber-500/50 hover:shadow-md
    ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
    ${className}
  `, [onClick, className]);

  return (
    <div
      onClick={onClick}
      className={containerClassName}
    >


      <div className="p-4 sm:p-5 md:p-6 flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tabular-nums tracking-tight">{value}</p>
          </div>
          {subtitle && (
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1 opacity-70">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                trend.isPositive
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-amber-500/10",
            styles.icon
          )}>
            <div className="scale-90 sm:scale-100">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
});

export default Card;

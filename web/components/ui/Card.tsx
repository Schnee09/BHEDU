/**
 * Card Component - Clean, Readable Design
 * Light: Soft white with subtle shadow
 * Dark: Dark gray with visible borders
 */

import { ReactNode, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  as?: 'div' | 'article' | 'section';
  padding?: string;
  variant?: string;
  borderStyle?: 'solid' | 'dashed';
}

export const Card = memo(function Card({
  children,
  className = '',
  hover = false,
  onClick,
  as: Component = 'div',
  padding,
  variant,
  borderStyle = 'solid',
}: CardProps) {
  const isClickable = !!onClick;

  return (
    <Component
      onClick={onClick}
      className={cn(
        'rounded-2xl sm:rounded-3xl transition-all duration-300 glass-premium text-foreground',
        borderStyle === 'dashed'
          ? 'border-2 border-dashed border-stone-200 dark:border-white/10'
          : 'border border-stone-200/80 dark:border-white/5',
        hover || isClickable
          ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-amber-500/30'
          : 'shadow-2xs',
        isClickable ? 'cursor-pointer active:scale-[0.98]' : '',
        padding || 'p-3.5 sm:p-5 lg:p-6',
        className
      )}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </Component>
  );
});
Card.displayName = 'Card';

interface CardHeaderProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const CardHeader = memo(({ children, className = '', title, subtitle }: CardHeaderProps) => {
  return (
    <div
      className={`px-3.5 sm:px-5 lg:px-6 py-2.5 sm:py-3.5 border-b border-stone-100 dark:border-white/5 ${className}`}
    >
      {title && <CardTitle>{title}</CardTitle>}
      {subtitle && <CardDescription>{subtitle}</CardDescription>}
      {children}
    </div>
  );
});
CardHeader.displayName = 'CardHeader';

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody = memo(({ children, className = '' }: CardBodyProps) => {
  return <div className={`px-3.5 sm:px-5 lg:px-6 py-3 sm:py-4.5 ${className}`}>{children}</div>;
});
CardBody.displayName = 'CardBody';

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = memo(function CardContent({
  children,
  className = '',
}: CardContentProps) {
  return <div className={`px-3.5 sm:px-5 lg:px-6 py-3 sm:py-4.5 ${className}`}>{children}</div>;
});
CardContent.displayName = 'CardContent';

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const CardDescription = memo(function CardDescription({
  children,
  className = '',
}: CardDescriptionProps) {
  return <p className={`text-xs text-stone-500 dark:text-stone-400 ${className}`}>{children}</p>;
});
CardDescription.displayName = 'CardDescription';

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = memo(function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-base sm:text-lg font-serif font-black leading-tight tracking-tight text-stone-900 dark:text-white transition-colors duration-200',
        className
      )}
    >
      {children}
    </h3>
  );
});
CardTitle.displayName = 'CardTitle';

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = memo(function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={`px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100/10 dark:border-white/5 ${className}`}
    >
      {children}
    </div>
  );
});
CardFooter.displayName = 'CardFooter';

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
    value: string | number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'slate' | 'amber' | 'emerald';
  onClick?: () => void;
  className?: string;
}

const COLOR_CLASSES = {
  blue: {
    icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500/5 to-transparent',
  },
  green: {
    icon: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    gradient: 'from-green-500/5 to-transparent',
  },
  orange: {
    icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500/5 to-transparent',
  },
  emerald: {
    icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/5 to-transparent',
  },
  slate: {
    icon: 'bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400',
    gradient: 'from-stone-500/5 to-transparent',
  },
  amber: {
    icon: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/5 to-transparent',
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
  className = '',
}: StatCardProps) {
  const styles = useMemo(
    () => COLOR_CLASSES[color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue,
    [color]
  );

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300',
        'bg-white dark:bg-[#14120E]',
        'border border-stone-200/80 dark:border-white/10 shadow-xs',
        'hover:border-primary/40 hover:-translate-y-1 hover:shadow-md',
        onClick ? 'cursor-pointer active:scale-[0.97]' : '',
        className
      )}
    >
      {/* Dynamic Gradient Background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br transition-opacity duration-300 opacity-20 group-hover:opacity-40',
          styles.gradient
        )}
        aria-hidden="true"
      />

      <div className="p-3 sm:p-4 md:p-5 flex items-start justify-between gap-2 relative z-10">
        <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1 font-sans">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-lg sm:text-xl md:text-2xl font-black text-stone-900 dark:text-white tabular-nums tracking-tight transition-transform duration-300 group-hover:translate-x-0.5">
              {value}
            </p>
          </div>
          {subtitle && (
            <p className="text-[9.5px] sm:text-[11px] font-medium text-stone-400 dark:text-stone-500 tracking-tight truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 pt-0.5">
              <span
                className={cn(
                  'text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter',
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'}{' '}
                {typeof trend.value === 'number' ? `${Math.abs(trend.value)}%` : trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-2xs group-hover:scale-105',
              styles.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

export default Card;

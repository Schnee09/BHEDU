/**
 * Card Component - Clean, Readable Design
 * Light: Soft white with subtle shadow
 * Dark: Dark gray with visible borders
 */

import { ReactNode, memo, useMemo } from 'react';

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
    rounded-xl transition-all duration-200
    bg-surface border border-border
    text-foreground
    shadow-sm
    ${hover || isClickable ? 'hover:shadow-md hover:border-primary/20' : ''}
    ${isClickable ? 'cursor-pointer' : ''}
    ${className}
  `, [hover, isClickable, className]);

  return (
    <Component
      onClick={onClick}
      className={cardClassName}
    >
      {children}
    </Component>
  );
});

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = memo(function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 dark:border-[#404040] bg-gray-50 dark:bg-[#252525] rounded-t-xl ${className}`}>
      {children}
    </div>
  );
});

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody = memo(function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-6 py-5 ${className}`}>
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
    <div className={`px-6 py-5 ${className}`}>
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
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
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
    <div className={`px-6 py-4 border-t border-gray-100 dark:border-[#404040] bg-gray-50 dark:bg-[#252525] rounded-b-xl ${className}`}>
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
  onClick
}: StatCardProps) {
  const styles = useMemo(() => COLOR_CLASSES[color], [color]);

  const containerClassName = useMemo(() => `
    group relative overflow-hidden rounded-xl transition-all duration-200
    bg-surface border border-border shadow-sm
    hover:shadow-md hover:border-primary/20
    ${onClick ? 'cursor-pointer' : ''}
  `, [onClick]);

  return (
    <div
      onClick={onClick}
      className={containerClassName}
    >
      <div className="p-5 flex items-start justify-between relative">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground font-heading tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${styles.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

export default Card;

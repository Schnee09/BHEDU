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
    bg-white dark:bg-[#2D2D2D] 
    border border-gray-200 dark:border-[#4A4A4A]
    text-gray-900 dark:text-[#E8E8E8]
    shadow-sm dark:shadow-none
    ${hover || isClickable ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-[#5A5A5A]' : ''}
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
    icon: 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300',
  },
  green: {
    icon: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  orange: {
    icon: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  },
  purple: {
    icon: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
  slate: {
    icon: 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400',
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
    bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm
    hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600
    ${onClick ? 'cursor-pointer' : ''}
  `, [onClick]);

  return (
    <div 
      onClick={onClick}
      className={containerClassName}
    >
      <div className="p-5 flex items-start justify-between relative">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 font-heading tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>
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

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
  padding?: string;
  variant?: string;
}

export const Card = memo(function Card({
  children,
  className = '',
  hover = false,
  onClick,
  as: Component = 'div',
  padding,
  variant
}: CardProps) {
  const isClickable = !!onClick;

  return (
    <Component
      onClick={onClick}
      className={cn(
        "rounded-3xl transition-all duration-500 glass-premium text-foreground",
        hover || isClickable ? "hover:shadow-ultra hover:-translate-y-1 hover:border-primary/20" : "shadow-sm",
        isClickable ? "cursor-pointer active:scale-[0.98]" : "",
        padding || "p-4 sm:p-6",
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
    <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100/10 dark:border-white/5 ${className}`}>
      {title && (
        <CardTitle>{title}</CardTitle>
      )}
      {subtitle && (
        <CardDescription>{subtitle}</CardDescription>
      )}
      {children}
    </div>
  );
});
CardHeader.displayName = 'CardHeader';

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

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
CardBody.displayName = 'CardBody';

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

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
CardContent.displayName = 'CardContent';

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

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
CardDescription.displayName = 'CardDescription';

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = memo(function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={cn(
      "text-xl font-serif font-black leading-none tracking-tight text-stone-900 dark:text-white transition-colors duration-300",
      className
    )}>
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
    <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100/10 dark:border-white/5 ${className}`}>
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
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'slate' | 'amber';
  onClick?: () => void;
  className?: string;
}

const COLOR_CLASSES = {
  blue: {
    icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500/5 to-transparent'
  },
  green: {
    icon: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    gradient: 'from-green-500/5 to-transparent'
  },
  orange: {
    icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500/5 to-transparent'
  },
  purple: {
    icon: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500/5 to-transparent'
  },
  slate: {
    icon: 'bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400',
    gradient: 'from-stone-500/5 to-transparent'
  },
  amber: {
    icon: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/5 to-transparent'
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
  const styles = useMemo(() => COLOR_CLASSES[color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue, [color]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-3xl transition-all duration-500",
        "glass-premium",
        "border border-stone-200/60 dark:border-white/5",
        "hover:border-primary/40 hover:-translate-y-1.5 hover:shadow-ultra",
        onClick ? 'cursor-pointer active:scale-[0.97]' : '',
        className
      )}
    >
      {/* Dynamic Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-30 group-hover:opacity-60",
        styles.gradient
      )} aria-hidden="true" />

      <div className="p-5 flex items-start justify-between relative z-10">
        <div className="flex-1 space-y-1.5 font-sans">
          <p className="text-[10px] font-black text-stone-900/60 dark:text-stone-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-serif font-black text-stone-900 dark:text-white tabular-nums tracking-tighter transition-transform duration-500 group-hover:translate-x-0.5">{value}</p>
          </div>
          {subtitle && (
            <p className="text-[10px] font-bold text-stone-500/60 dark:text-stone-400/60 uppercase tracking-tight">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 pt-0.5">
              <span className={cn(
                "text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter",
                trend.isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:rotate-2",
            styles.icon
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

export default Card;

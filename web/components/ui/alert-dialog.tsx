import * as React from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/lib/a11y';

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Trap focus inside alert dialog when open
  useFocusTrap(containerRef as React.RefObject<HTMLElement>);

  // Close alert dialog on Escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Prevent background scroll when active
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6"
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-all duration-300"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        className="relative z-[1100] grid w-full max-w-lg gap-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1C1917] p-8 sm:p-10 shadow-2xl shadow-black/15 dark:shadow-black/40 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-[28px] sm:rounded-[32px] animate-in fade-in-0 zoom-in-95 sm:max-h-[90vh] max-h-[100dvh] overflow-y-auto"
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

const AlertDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => {
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  );
});
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

const AlertDialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={`grid gap-4 ${className || ''}`} {...props}>
        {children}
      </div>
    );
  }
);
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col space-y-1.5 text-center sm:text-left ${className || ''}`}
        {...props}
      />
    );
  }
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h2
      ref={ref}
      className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-stone-500 dark:text-stone-400 ${className || ''}`}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = 'AlertDialogDescription';

const AlertDialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ''}`}
        {...props}
      />
    );
  }
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const hasBg = className && (className.includes('bg-') || className.includes('from-'));
  const baseClass =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl md:rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.96] dark:focus:ring-offset-gray-900 h-11 px-5 py-2.5 text-sm md:text-base';
  const defaultActionClass =
    'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 border border-amber-600/20 shadow-sm hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-[1px]';

  return (
    <button
      ref={ref}
      className={`${baseClass} ${!hasBg ? defaultActionClass : ''} ${className || ''}`}
      {...props}
    />
  );
});
AlertDialogAction.displayName = 'AlertDialogAction';

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const hasBg = className && (className.includes('bg-') || className.includes('from-'));
  const baseClass =
    'mt-2 sm:mt-0 inline-flex items-center justify-center gap-2 font-semibold rounded-xl md:rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.96] dark:focus:ring-offset-gray-900 h-11 px-5 py-2.5 text-sm md:text-base';
  const defaultCancelClass =
    'bg-stone-100 dark:bg-stone-850 text-stone-900 dark:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-stone-750/80 border border-stone-200 dark:border-stone-700 shadow-sm';

  return (
    <button
      ref={ref}
      className={`${baseClass} ${!hasBg ? defaultCancelClass : ''} ${className || ''}`}
      {...props}
    />
  );
});
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};

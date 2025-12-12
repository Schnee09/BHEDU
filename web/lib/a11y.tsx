/**
 * Accessibility Utilities
 * 
 * Provides helpers for implementing WCAG 2.1 AA compliance
 * including ARIA labels, keyboard navigation, and focus management.
 */

/**
 * Skip Navigation Link Component
 * Allows keyboard users to skip repetitive content (nav, sidebar, etc.)
 * 
 * @example
 * ```tsx
 * <SkipToMainContent />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipToMainContent() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    mainContent?.focus();
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

/**
 * Keyboard navigation handler
 * Useful for menus, tabs, and other interactive components
 * 
 * @example
 * ```tsx
 * const handleKeyDown = useKeyboardNavigation({
 *   onEnter: () => selectItem(),
 *   onArrowDown: () => moveToNext(),
 *   onArrowUp: () => moveToPrev(),
 *   onEscape: () => closeMenu(),
 * });
 * 
 * <div onKeyDown={handleKeyDown} role="listbox">
 *   ...
 * </div>
 * ```
 */
interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onSpace?: () => void;
  preventDefault?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  return (event: React.KeyboardEvent) => {
    const handlers: Record<string, (() => void) | undefined> = {
      'Enter': options.onEnter,
      'Escape': options.onEscape,
      'ArrowUp': options.onArrowUp,
      'ArrowDown': options.onArrowDown,
      'ArrowLeft': options.onArrowLeft,
      'ArrowRight': options.onArrowRight,
      'Tab': options.onTab,
      ' ': options.onSpace,
    };

    const handler = handlers[event.key];
    if (handler) {
      if (options.preventDefault !== false) {
        event.preventDefault();
      }
      handler();
    }
  };
}

/**
 * Focus trap utility
 * Keeps focus within a container (useful for modals, dialogs)
 * 
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useFocusTrap(ref);
 * 
 * <div ref={ref} role="dialog">
 *   <button>First</button>
 *   <button>Last</button>
 * </div>
 * ```
 */
import { useEffect, useRef } from 'react';

export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  const previousFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store the previously focused element
    previousFocusedElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const element = ref.current;
      if (!element) return;

      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      previousFocusedElement.current?.focus();
    };
  }, [ref]);
}

/**
 * Announce messages to screen readers
 * Useful for dynamic updates, form submissions, etc.
 * 
 * @example
 * ```tsx
 * const announce = useAnnounce();
 * 
 * const handleSave = async () => {
 *   await save();
 *   announce('Changes saved successfully', 'polite');
 * };
 * ```
 */
export function useAnnounce() {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create announcement container if it doesn't exist
    if (!announcementRef.current) {
      const container = document.createElement('div');
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      container.className = 'sr-only';
      container.id = 'a11y-announcements';
      document.body.appendChild(container);
      announcementRef.current = container;
    }
  }, []);

  return (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) return;

    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  };
}

/**
 * ARIA label builder
 * Helps create consistent, descriptive ARIA labels
 * 
 * @example
 * ```tsx
 * const label = buildAriaLabel('Edit', 'John Doe', 'student');
 * // "Edit student John Doe"
 * 
 * <button aria-label={label}>✎</button>
 * ```
 */
export function buildAriaLabel(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Role and ARIA attribute constants for common patterns
 */
export const A11Y = {
  ROLES: {
    DIALOG: 'dialog',
    ALERT_DIALOG: 'alertdialog',
    MENU: 'menu',
    MENUITEM: 'menuitem',
    LISTBOX: 'listbox',
    OPTION: 'option',
    TAB: 'tab',
    TABLIST: 'tablist',
    TABPANEL: 'tabpanel',
    BUTTON: 'button',
    LINK: 'link',
    NAVIGATION: 'navigation',
    MAIN: 'main',
    CONTENTINFO: 'contentinfo',
  },
  ARIA: {
    LABEL: 'aria-label',
    LABELLEDBY: 'aria-labelledby',
    DESCRIBEDBY: 'aria-describedby',
    HIDDEN: 'aria-hidden',
    EXPANDED: 'aria-expanded',
    SELECTED: 'aria-selected',
    PRESSED: 'aria-pressed',
    DISABLED: 'aria-disabled',
    LIVE: 'aria-live',
    ATOMIC: 'aria-atomic',
    CURRENT: 'aria-current',
    CONTROLS: 'aria-controls',
    OWNS: 'aria-owns',
    HASPOPUP: 'aria-haspopup',
    MODAL: 'aria-modal',
    REQUIRED: 'aria-required',
    INVALID: 'aria-invalid',
    ERRORMESSAGE: 'aria-errormessage',
  },
} as const;

/**
 * Get accessible button attributes
 * 
 * @example
 * ```tsx
 * <button {...getAccessibleButtonAttrs('Save changes')}>
 *   Save
 * </button>
 * ```
 */
export function getAccessibleButtonAttrs(label: string, disabled = false) {
  return {
    'aria-label': label,
    disabled,
    'aria-disabled': disabled,
  };
}

/**
 * Get accessible form field attributes
 * 
 * @example
 * ```tsx
 * <input
 *   {...getAccessibleFormAttrs('Email', 'email-error', true)}
 *   aria-invalid={hasError}
 * />
 * ```
 */
export function getAccessibleFormAttrs(
  label: string,
  errorId?: string,
  required = false
) {
  return {
    'aria-label': label,
    'aria-required': required,
    'aria-describedby': errorId,
    'aria-invalid': !!errorId,
  };
}

/**
 * Screen reader only text
 * Text that's hidden visually but visible to screen readers
 * 
 * @example
 * ```tsx
 * <button>
 *   ✎
 *   <SROnly>Edit student record</SROnly>
 * </button>
 * ```
 */
export function SROnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Accessible tooltip
 * Better than title attribute for accessibility
 * 
 * @example
 * ```tsx
 * <AccessibleTooltip content="Save changes" side="bottom">
 *   <button>Save</button>
 * </AccessibleTooltip>
 * ```
 */
interface AccessibleTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function AccessibleTooltip({
  children,
  content,
  side = 'top',
}: AccessibleTooltipProps) {
  const id = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative inline-block group">
      {/* Visually clone children and add aria-describedby */}
      <div aria-describedby={id}>
        {children}
      </div>

      {/* Tooltip */}
      <div
        id={id}
        role="tooltip"
        className={`
          absolute hidden group-hover:block group-focus-within:block
          bg-stone-900 text-white text-sm rounded px-2 py-1 whitespace-nowrap
          ${side === 'top' ? '-top-10 left-1/2 -translate-x-1/2' : ''}
          ${side === 'bottom' ? 'top-10 left-1/2 -translate-x-1/2' : ''}
          ${side === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : ''}
          ${side === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
          z-50 pointer-events-none
        `}
      >
        {content}
      </div>
    </div>
  );
}

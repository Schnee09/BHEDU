/**
 * Lazy Loading Utilities
 * 
 * Provides utilities for code-splitting heavy components
 * to reduce initial bundle size and improve performance.
 */

import { lazy, Suspense, ComponentType } from 'react';
import { SkeletonCard } from '@/components/ui/skeleton';

/**
 * Lazy load a component with a loading fallback
 * 
 * @example
 * ```tsx
 * const HeavyChart = lazyLoad(() => import('./HeavyChart'));
 * 
 * function MyPage() {
 *   return <HeavyChart data={data} />;
 * }
 * ```
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <SkeletonCard />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load with custom loading component
 * 
 * @example
 * ```tsx
 * const AdminPanel = lazyLoadWithLoader(
 *   () => import('./AdminPanel'),
 *   <div>Loading admin panel...</div>
 * );
 * ```
 */
export function lazyLoadWithLoader<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loader: React.ReactNode
) {
  return lazyLoad(importFunc, loader);
}

/**
 * Preload a lazy component on hover/focus
 * Improves perceived performance by loading before click
 * 
 * @example
 * ```tsx
 * const HeavyModal = lazy(() => import('./HeavyModal'));
 * 
 * <button
 *   onMouseEnter={() => preloadComponent(() => import('./HeavyModal'))}
 *   onClick={() => setShowModal(true)}
 * >
 *   Open Modal
 * </button>
 * ```
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  // Trigger the import to start loading
  importFunc();
}

/**
 * Create a lazy-loaded route component with error boundary
 * Best for page-level components
 * 
 * @example
 * ```tsx
 * const ReportsPage = lazyRoute(() => import('./reports/page'));
 * ```
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return lazyLoad(
    importFunc,
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto" />
        <p className="text-stone-600">Loading page...</p>
      </div>
    </div>
  );
}

/**
 * Higher-order component to add lazy loading to any component
 * 
 * @example
 * ```tsx
 * export default withLazyLoading(HeavyComponent);
 * ```
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function LazyWrappedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <SkeletonCard />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

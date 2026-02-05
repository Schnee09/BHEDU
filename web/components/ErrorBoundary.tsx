'use client'
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Card } from '@/components/ui/Card'
import { Icons } from '@/components/ui/Icons'
import { Button } from '@/components/ui'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  pageName?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console and logging service
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      pageName: this.props.pageName,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI with improved design
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
          <Card className="max-w-2xl w-full rounded-[40px] border-none shadow-2xl overflow-hidden bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl">
            <div className="p-12 text-center space-y-8 relative">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full" />

              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                  <div className="relative w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-[28px] flex items-center justify-center border border-red-100 dark:border-red-900/30">
                    <Icons.Warning className="w-10 h-10 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-4">
                <h1 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  {this.props.pageName ? `Lỗi khi tải ${this.props.pageName}` : 'Đã có sự cố xảy ra'}
                </h1>
                <p className="text-stone-600 dark:text-stone-400 font-medium leading-relaxed max-w-md mx-auto">
                  Hệ thống gặp lỗi không mong muốn. Đừng lo lắng, dữ liệu của bạn vẫn an toàn. Hãy thử tải lại trang hoặc quay lại sau.
                </p>
              </div>

              {/* Error Details (development mode) */}
              {this.props.showDetails && this.state.error && (
                <div className="mt-6 p-6 bg-stone-100 dark:bg-stone-800/50 rounded-3xl text-left border border-stone-200 dark:border-white/5">
                  <p className="text-xs font-mono text-red-500 dark:text-red-400 mb-3 uppercase tracking-widest font-bold">
                    Chi tiết lỗi:
                  </p>
                  <p className="text-sm font-mono text-stone-700 dark:text-stone-300 break-words mb-4">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2 group">
                      <summary className="cursor-pointer text-[10px] font-black text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                        <div className="w-1 h-3 bg-stone-300 dark:bg-stone-700 rounded-full" />
                        Component Stack
                      </summary>
                      <pre className="mt-4 p-4 text-[10px] text-stone-500 dark:text-stone-400 overflow-auto max-h-48 bg-black/5 dark:bg-black/20 rounded-xl leading-relaxed">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  onClick={this.handleReset}
                  className="px-8 py-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  Thử lại
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="px-8 py-6 rounded-2xl border-stone-200 dark:border-white/10 font-bold uppercase tracking-wider transition-all active:scale-95"
                >
                  Tải lại trang
                </Button>
              </div>

              {/* Support Link */}
              <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] pt-4 opacity-60">
                Nếu vấn đề tiếp tục, vui lòng liên hệ quản trị viên
              </p>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * PageErrorBoundary - Lightweight error boundary for page sections
 * Shows inline error message instead of full-page fallback
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Page section error: ${this.props.pageName || 'unknown'}`, error, {
      componentStack: errorInfo.componentStack,
    })
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-12 rounded-[40px] border-2 border-dashed border-red-200 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                <Icons.Warning className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Không thể tải {this.props.pageName || 'nội dung này'}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                {this.state.error?.message || 'Đã xảy ra lỗi không xác định'}
              </p>
            </div>
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="px-6 py-4 rounded-xl border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-bold uppercase tracking-widest text-[10px]"
            >
              Thử lại
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 * 
 * @example
 * ```tsx
 * export default withErrorBoundary(MyComponent, { 
 *   showDetails: process.env.NODE_ENV === 'development',
 *   pageName: 'My Page'
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

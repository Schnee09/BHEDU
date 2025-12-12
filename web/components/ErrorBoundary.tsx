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
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <Card className="max-w-2xl w-full">
            <div className="p-8 text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Icons.Warning className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-stone-900">
                  Oops! Something went wrong
                </h1>
                <p className="text-stone-600">
                  {this.props.pageName 
                    ? `We encountered an error loading ${this.props.pageName}.`
                    : 'We encountered an unexpected error.'
                  } Don&apos;t worry, your data is safe.
                </p>
              </div>

              {/* Error Details (development mode) */}
              {this.props.showDetails && this.state.error && (
                <div className="mt-6 p-4 bg-stone-100 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-stone-600 hover:text-stone-900">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs text-stone-700 overflow-auto max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="min-w-[120px]"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="primary"
                  className="min-w-[120px]"
                >
                  Reload Page
                </Button>
              </div>

              {/* Support Link */}
              <p className="text-sm text-stone-500">
                If this problem persists, please{' '}
                <a
                  href="/dashboard"
                  className="text-blue-600 hover:underline"
                >
                  return to dashboard
                </a>
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
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Icons.Warning className="w-12 h-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-stone-900">
                Failed to load {this.props.pageName || 'this section'}
              </h3>
              <p className="text-sm text-stone-600 mt-1">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button onClick={this.handleReset} variant="outline" size="sm">
              Try Again
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

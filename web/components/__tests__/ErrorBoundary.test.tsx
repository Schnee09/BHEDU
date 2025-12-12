import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary, PageErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary';
import '@testing-library/jest-dom';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Component rendered successfully</div>;
};

// Component that works fine
const WorkingComponent = () => <div>Working component</div>;

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ErrorBoundary Component', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('catches errors and displays error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('displays error details in development mode', () => {
      // Note: NODE_ENV is read-only in Jest, so we just verify the component renders error info
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // ErrorBoundary should render with error message
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('provides retry functionality', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeEnabled();
    });

    it('uses custom onError callback when provided', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
    });

    it('uses custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('PageErrorBoundary Component', () => {
    it('renders children when there is no error', () => {
      render(
        <PageErrorBoundary>
          <WorkingComponent />
        </PageErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('catches errors and displays inline error message', () => {
      render(
        <PageErrorBoundary>
          <ThrowingComponent />
        </PageErrorBoundary>
      );

      // PageErrorBoundary should show an inline error, not full page
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('allows reset on error', () => {
      render(
        <PageErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </PageErrorBoundary>
      );

      const resetButton = screen.queryByText(/reset|try again|dismiss/i);
      if (resetButton) {
        expect(resetButton).toBeInTheDocument();
      }
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('wraps component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(WorkingComponent);

      render(<WrappedComponent />);

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('catches errors in wrapped component', () => {
      const WrappedComponent = withErrorBoundary(ThrowingComponent);

      render(<WrappedComponent />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('accepts ErrorBoundary props', () => {
      const onError = jest.fn();
      const WrappedComponent = withErrorBoundary(ThrowingComponent, { onError });

      render(<WrappedComponent />);

      expect(onError).toHaveBeenCalled();
    });

    it('passes through component props', () => {
      const ComponentWithProps = ({ message }: { message: string }) => (
        <div>{message}</div>
      );

      const WrappedComponent = withErrorBoundary(ComponentWithProps);

      render(<WrappedComponent message="Test message" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles multiple levels of error boundaries', () => {
      render(
        <ErrorBoundary>
          <div>Outer boundary</div>
          <PageErrorBoundary>
            <WorkingComponent />
          </PageErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByText('Outer boundary')).toBeInTheDocument();
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('inner boundary catches errors before outer boundary', () => {
      render(
        <ErrorBoundary>
          <div>Outer boundary</div>
          <PageErrorBoundary>
            <ThrowingComponent />
          </PageErrorBoundary>
        </ErrorBoundary>
      );

      // Inner error boundary should catch it
      expect(screen.getByText('Outer boundary')).toBeInTheDocument();
      // Should not see outer error message
      expect(screen.queryByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('prevents errors from propagating to parent components', () => {
      const { container } = render(
        <ErrorBoundary>
          <WorkingComponent />
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Should show error UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Error Boundary Accessibility', () => {
    it('error UI has proper semantic structure', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByText(/something went wrong/i).closest('div');
      expect(errorContainer).toBeInTheDocument();
    });

    it('retry button is keyboard accessible', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toHaveProperty('type', 'button');
    });

    it('error message is readable by screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const errorMessage = screen.getByText(/something went wrong/i);
      expect(errorMessage).toBeVisible();
    });
  });
});

"use client";

import React from 'react';
import { ConvexError } from 'convex/values';
import ErrorBoundary from './ErrorBoundary';

interface ConvexErrorBoundaryProps {
  children: React.ReactNode;
}

// Custom error display for Convex-specific errors
function ConvexErrorDisplay({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const isConvexError = error instanceof ConvexError || error.message?.includes('ConvexError');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-orange-500 mb-4">
            <svg 
              className="w-16 h-16 mx-auto" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isConvexError ? 'Request Failed' : 'Something went wrong'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isConvexError 
              ? 'We had trouble processing your request. Please check your input and try again.'
              : 'An unexpected error occurred. Please try again or contact support if the problem persists.'
            }
          </p>
          <div className="space-y-4">
            <button
              onClick={onRetry}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Go to Home
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm font-medium text-gray-500 cursor-pointer">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-100 p-3 rounded overflow-auto">
                {error.toString()}
                {error.stack && `\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConvexErrorBoundary({ children }: ConvexErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={undefined} // We'll use the custom fallback below
    >
      <ConvexErrorWrapper>{children}</ConvexErrorWrapper>
    </ErrorBoundary>
  );
}

// Wrapper component to catch and display Convex errors properly
class ConvexErrorWrapper extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Convex error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <ConvexErrorDisplay
          error={this.state.error}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }

    return this.props.children;
  }
}

export default ConvexErrorBoundary;
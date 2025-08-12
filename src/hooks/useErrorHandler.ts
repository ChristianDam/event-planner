"use client";

import { useCallback } from 'react';
import { ConvexError } from 'convex/values';

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, context?: string) => {
    // Log error for development/debugging
    console.error(`Error ${context ? `in ${context}` : ''}:`, error);

    // Determine error type and create user-friendly message
    let userMessage = 'An unexpected error occurred. Please try again.';

    if (error instanceof ConvexError) {
      userMessage = error.message || 'A validation error occurred. Please check your input.';
    } else if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Not authenticated')) {
        userMessage = 'Please sign in to continue.';
      } else if (error.message.includes('permission') || error.message.includes('Insufficient')) {
        userMessage = 'You don\'t have permission to perform this action.';
      } else if (error.message.includes('not found') || error.message.includes('Not found')) {
        userMessage = 'The requested resource was not found.';
      } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        userMessage = 'This item already exists. Please try a different name.';
      } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        userMessage = error.message; // Show validation messages directly
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else {
        // For other known errors, show the original message if it's user-friendly
        const message = error.message.toLowerCase();
        const isUserFriendly = 
          message.includes('required') ||
          message.includes('must be') ||
          message.includes('cannot') ||
          message.includes('should') ||
          message.includes('please');
        
        if (isUserFriendly) {
          userMessage = error.message;
        }
      }
    }

    return {
      userMessage,
      originalError: error,
      shouldRetry: !error?.toString().includes('permission') && 
                   !error?.toString().includes('Not authenticated'),
    };
  }, []);

  // Helper to show error in UI (you can customize this based on your toast/notification system)
  const showError = useCallback((error: unknown, context?: string) => {
    const handled = handleError(error, context);
    
    // For now, we'll just show an alert, but in a real app you'd use a toast library
    if (typeof window !== 'undefined') {
      alert(handled.userMessage);
    }
    
    return handled;
  }, [handleError]);

  return { handleError, showError };
}

// Helper hook for handling async operations with error handling
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  const wrapAsync = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        const handled = handleError(error, context);
        
        // Re-throw if it's a critical error that should bubble up
        if (!handled.shouldRetry && error?.toString().includes('Not authenticated')) {
          throw error;
        }
        
        return null;
      }
    };
  }, [handleError]);

  return { wrapAsync };
}
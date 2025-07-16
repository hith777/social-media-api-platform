'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ErrorHandlerOptions {
  showToast?: boolean
  redirectTo?: string
  fallbackMessage?: string
}

/**
 * Custom hook for handling errors consistently across the application
 */
export function useErrorHandler() {
  const router = useRouter()

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = false,
        redirectTo,
        fallbackMessage = 'An error occurred',
      } = options

      let errorMessage = fallbackMessage

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      }

      console.error('Error handled:', error)

      // Log to error reporting service (e.g., Sentry)
      // if (window.Sentry) {
      //   window.Sentry.captureException(error)
      // }

      // Show toast notification if requested
      if (showToast) {
        // You can integrate with a toast library here
        // e.g., sonner, react-hot-toast, etc.
        console.warn('Toast notification:', errorMessage)
      }

      // Redirect if specified
      if (redirectTo) {
        router.push(redirectTo)
      }

      return errorMessage
    },
    [router]
  )

  return { handleError }
}


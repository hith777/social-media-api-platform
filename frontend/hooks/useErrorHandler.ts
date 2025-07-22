'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/utils/toast'
import { trackError } from '@/utils/analytics'

interface ErrorHandlerOptions {
  showToast?: boolean
  redirectTo?: string
  fallbackMessage?: string
  toastType?: 'success' | 'error' | 'info'
}

/**
 * Custom hook for handling errors consistently across the application
 */
export function useErrorHandler() {
  const router = useRouter()

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast: shouldShowToast = false,
        redirectTo,
        fallbackMessage = 'An error occurred',
        toastType = 'error',
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

      // Track error analytics
      if (error instanceof Error) {
        trackError(error, options)
      }

      // Log to error reporting service (e.g., Sentry)
      // if (window.Sentry) {
      //   window.Sentry.captureException(error)
      // }

      // Show toast notification if requested
      if (shouldShowToast) {
        if (toastType === 'success') {
          showToast.success('Success', errorMessage)
        } else if (toastType === 'error') {
          showToast.error('Error', errorMessage)
        } else {
          showToast.info('Info', errorMessage)
        }
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


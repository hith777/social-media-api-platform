/**
 * Utility functions for error handling
 */

import type { ApiError } from '@/api/errors'

/**
 * Check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  )
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (isApiError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return fallback
}

/**
 * Format validation errors from API response
 */
export function formatValidationErrors(
  errors: Record<string, string[]> | undefined
): string {
  if (!errors) return ''

  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n')
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('network')
    )
  }
  return false
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status === 401 || error.code === 'UNAUTHORIZED'
  }
  return false
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status === 404 || error.code === 'NOT_FOUND'
  }
  return false
}


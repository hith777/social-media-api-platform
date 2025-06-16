import { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status?: number
  code?: string
  errors?: Record<string, string[]>
}

export class ApiException extends Error {
  status?: number
  code?: string
  errors?: Record<string, string[]>

  constructor(message: string, status?: number, code?: string, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiException'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiException) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      errors: error.errors,
    }
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status
    const data = error.response?.data as any

    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timeout. Please try again.',
        status: 408,
        code: 'TIMEOUT',
      }
    }

    if (error.code === 'ERR_NETWORK') {
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
        code: 'NETWORK_ERROR',
      }
    }

    if (status === 401) {
      return {
        message: data?.message || 'Unauthorized. Please login again.',
        status: 401,
        code: 'UNAUTHORIZED',
      }
    }

    if (status === 403) {
      return {
        message: data?.message || 'Forbidden. You do not have permission.',
        status: 403,
        code: 'FORBIDDEN',
      }
    }

    if (status === 404) {
      return {
        message: data?.message || 'Resource not found.',
        status: 404,
        code: 'NOT_FOUND',
      }
    }

    if (status === 422) {
      return {
        message: data?.message || 'Validation error.',
        status: 422,
        code: 'VALIDATION_ERROR',
        errors: data?.errors,
      }
    }

    if (status === 500) {
      return {
        message: data?.message || 'Internal server error. Please try again later.',
        status: 500,
        code: 'SERVER_ERROR',
      }
    }

    return {
      message: data?.message || error.message || 'An error occurred.',
      status: status || 0,
      code: data?.code || 'UNKNOWN_ERROR',
      errors: data?.errors,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  return {
    message: 'An unexpected error occurred.',
  }
}


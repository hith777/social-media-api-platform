import { AxiosResponse } from 'axios'
import { apiClient } from './client'
import { ApiResponse, PaginatedResponse } from '@/types/api'
import { handleApiError, ApiError } from './errors'

/**
 * Extract data from API response
 */
export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data
}

/**
 * Extract paginated data from API response
 */
export function extractPaginatedData<T>(
  response: AxiosResponse<ApiResponse<PaginatedResponse<T>>>
): PaginatedResponse<T> {
  return response.data.data
}

/**
 * Type-safe GET request
 */
export async function get<T>(
  url: string,
  config?: { params?: Record<string, any> }
): Promise<T> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, config)
    return extractData(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Type-safe POST request
 */
export async function post<T>(
  url: string,
  data?: any,
  config?: { headers?: Record<string, string> }
): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config)
    return extractData(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Type-safe PUT request
 */
export async function put<T>(
  url: string,
  data?: any,
  config?: { headers?: Record<string, string> }
): Promise<T> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config)
    return extractData(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Type-safe PATCH request
 */
export async function patch<T>(
  url: string,
  data?: any,
  config?: { headers?: Record<string, string> }
): Promise<T> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config)
    return extractData(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Type-safe DELETE request
 */
export async function del<T>(url: string, config?: { params?: Record<string, any> }): Promise<T> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config)
    return extractData(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Type-safe GET request for paginated responses
 */
export async function getPaginated<T>(
  url: string,
  config?: { params?: Record<string, any> }
): Promise<PaginatedResponse<T>> {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<T>>>(url, config)
    return extractPaginatedData(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Upload file(s) with FormData
 */
export async function upload<T>(
  url: string,
  formData: FormData,
  config?: {
    onUploadProgress?: (progressEvent: any) => void
    headers?: Record<string, string>
  }
): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
    return extractData(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

export type { ApiError }


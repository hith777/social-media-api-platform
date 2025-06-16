import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { env } from '@/config/env'

/**
 * Create and configure Axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: env.apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  })

  return client
}

export const apiClient: AxiosInstance = createApiClient()

/**
 * Request interceptor - adds auth token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (will be replaced with Zustand store later)
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          const accessToken = authData?.state?.accessToken
          if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor - handles errors and token refresh
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try to refresh token (will be implemented in next commit)
      // For now, clear auth and reject
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage')
        // Redirect to login will be handled by auth logic
      }

      return Promise.reject(error)
    }

    // Handle other errors
    return Promise.reject(error)
  }
)

export default apiClient


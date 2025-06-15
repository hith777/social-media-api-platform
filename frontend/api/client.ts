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
 * Response interceptor - can be extended later for error handling
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    // Default error handling - can be extended later
    return Promise.reject(error)
  }
)

export default apiClient


import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
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
 * Request interceptor - can be extended later for auth tokens
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add any default request modifications here
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


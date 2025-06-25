import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { env } from '@/config/env'
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  setAccessToken,
  setRefreshToken,
} from '@/utils/tokenManager'

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
 * Create a separate axios instance for refresh token requests
 * to avoid infinite loops
 */
const refreshClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const response = await refreshClient.post('/users/refresh-token', {
      refreshToken,
    })
    
    if (response.data?.success && response.data?.data) {
      return {
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      }
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * Request interceptor - adds auth token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from token manager
    const accessToken = getAccessToken()
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
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

      if (typeof window !== 'undefined') {
        try {
          // Get refresh token from token manager
          const refreshTokenValue = getRefreshToken()

          if (!refreshTokenValue) {
            throw new Error('No refresh token found')
          }

          // Attempt to refresh the token
          const newTokens = await refreshAccessToken(refreshTokenValue)

          if (newTokens) {
            // Update tokens using token manager
            setAccessToken(newTokens.accessToken)
            setRefreshToken(newTokens.refreshToken)

            // Update the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
            }

            // Retry the original request
            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed - clear tokens
          clearTokens()
          // Redirect to login will be handled by auth logic
        }
      }

      return Promise.reject(error)
    }

    // Handle other errors
    return Promise.reject(error)
  }
)

export default apiClient


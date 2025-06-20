import { refreshToken } from './auth'
import { useAuthStore } from '@/stores/authStore'
import { RefreshTokenResponse } from '@/types/api'

/**
 * Refresh access token using stored refresh token
 * Updates the auth store with new tokens
 */
export async function refreshAccessToken(): Promise<RefreshTokenResponse | null> {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    // Get refresh token from storage
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) {
      return null
    }

    const authData = JSON.parse(authStorage)
    const refreshTokenValue = authData?.state?.refreshToken

    if (!refreshTokenValue) {
      return null
    }

    // Call refresh token API
    const newTokens = await refreshToken(refreshTokenValue)

    // Update auth store
    const { setTokens } = useAuthStore.getState()
    setTokens(newTokens.accessToken, newTokens.refreshToken)

    return newTokens
  } catch (error) {
    // Refresh failed - clear auth
    const { logout } = useAuthStore.getState()
    logout()
    return null
  }
}

/**
 * Check if token refresh is needed and perform it
 * Returns true if refresh was successful or not needed
 */
export async function ensureValidToken(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  const { accessToken, refreshToken: refreshTokenValue } = useAuthStore.getState()

  // If we have an access token, assume it's valid (interceptor will handle refresh on 401)
  if (accessToken) {
    return true
  }

  // If we have a refresh token but no access token, try to refresh
  if (refreshTokenValue) {
    const result = await refreshAccessToken()
    return result !== null
  }

  return false
}


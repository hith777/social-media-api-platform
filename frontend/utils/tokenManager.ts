/**
 * Token management utilities
 * Handles secure storage and retrieval of authentication tokens
 */

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRY_KEY = 'token_expiry'

/**
 * Decode JWT token to get payload (without verification)
 * Note: This is only for reading expiry, not for security validation
 */
function decodeToken(token: string): { exp?: number; iat?: number } | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true

  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true

  // Check if token expires in less than 1 minute (buffer time)
  const expiryTime = decoded.exp * 1000
  const now = Date.now()
  return now >= expiryTime - 60000 // 1 minute buffer
}

/**
 * Store access token
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    const decoded = decodeToken(token)
    if (decoded?.exp) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, decoded.exp.toString())
    }
  } catch (error) {
    console.error('Failed to store access token:', error)
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Store refresh token
 */
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to store refresh token:', error)
  }
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Check if access token is valid (not expired)
 */
export function isAccessTokenValid(): boolean {
  const token = getAccessToken()
  return !isTokenExpired(token)
}

/**
 * Clear all tokens
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  } catch (error) {
    console.error('Failed to clear tokens:', error)
  }
}

/**
 * Get token expiry time (in milliseconds)
 */
export function getTokenExpiry(): number | null {
  if (typeof window === 'undefined') return null

  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    return expiry ? parseInt(expiry, 10) * 1000 : null
  } catch {
    return null
  }
}

/**
 * Check if token needs refresh (expires within 5 minutes)
 */
export function shouldRefreshToken(): boolean {
  const token = getAccessToken()
  if (!token) return false

  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true

  const expiryTime = decoded.exp * 1000
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  return now >= expiryTime - fiveMinutes
}


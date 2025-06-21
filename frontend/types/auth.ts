import type { User, LoginResponse, RegisterResponse, RefreshTokenResponse } from './api'

/**
 * Authentication request types
 */
export interface LoginRequest {
  identifier: string // email or username
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RequestPasswordResetRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface VerifyEmailRequest {
  token: string
}

/**
 * Authentication response types (re-exported from api.ts)
 */
export type { LoginResponse, RegisterResponse, RefreshTokenResponse, User }

/**
 * Auth state interface (for Zustand store)
 */
export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Auth actions interface
 */
export interface AuthActions {
  setUser: (user: User | null) => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  clearError: () => void
}

export type AuthStore = AuthState & AuthActions


import { post, get } from './utils'
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  User,
} from '@/types/auth'

/**
 * Login user
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return post<LoginResponse>('/users/login', credentials)
}

/**
 * Register new user
 * Note: Backend returns just the user object, not tokens
 * User will need to login separately after registration
 */
export async function register(userData: RegisterRequest): Promise<User> {
  return post<User>('/users/register', userData)
}

/**
 * Refresh access token
 */
export async function refreshToken(token: string): Promise<RefreshTokenResponse> {
  return post<RefreshTokenResponse>('/users/refresh-token', { refreshToken: token })
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return get<User>('/users/me')
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  data: RequestPasswordResetRequest
): Promise<{ message: string }> {
  return post<{ message: string }>('/users/forgot-password', data)
}

/**
 * Reset password
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  return post<{ message: string }>('/users/reset-password', data)
}

/**
 * Verify email
 */
export async function verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
  return post<{ message: string }>('/users/verify-email', data)
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(): Promise<{ message: string }> {
  return post<{ message: string }>('/users/resend-verification', {})
}


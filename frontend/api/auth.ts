import { post, get } from './utils'
import { LoginResponse, RegisterResponse, RefreshTokenResponse, User } from '@/types/api'

/**
 * Login request payload
 */
export interface LoginRequest {
  identifier: string // email or username
  password: string
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

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


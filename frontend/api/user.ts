import { get, put, post, upload } from './utils'
import type { User, PaginatedResponse } from '@/types/api'

/**
 * Get current user profile
 */
export async function getProfile(): Promise<User> {
  return get<User>('/users/me')
}

/**
 * Update current user profile
 */
export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  bio?: string
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return put<User>('/users/me', data)
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<{ avatar: string }> {
  const formData = new FormData()
  formData.append('avatar', file)
  return upload<{ avatar: string }>('/users/me/avatar', formData)
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<User> {
  return get<User>(`/users/${userId}`)
}

/**
 * Search users
 */
export interface SearchUsersParams {
  query: string
  page?: number
  limit?: number
}

export async function searchUsers(
  params: SearchUsersParams
): Promise<PaginatedResponse<User>> {
  return get<PaginatedResponse<User>>('/users/search', { params })
}

/**
 * Get user's followers
 * Note: This endpoint is in the social routes
 */
export async function getFollowers(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<User>> {
  return get<PaginatedResponse<User>>(`/social/followers/${userId}`, {
    params: { page, limit },
  })
}

/**
 * Get user's following
 * Note: This endpoint is in the social routes
 */
export async function getFollowing(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<User>> {
  return get<PaginatedResponse<User>>(`/social/following/${userId}`, {
    params: { page, limit },
  })
}


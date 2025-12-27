import { get } from './utils'
import type { Post, User, PaginatedResponse } from '@/types/api'

/**
 * Search posts query parameters
 */
export interface SearchPostsParams {
  q: string
  page?: number
  limit?: number
  visibility?: 'public' | 'private' | 'friends'
  authorId?: string
  minLikes?: number
  minComments?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: 'newest' | 'oldest' | 'popular' | 'relevance'
}

/**
 * Search users query parameters
 */
export interface SearchUsersParams {
  q: string
  page?: number
  limit?: number
  verifiedOnly?: boolean
  hasBio?: boolean
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'username'
}

/**
 * Trending posts query parameters
 */
export interface TrendingPostsParams {
  page?: number
  limit?: number
  timeRange?: 'day' | 'week' | 'month' | 'all'
}

/**
 * Search posts with filters and sorting
 */
export async function searchPosts(
  params: SearchPostsParams
): Promise<PaginatedResponse<Post>> {
  return get<PaginatedResponse<Post>>('/search/posts', { params })
}

/**
 * Search users with filters and sorting
 */
export async function searchUsers(
  params: SearchUsersParams
): Promise<PaginatedResponse<User>> {
  return get<PaginatedResponse<User>>('/search/users', { params })
}

/**
 * Get trending posts
 */
export async function getTrendingPosts(
  params?: TrendingPostsParams
): Promise<PaginatedResponse<Post>> {
  return get<PaginatedResponse<Post>>('/search/trending', { params })
}


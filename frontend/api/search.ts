import { get, getPaginated } from './utils'
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
  const queryParams: Record<string, string> = {
    q: params.q,
  }

  if (params.page) queryParams.page = params.page.toString()
  if (params.limit) queryParams.limit = params.limit.toString()
  if (params.visibility) queryParams.visibility = params.visibility
  if (params.authorId) queryParams.authorId = params.authorId
  if (params.minLikes !== undefined) queryParams.minLikes = params.minLikes.toString()
  if (params.minComments !== undefined) queryParams.minComments = params.minComments.toString()
  if (params.dateFrom) queryParams.dateFrom = params.dateFrom
  if (params.dateTo) queryParams.dateTo = params.dateTo
  if (params.sortBy) queryParams.sortBy = params.sortBy

  return getPaginated<Post>('/search/posts', { params: queryParams })
}

/**
 * Search users with filters and sorting
 */
export async function searchUsers(
  params: SearchUsersParams
): Promise<PaginatedResponse<User>> {
  const queryParams: Record<string, string> = {
    q: params.q,
  }

  if (params.page) queryParams.page = params.page.toString()
  if (params.limit) queryParams.limit = params.limit.toString()
  if (params.verifiedOnly !== undefined) queryParams.verifiedOnly = params.verifiedOnly.toString()
  if (params.hasBio !== undefined) queryParams.hasBio = params.hasBio.toString()
  if (params.sortBy) queryParams.sortBy = params.sortBy

  return getPaginated<User>('/search/users', { params: queryParams })
}

/**
 * Get trending posts
 */
export async function getTrendingPosts(
  params?: TrendingPostsParams
): Promise<PaginatedResponse<Post>> {
  const queryParams: Record<string, string> = {}

  if (params?.page) queryParams.page = params.page.toString()
  if (params?.limit) queryParams.limit = params.limit.toString()
  if (params?.timeRange) queryParams.timeRange = params.timeRange

  return getPaginated<Post>('/search/trending', { params: queryParams })
}

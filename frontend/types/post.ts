import type { Post, User, PaginatedResponse } from './api'

/**
 * Post creation request
 */
export interface CreatePostRequest {
  content: string
  mediaUrls?: string[]
  visibility?: 'public' | 'private' | 'friends'
}

/**
 * Post update request
 */
export interface UpdatePostRequest {
  content?: string
  mediaUrls?: string[]
  visibility?: 'public' | 'private' | 'friends'
}

/**
 * Post query parameters for filtering and sorting
 */
export interface PostQueryParams {
  page?: number
  limit?: number
  sortBy?: 'newest' | 'oldest' | 'popular'
  search?: string
  visibility?: 'public' | 'private' | 'friends'
  authorId?: string
}

/**
 * Post report request
 */
export interface ReportPostRequest {
  reason: string
  description?: string
}

/**
 * Post response (re-exported from api.ts)
 */
export type { Post }

/**
 * Paginated post response
 */
export type PaginatedPostResponse = PaginatedResponse<Post>

/**
 * Post with extended metadata
 */
export interface PostWithMetadata extends Post {
  isOwnPost?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

/**
 * Post creation form data
 */
export interface PostFormData {
  content: string
  mediaFiles?: File[]
  visibility: 'public' | 'private' | 'friends'
}


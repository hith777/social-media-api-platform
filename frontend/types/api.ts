/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * User types
 */
export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  firstName?: string
  lastName?: string
  bio?: string
  avatar?: string
  isVerified: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Auth response types
 */
export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

/**
 * Post types
 */
export interface Post {
  id: string
  userId: string
  user: User
  content: string
  media?: string[]
  visibility: 'public' | 'private' | 'friends'
  likesCount: number
  commentsCount: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Comment types
 */
export interface Comment {
  id: string
  postId: string
  userId: string
  user: User
  content: string
  parentId?: string
  replies?: Comment[]
  repliesCount: number
  likesCount: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Social interaction types
 */

/**
 * Response when following/unfollowing a user
 */
export interface FollowResponse {
  isFollowing: boolean
  followersCount: number
  followingCount: number
}

/**
 * Response when liking/unliking a post
 */
export interface LikeResponse {
  isLiked: boolean
  likesCount: number
}

/**
 * Follow status information for a user
 */
export interface FollowStatus {
  isFollowing: boolean
  isFollowedBy: boolean
  followersCount: number
  followingCount: number
}

/**
 * Notification types
 */
export interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  userId?: string
  postId?: string
  commentId?: string
  createdAt: string
}

/**
 * Search types
 */
export interface SearchResult {
  users: User[]
  posts: Post[]
  total: number
}

/**
 * Trending post
 */
export interface TrendingPost extends Post {
  trendingScore: number
}

/**
 * Error response types
 */
export interface ValidationError {
  field: string
  message: string
}

export interface ErrorResponse {
  success: false
  message: string
  code?: string
  errors?: Record<string, string[]>
}


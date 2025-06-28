import { get, post, put, del } from './utils'
import type { Post, PaginatedResponse } from '@/types/api'

/**
 * Create post request
 */
export interface CreatePostRequest {
  content: string
  mediaUrls?: string[]
  visibility?: 'public' | 'private' | 'friends'
}

/**
 * Update post request
 */
export interface UpdatePostRequest {
  content?: string
  mediaUrls?: string[]
  visibility?: 'public' | 'private' | 'friends'
}

/**
 * Post query parameters
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
 * Create a new post
 */
export async function createPost(data: CreatePostRequest): Promise<Post> {
  return post<Post>('/posts', data)
}

/**
 * Get posts with filtering and sorting
 */
export async function getPosts(
  params?: PostQueryParams
): Promise<PaginatedResponse<Post>> {
  return get<PaginatedResponse<Post>>('/posts', { params })
}

/**
 * Get a single post by ID
 */
export async function getPost(postId: string): Promise<Post> {
  return get<Post>(`/posts/${postId}`)
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string,
  data: UpdatePostRequest
): Promise<Post> {
  return put<Post>(`/posts/${postId}`, data)
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/posts/${postId}`)
}

/**
 * Get user's posts
 */
export async function getUserPosts(
  userId: string,
  params?: PostQueryParams
): Promise<PaginatedResponse<Post>> {
  return get<PaginatedResponse<Post>>(`/posts/user/${userId}`, {
    params,
  })
}

/**
 * Get feed posts (posts from followed users)
 */
export async function getFeed(
  params?: PostQueryParams
): Promise<PaginatedResponse<Post>> {
  return get<PaginatedResponse<Post>>('/posts/feed', { params })
}

/**
 * Report a post
 */
export interface ReportPostRequest {
  reason: string
  description?: string
}

export async function reportPost(
  postId: string,
  data: ReportPostRequest
): Promise<{ message: string }> {
  return post<{ message: string }>(`/posts/${postId}/report`, data)
}


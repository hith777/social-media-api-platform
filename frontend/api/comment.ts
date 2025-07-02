import { get, post, put, del } from './utils'
import type { Comment, PaginatedResponse } from '@/types/api'

/**
 * Create comment request
 */
export interface CreateCommentRequest {
  content: string
  parentId?: string
}

/**
 * Update comment request
 */
export interface UpdateCommentRequest {
  content: string
}

/**
 * Comment query parameters
 */
export interface CommentQueryParams {
  page?: number
  limit?: number
}

/**
 * Create a comment on a post
 */
export async function createComment(
  postId: string,
  data: CreateCommentRequest
): Promise<Comment> {
  return post<Comment>(`/posts/${postId}/comments`, data)
}

/**
 * Get comments for a post
 */
export async function getPostComments(
  postId: string,
  params?: CommentQueryParams
): Promise<PaginatedResponse<Comment>> {
  return get<PaginatedResponse<Comment>>(`/posts/${postId}/comments`, { params })
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  data: UpdateCommentRequest
): Promise<Comment> {
  return put<Comment>(`/comments/${commentId}`, data)
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string
): Promise<{ message: string }> {
  return del<{ message: string }>(`/comments/${commentId}`)
}

/**
 * Toggle like on a comment
 */
export async function toggleCommentLike(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
  return post<{ isLiked: boolean; likesCount: number }>(`/comments/${commentId}/toggle-like`)
}

/**
 * Get comment replies
 */
export async function getCommentReplies(
  commentId: string,
  params?: CommentQueryParams
): Promise<PaginatedResponse<Comment>> {
  return get<PaginatedResponse<Comment>>(`/comments/${commentId}/replies`, { params })
}


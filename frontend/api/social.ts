import { post, del } from './utils'
import type { LikeResponse, FollowResponse } from '@/types/api'

/**
 * Toggle like on a post
 */
export async function togglePostLike(postId: string): Promise<LikeResponse> {
  return post<LikeResponse>(`/social/posts/${postId}/toggle-like`)
}

/**
 * Like a post
 */
export async function likePost(postId: string): Promise<LikeResponse> {
  return post<LikeResponse>(`/social/posts/${postId}/like`)
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string): Promise<LikeResponse> {
  return del<LikeResponse>(`/social/posts/${postId}/like`)
}

/**
 * Follow a user
 */
export async function followUser(userId: string): Promise<FollowResponse> {
  return post<FollowResponse>(`/social/follow/${userId}`)
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string): Promise<FollowResponse> {
  return del<FollowResponse>(`/social/follow/${userId}`)
}


import { post, del, get } from './utils'
import type { LikeResponse, FollowResponse, User, PaginatedResponse } from '@/types/api'

/**
 * Toggle like on a post
 * This is the preferred method as it handles both like and unlike
 */
export async function togglePostLike(postId: string): Promise<LikeResponse> {
  return post<LikeResponse>(`/social/posts/${postId}/toggle-like`)
}

/**
 * Like a post
 * Alternative to togglePostLike if you need explicit like action
 */
export async function likePost(postId: string): Promise<LikeResponse> {
  return post<LikeResponse>(`/social/posts/${postId}/like`)
}

/**
 * Unlike a post
 * Alternative to togglePostLike if you need explicit unlike action
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

/**
 * Get user's followers list
 */
export async function getFollowers(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<User>> {
  return get<PaginatedResponse<User>>(`/social/followers/${userId}`, {
    params: { page, limit },
  })
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<User>> {
  return get<PaginatedResponse<User>>(`/social/following/${userId}`, {
    params: { page, limit },
  })
}


import { get, post, put, del, upload } from './utils'
import { apiClient } from './client'
import { extractData, handleApiError } from './utils'
import type { Post, PaginatedResponse, ApiResponse } from '@/types/api'
import type {
  CreatePostRequest,
  UpdatePostRequest,
  PostQueryParams,
  ReportPostRequest,
} from '@/types/post'

// Re-export types for convenience
export type {
  CreatePostRequest,
  UpdatePostRequest,
  PostQueryParams,
  ReportPostRequest,
}

/**
 * Create a new post with media upload
 */
export async function createPost(
  data: CreatePostRequest,
  mediaFiles?: File[]
): Promise<Post> {
  if (mediaFiles && mediaFiles.length > 0) {
    const formData = new FormData()
    formData.append('content', data.content)
    if (data.visibility) {
      formData.append('visibility', data.visibility)
    }
    
    // Append media files
    mediaFiles.forEach((file) => {
      formData.append('media', file)
    })

    return upload<Post>('/posts', formData)
  }

  return post<Post>('/posts', data)
}

/**
 * Update a post with media upload
 */
export async function updatePostWithMedia(
  postId: string,
  data: UpdatePostRequest,
  mediaFiles?: File[]
): Promise<Post> {
  if (mediaFiles && mediaFiles.length > 0) {
    const formData = new FormData()
    if (data.content) {
      formData.append('content', data.content)
    }
    if (data.visibility) {
      formData.append('visibility', data.visibility)
    }
    
    // Append media files
    mediaFiles.forEach((file) => {
      formData.append('media', file)
    })

    try {
      const response = await apiClient.put<ApiResponse<Post>>(
        `/posts/${postId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return extractData(response)
    } catch (error) {
      throw handleApiError(error)
    }
  }

  return updatePost(postId, data)
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
export async function reportPost(
  postId: string,
  data: ReportPostRequest
): Promise<{ message: string }> {
  return post<{ message: string }>(`/posts/${postId}/report`, data)
}


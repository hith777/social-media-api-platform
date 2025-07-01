'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getFeed } from '@/api/post'
import type { Post, PaginatedResponse } from '@/types/api'
import { PostCard } from './PostCard'
import { Container } from '@/components/layout'
import { Button } from '@/components/ui/button'

export function FeedPage() {
  const { isAuthenticated } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginatedResponse<Post>['pagination'] | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const fetchFeed = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await getFeed({ page: 1, limit: 10 })
        setPosts(response.data)
        setPagination(response.pagination)
      } catch (err: any) {
        setError(err.message || 'Failed to load feed')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeed()
  }, [isAuthenticated])

  const handleLike = (postId: string) => {
    // TODO: Implement like functionality
    console.log('Like post:', postId)
  }

  const handleComment = (postId: string) => {
    // TODO: Implement comment navigation
    console.log('Comment on post:', postId)
  }

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId)
  }

  const handleMore = (postId: string) => {
    // TODO: Implement more options menu
    console.log('More options for post:', postId)
  }

  if (!isAuthenticated) {
    return (
      <Container>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please login to view your feed</p>
        </div>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <div className="space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feed</h1>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No posts in your feed yet</p>
            <p className="text-sm text-muted-foreground">
              Follow users to see their posts here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onMore={handleMore}
              />
            ))}
          </div>
        )}

        {pagination && pagination.hasNext && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => {
              // TODO: Implement load more
              console.log('Load more posts')
            }}>
              Load More
            </Button>
          </div>
        )}
      </div>
    </Container>
  )
}


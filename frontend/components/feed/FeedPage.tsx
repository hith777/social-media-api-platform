'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getFeed } from '@/api/post'
import type { Post, PaginatedResponse } from '@/types/api'
import type { PostQueryParams } from '@/types/post'
import { PostCard } from './PostCard'
import { PostFilters } from './PostFilters'
import { Container } from '@/components/layout'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { TrendingPosts } from '@/components/search/TrendingPosts.lazy'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, Users } from 'lucide-react'

export function FeedPage() {
  const { isAuthenticated } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginatedResponse<Post>['pagination'] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<PostQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'newest',
  })

  const fetchFeed = useCallback(async (page: number, filters: PostQueryParams, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    
    try {
      const response = await getFeed({ ...filters, page, limit: 10 })
      if (append) {
        setPosts((prev) => [...prev, ...response.data])
      } else {
        setPosts(response.data)
      }
      setPagination(response.pagination)
      setCurrentPage(page)
    } catch (err: any) {
      setError(err.message || 'Failed to load feed')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    fetchFeed(1, filters, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filters.sortBy, filters.visibility, filters.search])

  const handleFiltersChange = useCallback((newFilters: PostQueryParams) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  const loadMore = useCallback(() => {
    if (pagination?.hasNext && !isLoadingMore && !isLoading) {
      fetchFeed(currentPage + 1, filters, true)
    }
  }, [pagination, currentPage, isLoadingMore, isLoading, fetchFeed, filters])

  const { observerTarget } = useInfiniteScroll({
    hasNextPage: pagination?.hasNext ?? false,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  })

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 py-4 sm:py-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Feed</h1>
          </div>

          <PostFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showSort={true}
            showVisibility={false}
            showSearch={false}
          />

          {posts.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="No posts in your feed"
              description="Follow users to see their posts here. Start exploring and connect with others!"
              size="lg"
            />
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
            <div ref={observerTarget} className="flex justify-center py-4">
              {isLoadingMore && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 order-first lg:order-last">
          <TrendingPosts timeRange="week" limit={5} />
        </div>
      </div>
    </Container>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTrendingPosts } from '@/api/search'
import type { Post, PaginatedResponse } from '@/types/api'
import { PostCard } from '@/components/feed/PostCard'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface TrendingPostsProps {
  timeRange?: 'day' | 'week' | 'month' | 'all'
  limit?: number
  showHeader?: boolean
  className?: string
}

export function TrendingPosts({
  timeRange: initialTimeRange = 'week',
  limit = 10,
  showHeader = true,
  className,
}: TrendingPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse<Post>['pagination'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>(initialTimeRange)

  const fetchTrendingPosts = async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getTrendingPosts({
        page,
        limit,
        timeRange,
      })

      if (page === 1) {
        setPosts(result.data)
      } else {
        setPosts((prev) => [...prev, ...result.data])
      }
      setPagination(result.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending posts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingPosts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const handleLoadMore = () => {
    if (!isLoading && pagination && pagination.currentPage < pagination.totalPages) {
      fetchTrendingPosts(pagination.currentPage + 1)
    }
  }

  const hasNextPage = pagination ? pagination.currentPage < pagination.totalPages : false
  const { observerTarget } = useInfiniteScroll({
    hasNextPage,
    isLoading,
    onLoadMore: handleLoadMore,
  })

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Trending Posts</CardTitle>
            </div>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div key={post.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <PostCard post={post} />
                </div>
              </div>
            ))}
            {hasNextPage && (
              <div ref={observerTarget} className="py-4 text-center">
                {isLoading && (
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>No trending posts found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


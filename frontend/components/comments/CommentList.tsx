'use client'

import { useEffect, useState } from 'react'
import { getPostComments } from '@/api/comment'
import type { Comment, PaginatedResponse } from '@/types/api'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading'
import { CommentSkeleton } from '@/components/ui/skeleton'
import { MessageSquare } from 'lucide-react'

interface CommentListProps {
  postId: string
  onCommentUpdate?: () => void
}

export function CommentList({ postId, onCommentUpdate }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginatedResponse<Comment>['pagination'] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchComments = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    try {
      const response = await getPostComments(postId, { page, limit: 50 })
      if (append) {
        setComments((prev) => [...prev, ...response.data])
      } else {
        setComments(response.data)
      }
      setPagination(response.pagination)
      setCurrentPage(page)
    } catch (err: any) {
      setError(err.message || 'Failed to load comments')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination?.hasNext && !isLoadingMore) {
      fetchComments(currentPage + 1, true)
    }
  }

  useEffect(() => {
    if (postId) {
      fetchComments(1, false)
    }
  }, [postId])

  useEffect(() => {
    if (onCommentUpdate) {
      fetchComments(1, false)
    }
  }, [onCommentUpdate])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CommentForm postId={postId} onCommentAdded={fetchComments} />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  // Separate top-level comments and replies
  const topLevelComments = comments.filter((comment) => !comment.parentId)
  const repliesMap = new Map<string, Comment[]>()
  
  comments.forEach((comment) => {
    if (comment.parentId) {
      if (!repliesMap.has(comment.parentId)) {
        repliesMap.set(comment.parentId, [])
      }
      repliesMap.get(comment.parentId)!.push(comment)
    }
  })

  if (topLevelComments.length === 0) {
    return (
      <div className="space-y-4">
        <CommentForm postId={postId} onCommentAdded={fetchComments} />
        <EmptyState
          icon={<MessageSquare />}
          title="No comments yet"
          description="Be the first to share your thoughts on this post!"
          size="md"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CommentForm postId={postId} onCommentAdded={fetchComments} />
      {topLevelComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={repliesMap.get(comment.id) || []}
          postId={postId}
          onUpdate={fetchComments}
        />
      ))}

      {pagination && pagination.hasNext && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More Comments'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}


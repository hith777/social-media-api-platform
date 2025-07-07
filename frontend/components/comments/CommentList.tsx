'use client'

import { useEffect, useState } from 'react'
import { getPostComments } from '@/api/comment'
import type { Comment, PaginatedResponse } from '@/types/api'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { Button } from '@/components/ui/button'

interface CommentListProps {
  postId: string
  onCommentUpdate?: () => void
}

export function CommentList({ postId, onCommentUpdate }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginatedResponse<Comment>['pagination'] | null>(null)

  const fetchComments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getPostComments(postId, { page: 1, limit: 50 })
      setComments(response.data)
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (postId) {
      fetchComments()
    }
  }, [postId])

  useEffect(() => {
    if (onCommentUpdate) {
      fetchComments()
    }
  }, [onCommentUpdate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  return (
    <div className="space-y-4">
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
          <Button variant="outline" onClick={() => {
            // TODO: Implement load more comments
            console.log('Load more comments')
          }}>
            Load More Comments
          </Button>
        </div>
      )}
    </div>
  )
}


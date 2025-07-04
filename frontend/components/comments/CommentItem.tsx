'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import type { Comment } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Heart, Reply, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { toggleCommentLike, getCommentReplies } from '@/api/comment'

interface CommentItemProps {
  comment: Comment
  replies: Comment[]
  postId: string
  onUpdate?: () => void
}

export function CommentItem({ comment, replies: initialReplies, postId, onUpdate }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Comment[]>(initialReplies)
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [repliesCount, setRepliesCount] = useState(comment.repliesCount || 0)

  const handleLike = async () => {
    // Optimistic update
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount(newIsLiked ? likeCount + 1 : likeCount - 1)

    try {
      const response = await toggleCommentLike(comment.id)
      setIsLiked(response.isLiked)
      setLikeCount(response.likesCount)
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked)
      setLikeCount(newIsLiked ? likeCount - 1 : likeCount + 1)
    }
  }

  const handleLoadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies)
      return
    }

    setIsLoadingReplies(true)
    try {
      const response = await getCommentReplies(comment.id, { page: 1, limit: 50 })
      setReplies(response.data)
      setRepliesCount(response.data.length)
      setShowReplies(true)
    } catch (error) {
      console.error('Failed to load replies:', error)
    } finally {
      setIsLoadingReplies(false)
    }
  }

  // Update replies when initialReplies prop changes
  useEffect(() => {
    if (initialReplies.length > 0) {
      setReplies(initialReplies)
      setRepliesCount(initialReplies.length)
    }
  }, [initialReplies])

  return (
    <div className="flex gap-3 py-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user.avatar ? (
          <Image
            src={comment.user.avatar}
            alt={comment.user.username}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {comment.user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg p-3">
          {/* Author and timestamp */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.user.username}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Comment text */}
          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`h-8 px-2 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{likeCount}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Reply className="h-4 w-4 mr-1" />
            <span className="text-xs">Reply</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 px-2 ml-auto">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Replies */}
        {(repliesCount > 0 || replies.length > 0) && (
          <div className="mt-4 ml-4 border-l-2 border-muted pl-4 space-y-2">
            {showReplies ? (
              <>
                {isLoadingReplies ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        replies={[]}
                        postId={postId}
                        onUpdate={onUpdate}
                      />
                    ))}
                    {replies.length === 0 && repliesCount > 0 && (
                      <p className="text-xs text-muted-foreground py-2">
                        No replies to display
                      </p>
                    )}
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadReplies}
                  className="mt-2 text-xs"
                  disabled={isLoadingReplies}
                >
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide {repliesCount || replies.length} {repliesCount === 1 || replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadReplies}
                className="text-xs"
                disabled={isLoadingReplies}
              >
                <ChevronDown className="h-3 w-3 mr-1" />
                {isLoadingReplies ? (
                  'Loading...'
                ) : (
                  <>
                    View {repliesCount || replies.length} {(repliesCount || replies.length) === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


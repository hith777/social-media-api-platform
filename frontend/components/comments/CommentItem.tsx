'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import type { Comment } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Heart, Reply, MoreVertical } from 'lucide-react'
import { toggleCommentLike } from '@/api/comment'

interface CommentItemProps {
  comment: Comment
  replies: Comment[]
  postId: string
  onUpdate?: () => void
}

export function CommentItem({ comment, replies, postId, onUpdate }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0)
  const [showReplies, setShowReplies] = useState(false)

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
        {replies.length > 0 && (
          <div className="mt-4 ml-4 border-l-2 border-muted pl-4">
            {showReplies ? (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(false)}
                  className="mt-2 text-xs"
                >
                  Hide replies
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(true)}
                className="text-xs"
              >
                View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import type { Comment } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Heart, Reply, MoreVertical, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react'
import { toggleCommentLike, getCommentReplies, updateComment, deleteComment } from '@/api/comment'
import { useAuthStore } from '@/stores/authStore'

interface CommentItemProps {
  comment: Comment
  replies: Comment[]
  postId: string
  onUpdate?: () => void
}

export function CommentItem({ comment, replies: initialReplies, postId, onUpdate }: CommentItemProps) {
  const { user } = useAuthStore()
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Comment[]>(initialReplies)
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [repliesCount, setRepliesCount] = useState(comment.repliesCount || 0)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwnComment = user?.id === comment.userId

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

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await updateComment(comment.id, { content: editContent.trim() })
      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert('Failed to update comment. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteComment(comment.id)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment. Please try again.')
    } finally {
      setIsDeleting(false)
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

          {/* Comment text or edit form */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSaving}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
          )}
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

          {isOwnComment && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 ml-auto" disabled={isDeleting}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit} disabled={isEditing || isDeleting}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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


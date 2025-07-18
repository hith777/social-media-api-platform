'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { Post } from '@/types/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { togglePostLike } from '@/api/social'
import { PostActionsMenu } from './PostActionsMenu'

interface PostCardProps {
  post: Post
  onLike?: (postId: string, isLiked: boolean, likesCount: number) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  onReport?: (postId: string) => void
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onReport,
}: PostCardProps) {
  const [imageError, setImageError] = useState<Set<number>>(new Set())
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [isLiking, setIsLiking] = useState(false)

  const handleImageError = (index: number) => {
    setImageError((prev) => new Set(prev).add(index))
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const handleLike = async () => {
    if (isLiking) return

    // Optimistic update
    const newIsLiked = !isLiked
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1
    setIsLiked(newIsLiked)
    setLikesCount(newLikesCount)
    setIsLiking(true)

    try {
      const response = await togglePostLike(post.id)
      setIsLiked(response.isLiked)
      setLikesCount(response.likesCount)
      onLike?.(post.id, response.isLiked, response.likesCount)
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked)
      setLikesCount(likesCount)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link href={`/profile/${post.userId}`}>
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                {post.user.avatar ? (
                  <Image
                    src={post.user.avatar}
                    alt={post.user.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {post.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            <div>
              <Link
                href={`/profile/${post.userId}`}
                className="font-semibold hover:underline"
              >
                {post.user.displayName || post.user.username}
              </Link>
              <p className="text-sm text-muted-foreground">
                @{post.user.username} · {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <PostActionsMenu
            post={post}
            onEdit={onEdit}
            onDelete={onDelete}
            onReport={onReport}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        {post.content && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {post.media && post.media.length > 0 && (
          <div className="space-y-2">
            {post.media.map((mediaUrl, index) => {
              if (imageError.has(index)) {
                return (
                  <div
                    key={index}
                    className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center"
                  >
                    <p className="text-sm text-muted-foreground">
                      Failed to load image
                    </p>
                  </div>
                )
              }

              return (
                <div
                  key={index}
                  className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={mediaUrl}
                    alt={`Post media ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(index)}
                  />
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`gap-1 sm:gap-2 flex-1 sm:flex-initial ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart
              className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? 'fill-current' : ''}`}
            />
            <span className="text-xs sm:text-sm">{likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComment?.(post.id)}
            className="gap-1 sm:gap-2 flex-1 sm:flex-initial"
          >
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">{post.commentsCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare?.(post.id)}
            className="gap-1 sm:gap-2 flex-1 sm:flex-initial"
          >
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


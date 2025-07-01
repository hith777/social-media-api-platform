'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { Post } from '@/types/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onMore?: (postId: string) => void
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onMore,
}: PostCardProps) {
  const [imageError, setImageError] = useState<Set<number>>(new Set())

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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          {onMore && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMore(post.id)}
              className="h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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

        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(post.id)}
            className={`gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
          >
            <Heart
              className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`}
            />
            <span>{post.likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComment?.(post.id)}
            className="gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare?.(post.id)}
            className="gap-2"
          >
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


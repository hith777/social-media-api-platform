'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPost } from '@/api/post'
import type { Post } from '@/types/api'
import { PostCard } from './PostCard'
import { Container } from '@/components/layout'
import { Button } from '@/components/ui/button'

interface PostDetailPageProps {
  postId: string
}

export function PostDetailPage({ postId }: PostDetailPageProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const postData = await getPost(postId)
        setPost(postData)
      } catch (err: any) {
        setError(err.message || 'Failed to load post')
      } finally {
        setIsLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId])

  const handleLike = (postId: string) => {
    // TODO: Implement like functionality
    console.log('Like post:', postId)
  }

  const handleComment = (postId: string) => {
    // TODO: Scroll to comments section
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
        <div className="space-y-4 py-6">
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            {error}
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </Container>
    )
  }

  if (!post) {
    return (
      <Container>
        <div className="space-y-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Post not found</p>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <div className="space-y-6 py-6">
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>

        <PostCard
          post={post}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onMore={handleMore}
        />

        {/* Comments section will be added in a later commit */}
        <div className="text-center py-8 text-muted-foreground">
          Comments section will be displayed here
        </div>
      </div>
    </Container>
  )
}


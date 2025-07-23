'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPost } from '@/api/post'
import type { Post } from '@/types/api'
import { PostCard } from './PostCard'
import { Container } from '@/components/layout'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

// Lazy load comment list
const CommentList = dynamic(() => import('@/components/comments/CommentList').then(mod => ({ default: mod.CommentList })), {
  loading: () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded animate-pulse" />
      ))}
    </div>
  ),
  ssr: false,
})
import { CommentForm } from '@/components/comments/CommentForm'

interface PostDetailPageProps {
  postId: string
}

export function PostDetailPage({ postId }: PostDetailPageProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentKey, setCommentKey] = useState(0)

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

  const handleLike = (postId: string, isLiked: boolean, likesCount: number) => {
    // Update local post state
    if (post && post.id === postId) {
      setPost({ ...post, isLiked, likesCount })
    }
  }

  const handleComment = (postId: string) => {
    // Scroll to comments section
    const commentsSection = document.getElementById('comments-section')
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      commentsSection.focus()
    }
  }

  const handleShare = (postId: string) => {
    // Copy post URL to clipboard
    const postUrl = `${window.location.origin}/posts/${postId}`
    navigator.clipboard.writeText(postUrl).then(() => {
      // Toast notification would be shown by PostCard if implemented
    })
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
        />

        {/* Comments Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <CommentForm
              postId={postId}
              onSuccess={() => {
                setCommentKey((prev) => prev + 1)
              }}
            />
          </div>

          <div key={commentKey}>
            <CommentList postId={postId} />
          </div>
        </div>
      </div>
    </Container>
  )
}


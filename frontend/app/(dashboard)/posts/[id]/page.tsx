import { Metadata } from 'next'
import dynamic from 'next/dynamic'

// Lazy load post detail page
const PostDetailPage = dynamic(() => import('@/components/feed/PostDetailPage').then(mod => ({ default: mod.PostDetailPage })), {
  loading: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </div>
  ),
  ssr: true,
})

export const metadata: Metadata = {
  title: 'Post | Social Media Platform',
  description: 'View post details',
}

export default function PostDetail({
  params,
}: {
  params: { id: string }
}) {
  return <PostDetailPage postId={params.id} />
}


import { Metadata } from 'next'
import { PostDetailPage } from '@/components/feed/PostDetailPage.lazy'

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


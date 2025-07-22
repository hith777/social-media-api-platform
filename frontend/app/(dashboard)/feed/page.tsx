import { Metadata } from 'next'
import { FeedPage } from '@/components/feed/FeedPage'
import { generateMetadata } from '@/utils/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Feed',
  description: 'Your personalized feed with posts from people you follow. Discover trending content and stay connected with your community.',
  url: '/feed',
  type: 'website',
})

export default function Feed() {
  return <FeedPage />
}


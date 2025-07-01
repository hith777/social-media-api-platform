import { Metadata } from 'next'
import { FeedPage } from '@/components/feed/FeedPage'

export const metadata: Metadata = {
  title: 'Feed | Social Media Platform',
  description: 'Your personalized feed',
}

export default function Feed() {
  return <FeedPage />
}


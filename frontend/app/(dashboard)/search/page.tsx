import { Metadata } from 'next'
import { SearchResultsPage } from '@/components/search/SearchResultsPage'
import { generateMetadata } from '@/utils/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Search',
  description: 'Search for users, posts, and trending content. Discover new people and explore what\'s happening on the platform.',
  url: '/search',
  type: 'website',
})

export default function Page() {
  return <SearchResultsPage />
}


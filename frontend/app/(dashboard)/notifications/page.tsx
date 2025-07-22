import { Metadata } from 'next'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'
import { generateMetadata } from '@/utils/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Notifications',
  description: 'View all your notifications. Stay updated with likes, comments, follows, and other activities.',
  url: '/notifications',
  type: 'website',
})

export default function Page() {
  return <NotificationsPage />
}


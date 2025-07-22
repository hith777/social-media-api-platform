import { Metadata } from 'next'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { generateMetadata } from '@/utils/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Profile',
  description: 'View and edit your profile. Manage your personal information, bio, and profile settings.',
  url: '/profile',
  type: 'profile',
})

export default function Profile() {
  return <ProfilePage />
}


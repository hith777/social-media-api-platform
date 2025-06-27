import { Metadata } from 'next'
import { ProfilePage } from '@/components/profile/ProfilePage'

export const metadata: Metadata = {
  title: 'Profile | Social Media Platform',
  description: 'View and edit your profile',
}

export default function Profile() {
  return <ProfilePage />
}


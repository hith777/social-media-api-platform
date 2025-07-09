import { FollowersListPage } from '@/components/social/FollowersListPage'

interface FollowersPageProps {
  params: {
    id: string
  }
}

export default function FollowersPage({ params }: FollowersPageProps) {
  return <FollowersListPage userId={params.id} />
}


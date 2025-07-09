import { FollowingListPage } from '@/components/social/FollowingListPage'

interface FollowingPageProps {
  params: {
    id: string
  }
}

export default function FollowingPage({ params }: FollowingPageProps) {
  return <FollowingListPage userId={params.id} />
}


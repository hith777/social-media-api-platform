'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFollowers } from '@/api/social'
import type { User, PaginatedResponse } from '@/types/api'
import { Container } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users } from 'lucide-react'
import { UserCard } from './UserCard'
import { PaginationControls } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingPage } from '@/components/ui/loading'
import { UserCardSkeleton } from '@/components/ui/skeleton'

interface FollowersListPageProps {
  userId: string
}

export function FollowersListPage({ userId }: FollowersListPageProps) {
  const router = useRouter()
  const [followers, setFollowers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginatedResponse<User>['pagination'] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchFollowers = async (page: number = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getFollowers(userId, page, 20)
      setFollowers(response.data)
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load followers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchFollowers(currentPage)
    }
  }, [userId, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Container maxWidth="lg">
      <div className="space-y-6 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Followers</h1>
        </div>

        {isLoading && followers.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : followers.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No followers yet"
            description="When someone follows this user, they'll appear here."
            size="lg"
          />
        ) : (
          <>
            <div className="space-y-4">
              {followers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </>
        )}
      </div>
    </Container>
  )
}


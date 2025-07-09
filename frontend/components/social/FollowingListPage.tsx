'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFollowing } from '@/api/social'
import type { User, PaginatedResponse } from '@/types/api'
import { Container } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { UserCard } from './UserCard'

interface FollowingListPageProps {
  userId: string
}

export function FollowingListPage({ userId }: FollowingListPageProps) {
  const router = useRouter()
  const [following, setFollowing] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginatedResponse<User>['pagination'] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchFollowing = async (page: number = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getFollowing(userId, page, 20)
      if (page === 1) {
        setFollowing(response.data)
      } else {
        setFollowing((prev) => [...prev, ...response.data])
      }
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load following')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchFollowing(currentPage)
    }
  }, [userId, currentPage])

  const handleLoadMore = () => {
    if (pagination?.hasNext && !isLoading) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  return (
    <Container maxWidth="lg">
      <div className="space-y-6 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Following</h1>
        </div>

        {isLoading && following.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Not following anyone yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {following.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            {pagination?.hasNext && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  )
}


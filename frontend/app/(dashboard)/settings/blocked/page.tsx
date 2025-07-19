'use client'

import { useEffect, useState } from 'react'
import { getBlockedUsers } from '@/api/user'
import { UserCard } from '@/components/social/UserCard'
import { Container } from '@/components/layout/Container'
import type { User, PaginatedResponse } from '@/types/api'

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadBlockedUsers()
  }, [])

  const loadBlockedUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response: PaginatedResponse<User> = await getBlockedUsers(page, 20)
      setBlockedUsers((prev) => [...prev, ...response.data])
      setHasMore(response.meta.hasNextPage)
    } catch (err: any) {
      setError(err.message || 'Failed to load blocked users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = (userId: string) => {
    setBlockedUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  if (isLoading && blockedUsers.length === 0) {
    return (
      <Container>
        <div className="py-8">
          <h1 className="text-2xl font-bold mb-6">Blocked Users</h1>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading blocked users...</p>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold mb-6">Blocked Users</h1>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">No blocked users</p>
            <p className="text-sm text-muted-foreground">
              Users you block will appear here. You can unblock them at any time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                showFollowButton={false}
                showBlockButton={true}
                onUnblock={handleUnblock}
              />
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    setPage((prev) => prev + 1)
                    loadBlockedUsers()
                  }}
                  disabled={isLoading}
                  className="text-primary hover:underline"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}


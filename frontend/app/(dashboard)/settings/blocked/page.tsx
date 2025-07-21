'use client'

import { useEffect, useState } from 'react'
import { getBlockedUsers } from '@/api/user'
import { UserCard } from '@/components/social/UserCard'
import { Container } from '@/components/layout/Container'
import { PaginationControls } from '@/components/ui/pagination'
import type { User, PaginatedResponse } from '@/types/api'

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginatedResponse<User>['pagination'] | null>(null)

  useEffect(() => {
    loadBlockedUsers()
  }, [page])

  const loadBlockedUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response: PaginatedResponse<User> = await getBlockedUsers(page, 20)
      setBlockedUsers(response.data)
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load blocked users')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </div>
        )}
      </div>
    </Container>
  )
}


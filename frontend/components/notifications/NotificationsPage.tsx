'use client'

import { useEffect } from 'react'
import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationList } from './NotificationList'
import { Button } from '@/components/ui/button'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { CheckCheck, Trash2, Bell } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading'
import { NotificationSkeleton } from '@/components/ui/skeleton'

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    pagination,
    fetchNotifications,
    fetchUnreadCount,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useNotificationStore()

  // Initial fetch
  useEffect(() => {
    fetchNotifications(1, 20)
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  // Infinite scroll
  const handleLoadMore = () => {
    if (
      !isLoading &&
      pagination &&
      pagination.currentPage < pagination.totalPages
    ) {
      fetchNotifications(pagination.currentPage + 1, 20)
    }
  }

  const hasNextPage = pagination ? pagination.currentPage < pagination.totalPages : false
  const { observerTarget } = useInfiniteScroll({
    hasNextPage,
    isLoading,
    onLoadMore: handleLoadMore,
  })

  const handleNotificationClick = (notification: any) => {
    // Navigation will be handled by NotificationList component
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      // Delete all notifications one by one
      const { deleteNotificationById } = useNotificationStore.getState()
      for (const notification of notifications) {
        try {
          await deleteNotificationById(notification.id)
        } catch (error) {
          console.error('Failed to delete notification:', error)
        }
      }
      clearNotifications()
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <NotificationList
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
        />
        {isLoading && notifications.length === 0 && (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        )}
        {!isLoading && notifications.length === 0 && !error && (
          <EmptyState
            icon={<Bell />}
            title="No notifications yet"
            description="You'll see notifications here when someone likes, comments, or follows you."
            size="lg"
          />
        )}
      </div>

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={observerTarget} className="mt-4 text-center">
          {isLoading && <LoadingSpinner size="sm" text="Loading more..." />}
        </div>
      )}
    </div>
  )
}


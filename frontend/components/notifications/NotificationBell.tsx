'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useNotificationStore } from '@/stores/notificationStore'
import { useSocket } from '@/hooks/useSocket'
import { NotificationList } from './NotificationList'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types/api'

export function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
  } = useNotificationStore()

  const { socket, isConnected, on } = useSocket({
    autoConnect: true,
  })

  // Fetch notifications and unread count on mount
  useEffect(() => {
    fetchNotifications(1, 10)
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  // Listen for new notifications via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNotification = (notification: Notification) => {
      const { addNotification, unreadCount: currentCount } = useNotificationStore.getState()
      addNotification(notification)
      if (!notification.read) {
        useNotificationStore.getState().setUnreadCount(currentCount + 1)
      }
    }

    on('notification', handleNotification)

    return () => {
      // Cleanup is handled by useSocket hook
    }
  }, [socket, isConnected, on])

  // Refresh unread count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.postId) {
      router.push(`/posts/${notification.postId}`)
    } else if (notification.userId) {
      router.push(`/profile/${notification.userId}`)
    }

    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const { markAllNotificationsAsRead } = useNotificationStore.getState()
                await markAllNotificationsAsRead()
              }}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <NotificationList
          notifications={notifications.slice(0, 10)}
          onNotificationClick={handleNotificationClick}
        />
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  router.push('/notifications')
                  setIsOpen(false)
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


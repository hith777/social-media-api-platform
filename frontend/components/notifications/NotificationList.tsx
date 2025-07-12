'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'

interface NotificationListProps {
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationList({ notifications, onNotificationClick }: NotificationListProps) {
  const router = useRouter()
  const { deleteNotificationById, markNotificationAsRead } = useNotificationStore()

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotificationById(notificationId)
  }

  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.postId) {
      router.push(`/posts/${notification.postId}`)
    } else if (notification.userId) {
      router.push(`/profile/${notification.userId}`)
    }

    onNotificationClick?.(notification)
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        <p>No notifications</p>
      </div>
    )
  }

  return (
    <div>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
            !notification.read ? 'bg-primary/5' : ''
          }`}
          onClick={() => handleClick(notification)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={(e) => handleDelete(e, notification.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {!notification.read && (
            <div className="mt-2 h-1 w-1 rounded-full bg-primary" />
          )}
        </div>
      ))}
    </div>
  )
}


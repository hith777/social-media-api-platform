import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification, PaginatedResponse } from '@/types/api'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/api/notification'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  pagination: PaginatedResponse<Notification>['pagination'] | null
  // Actions
  setNotifications: (notifications: Notification[]) => void
  setUnreadCount: (count: number) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  addNotification: (notification: Notification) => void
  removeNotification: (notificationId: string) => void
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void
  fetchNotifications: (page?: number, limit?: number, unreadOnly?: boolean) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  deleteNotificationById: (notificationId: string) => Promise<void>
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      pagination: null,

      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
        })),

      removeNotification: (notificationId) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId)
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }
        }),

      updateNotification: (notificationId, updates) =>
        set((state) => {
          const index = state.notifications.findIndex((n) => n.id === notificationId)
          if (index === -1) return state

          const oldNotification = state.notifications[index]
          const newNotification = { ...oldNotification, ...updates }
          const newNotifications = [...state.notifications]
          newNotifications[index] = newNotification

          // Update unread count if read status changed
          let newUnreadCount = state.unreadCount
          if (oldNotification.read !== newNotification.read) {
            if (newNotification.read) {
              newUnreadCount = Math.max(0, state.unreadCount - 1)
            } else {
              newUnreadCount = state.unreadCount + 1
            }
          }

          return {
            notifications: newNotifications,
            unreadCount: newUnreadCount,
          }
        }),

      fetchNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
        set({ isLoading: true, error: null })
        try {
          const response = await getNotifications({ page, limit, unreadOnly })
          if (page === 1) {
            set({ notifications: response.data, pagination: response.pagination })
          } else {
            set((state) => ({
              notifications: [...state.notifications, ...response.data],
              pagination: response.pagination,
            }))
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch notifications' })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchUnreadCount: async () => {
        try {
          const response = await getUnreadCount()
          set({ unreadCount: response.unreadCount })
        } catch (error: any) {
          console.error('Failed to fetch unread count:', error)
        }
      },

      markNotificationAsRead: async (notificationId) => {
        try {
          await markAsRead(notificationId)
          get().updateNotification(notificationId, { read: true })
        } catch (error: any) {
          set({ error: error.message || 'Failed to mark notification as read' })
          throw error
        }
      },

      markAllNotificationsAsRead: async () => {
        try {
          await markAllAsRead()
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }))
        } catch (error: any) {
          set({ error: error.message || 'Failed to mark all notifications as read' })
          throw error
        }
      },

      deleteNotificationById: async (notificationId) => {
        try {
          await deleteNotification(notificationId)
          get().removeNotification(notificationId)
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete notification' })
          throw error
        }
      },

      clearNotifications: () => set({ notifications: [], unreadCount: 0, pagination: null }),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
)

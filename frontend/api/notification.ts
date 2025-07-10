import { get, put, post } from './utils'
import type { Notification, PaginatedResponse } from '@/types/api'

/**
 * Get user's notifications
 */
export interface NotificationQueryParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(
  params?: NotificationQueryParams
): Promise<PaginatedResponse<Notification>> {
  return get<PaginatedResponse<Notification>>('/notifications', { params })
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return get<{ unreadCount: number }>('/notifications/unread-count')
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<{ message: string }> {
  return put<{ message: string }>(`/notifications/${notificationId}/read`)
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ message: string }> {
  return put<{ message: string }>('/notifications/read-all')
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/notifications/${notificationId}`)
}


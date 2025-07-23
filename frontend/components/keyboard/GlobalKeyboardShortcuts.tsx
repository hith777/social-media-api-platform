'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useKeyboardShortcut } from '@/hooks/useKeyboardNavigation'

/**
 * Global keyboard shortcuts handler component
 * Provides keyboard shortcuts for common actions throughout the app
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  // Focus search input: Ctrl/Cmd + K or /
  useKeyboardShortcut('k', () => {
    if (!isAuthenticated) return
    const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    } else {
      router.push('/search')
    }
  }, { ctrl: true, enabled: isAuthenticated })

  useKeyboardShortcut('/', () => {
    if (!isAuthenticated) return
    const activeElement = document.activeElement
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      return // Don't interfere if user is typing
    }
    const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement
    searchInput?.focus()
  }, { enabled: isAuthenticated })

  // Navigate to feed: Ctrl/Cmd + 1
  useKeyboardShortcut('1', () => {
    if (!isAuthenticated) return
    router.push('/feed')
  }, { ctrl: true, enabled: isAuthenticated })

  // Navigate to profile: Ctrl/Cmd + 2
  useKeyboardShortcut('2', () => {
    if (!isAuthenticated || !user) return
    router.push(`/profile/${user.id}`)
  }, { ctrl: true, enabled: isAuthenticated })

  // Navigate to notifications: Ctrl/Cmd + 3
  useKeyboardShortcut('3', () => {
    if (!isAuthenticated) return
    router.push('/notifications')
  }, { ctrl: true, enabled: isAuthenticated })

  // Navigate to search: Ctrl/Cmd + 4
  useKeyboardShortcut('4', () => {
    if (!isAuthenticated) return
    router.push('/search')
  }, { ctrl: true, enabled: isAuthenticated })

  // Go back: Escape (when not in input/textarea)
  useKeyboardShortcut('Escape', () => {
    const activeElement = document.activeElement
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      return // Don't interfere if user is typing
    }
    // Close any open dialogs/modals first
    const openDialog = document.querySelector('[role="dialog"]')
    if (openDialog) {
      const closeButton = openDialog.querySelector('button[aria-label*="Close"], button[aria-label*="close"]')
      if (closeButton) {
        (closeButton as HTMLButtonElement).click()
        return
      }
    }
    // If no dialog, go back in history
    if (window.history.length > 1) {
      router.back()
    }
  }, { enabled: isAuthenticated })

  return null
}


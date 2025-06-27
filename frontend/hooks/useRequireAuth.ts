'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

/**
 * Hook to require authentication for a page
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const router = useRouter()
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading) {
        if (!isAuthenticated) {
          // Try to fetch current user (will set auth state if token is valid)
          await fetchCurrentUser()
          
          // Check again after fetch attempt
          const { isAuthenticated: stillNotAuth } = useAuthStore.getState()
          if (!stillNotAuth) {
            const currentPath = window.location.pathname
            router.push(`${redirectTo}?redirect=${currentPath}`)
          }
        }
      }
    }

    checkAuth()
  }, [isAuthenticated, isLoading, router, redirectTo, fetchCurrentUser])

  return {
    isAuthenticated,
    isLoading,
  }
}


'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Client-side protected route component
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
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
            router.push(`${redirectTo}?redirect=${window.location.pathname}`)
          }
        }
      }
    }

    checkAuth()
  }, [isAuthenticated, isLoading, router, redirectTo, fetchCurrentUser])

  // Show loading state while checking auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}


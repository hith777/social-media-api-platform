'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAccessToken } from '@/utils/tokenManager'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check localStorage directly for immediate redirect
    const hasToken = !!getAccessToken()
    
    // Redirect immediately - don't wait for Zustand hydration
    if (hasToken) {
      router.replace('/feed')
    } else {
      router.replace('/login')
    }
  }, [router])

  // Show loading state while redirecting
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </main>
  )
}


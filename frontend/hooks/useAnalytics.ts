'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/utils/analytics'

/**
 * Hook to automatically track page views
 */
export function useAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    trackPageView({
      path: fullPath,
      title: document.title,
    })
  }, [pathname, searchParams])
}

/**
 * Hook to track component mount/unmount
 */
export function useComponentAnalytics(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      if (renderTime > 100) {
        // Track slow component renders
        console.debug(`Component ${componentName} rendered in ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}


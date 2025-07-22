'use client'

import { useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { env } from '@/config/env'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

/**
 * Provider component for analytics tracking
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useAnalytics()

  useEffect(() => {
    // Initialize Google Analytics if available
    if (env.gaMeasurementId && typeof window !== 'undefined') {
      // Load Google Analytics script
      const script1 = document.createElement('script')
      script1.async = true
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${env.gaMeasurementId}`
      document.head.appendChild(script1)

      const script2 = document.createElement('script')
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${env.gaMeasurementId}', {
          page_path: window.location.pathname,
        });
      `
      document.head.appendChild(script2)

      return () => {
        // Cleanup scripts on unmount
        const scripts = document.querySelectorAll(`script[src*="googletagmanager"]`)
        scripts.forEach((script) => script.remove())
      }
    }
  }, [])

  return <>{children}</>
}


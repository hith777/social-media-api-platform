/**
 * Analytics and performance monitoring utilities
 */

import { env } from '@/config/env'

interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

interface PageViewEvent {
  path: string
  title?: string
}

/**
 * Track custom analytics events
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return

  // Only track in production or if explicitly enabled
  if (!env.enableAnalytics && !env.isProduction) {
    return
  }

  try {
    // Google Analytics 4 (gtag)
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      })
    }

    // Custom analytics endpoint (if available)
    if (env.analyticsEndpoint) {
      fetch(env.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          path: window.location.pathname,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail analytics requests
      })
    }
  } catch (error) {
    // Silently fail analytics
    console.debug('Analytics error:', error)
  }
}

/**
 * Track page views
 */
export function trackPageView(event: PageViewEvent): void {
  if (typeof window === 'undefined') return

  if (!env.enableAnalytics && !env.isProduction) {
    return
  }

  try {
    // Google Analytics 4
    if (typeof window.gtag !== 'undefined' && env.gaMeasurementId) {
      window.gtag('config', env.gaMeasurementId, {
        page_path: event.path,
        page_title: event.title,
      })
    }

    trackEvent({
      action: 'page_view',
      category: 'Navigation',
      label: event.path,
    })
  } catch (error) {
    console.debug('Page view tracking error:', error)
  }
}

/**
 * Track performance metrics
 */
export function trackPerformanceMetric(name: string, value: number, unit: string = 'ms'): void {
  if (typeof window === 'undefined') return

  try {
    // Web Vitals
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', name, {
        value: Math.round(value),
        metric_id: name,
        metric_value: value,
        metric_delta: value,
      })
    }

    // Performance API
    if ('performance' in window && 'mark' in window.performance) {
      window.performance.mark(`${name}-${Date.now()}`)
    }
  } catch (error) {
    console.debug('Performance tracking error:', error)
  }
}

/**
 * Track user interactions
 */
export const trackInteraction = {
  postLike: (postId: string) => {
    trackEvent({
      action: 'like',
      category: 'Post',
      label: postId,
    })
  },

  postComment: (postId: string) => {
    trackEvent({
      action: 'comment',
      category: 'Post',
      label: postId,
    })
  },

  postShare: (postId: string) => {
    trackEvent({
      action: 'share',
      category: 'Post',
      label: postId,
    })
  },

  followUser: (userId: string) => {
    trackEvent({
      action: 'follow',
      category: 'User',
      label: userId,
    })
  },

  search: (query: string, resultCount: number) => {
    trackEvent({
      action: 'search',
      category: 'Search',
      label: query,
      value: resultCount,
    })
  },

  createPost: () => {
    trackEvent({
      action: 'create',
      category: 'Post',
    })
  },
}

/**
 * Measure and track component render time
 */
export function measureComponentRender(componentName: string): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const startTime = performance.now()

  return () => {
    const endTime = performance.now()
    const renderTime = endTime - startTime

    if (renderTime > 100) {
      // Only track slow renders
      trackPerformanceMetric(`component_render_${componentName}`, renderTime)
    }
  }
}

/**
 * Track API call performance
 */
export function trackAPICall(endpoint: string, duration: number, success: boolean): void {
  trackEvent({
    action: success ? 'api_success' : 'api_error',
    category: 'API',
    label: endpoint,
    value: Math.round(duration),
  })

  if (duration > 1000) {
    trackPerformanceMetric(`api_slow_${endpoint}`, duration)
  }
}

/**
 * Track errors
 */
export function trackError(error: Error, context?: Record<string, unknown>): void {
  trackEvent({
    action: 'error',
    category: 'Error',
    label: error.message,
  })

  // Send to error tracking service if available
  if (env.errorTrackingEndpoint) {
    fetch(env.errorTrackingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch(() => {
      // Silently fail
    })
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | object,
      config?: Record<string, unknown>
    ) => void
  }
}


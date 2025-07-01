import { useEffect, useRef, useState } from 'react'

interface UseInfiniteScrollOptions {
  hasNextPage: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
}

/**
 * Hook for infinite scroll functionality
 */
export function useInfiniteScroll({
  hasNextPage,
  isLoading,
  onLoadMore,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading && !isFetching) {
          setIsFetching(true)
          onLoadMore()
        }
      },
      { rootMargin: `${threshold}px` }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isLoading, isFetching, onLoadMore, threshold])

  useEffect(() => {
    if (!isLoading) {
      setIsFetching(false)
    }
  }, [isLoading])

  return { observerTarget, isFetching }
}


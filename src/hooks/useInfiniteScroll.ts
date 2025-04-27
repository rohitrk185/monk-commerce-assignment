import { useRef, useCallback, useEffect } from 'react'

interface UseInfiniteScrollOptions {
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
  disabled?: boolean // Option to disable the observer
}

export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 1.0,
  rootMargin = '0px',
  disabled = false,
}: UseInfiniteScrollOptions) {
  const observer = useRef<IntersectionObserver | null>(null)

  const lastElementRef = useCallback(
    (node: Element | null) => {
      if (loading || !hasMore || disabled) return

      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore()
          }
        },
        { threshold, rootMargin }
      )

      if (node) observer.current.observe(node)
    },
    [loading, hasMore, onLoadMore, threshold, rootMargin, disabled]
  )

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  return lastElementRef
}

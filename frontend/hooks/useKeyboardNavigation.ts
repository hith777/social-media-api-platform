'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardNavigationOptions {
  onEnter?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  enabled?: boolean
  target?: HTMLElement | null
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboardNavigation({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  enabled = true,
  target,
}: KeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't handle if user is typing in an input/textarea
      const targetElement = event.target as HTMLElement
      if (
        targetElement.tagName === 'INPUT' ||
        targetElement.tagName === 'TEXTAREA' ||
        targetElement.isContentEditable
      ) {
        return
      }

      switch (event.key) {
        case 'Enter':
          if (onEnter && !event.shiftKey) {
            event.preventDefault()
            onEnter()
          }
          break
        case 'Escape':
          if (onEscape) {
            event.preventDefault()
            onEscape()
          }
          break
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault()
            onArrowUp()
          }
          break
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault()
            onArrowDown()
          }
          break
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault()
            onArrowLeft()
          }
          break
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault()
            onArrowRight()
          }
          break
      }
    },
    [enabled, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]
  )

  useEffect(() => {
    const element = target || document
    if (enabled) {
      element.addEventListener('keydown', handleKeyDown)
      return () => {
        element.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [enabled, handleKeyDown, target])
}

/**
 * Hook for handling keyboard shortcuts (with modifiers)
 * Supports both Ctrl (Windows/Linux) and Cmd (Mac) for ctrl option
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
    enabled?: boolean
  } = {}
) {
  const { ctrl = false, shift = false, alt = false, meta = false, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input/textarea
      const targetElement = event.target as HTMLElement
      if (
        targetElement.tagName === 'INPUT' ||
        targetElement.tagName === 'TEXTAREA' ||
        targetElement.isContentEditable
      ) {
        return
      }

      // For ctrl option, accept either Ctrl or Cmd (Mac)
      const ctrlPressed = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        ctrlPressed &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        (meta ? event.metaKey : !event.metaKey || ctrl) // Don't require meta if ctrl is set
      ) {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [key, callback, ctrl, shift, alt, meta, enabled])
}

/**
 * Hook for focus trap (useful for modals and dialogs)
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Focus first element when trap is enabled
    firstElement?.focus()

    container.addEventListener('keydown', handleTabKey)
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [enabled, containerRef])
}


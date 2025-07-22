/**
 * Accessibility utility functions
 */

/**
 * Generate a unique ID for ARIA attributes
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get ARIA label for like button based on state
 */
export function getLikeButtonLabel(isLiked: boolean, count: number): string {
  if (isLiked) {
    return `Unlike this post. ${count} ${count === 1 ? 'person likes' : 'people like'} this`
  }
  return `Like this post. ${count} ${count === 1 ? 'person likes' : 'people like'} this`
}

/**
 * Get ARIA label for comment button
 */
export function getCommentButtonLabel(count: number): string {
  return `Comment on this post. ${count} ${count === 1 ? 'comment' : 'comments'}`
}

/**
 * Get ARIA label for share button
 */
export function getShareButtonLabel(): string {
  return 'Share this post'
}

/**
 * Get ARIA label for follow button based on state
 */
export function getFollowButtonLabel(isFollowing: boolean, username: string): string {
  if (isFollowing) {
    return `Unfollow ${username}`
  }
  return `Follow ${username}`
}

/**
 * Get ARIA label for block button based on state
 */
export function getBlockButtonLabel(isBlocked: boolean, username: string): string {
  if (isBlocked) {
    return `Unblock ${username}`
  }
  return `Block ${username}`
}

/**
 * Get ARIA label for post actions menu
 */
export function getPostActionsLabel(isOwnPost: boolean): string {
  return isOwnPost ? 'Post options: Edit or delete' : 'Post options: Report or block user'
}

/**
 * Get ARIA live region announcement for dynamic content
 */
export function createLiveRegion(level: 'polite' | 'assertive' = 'polite'): HTMLElement {
  const region = document.createElement('div')
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', level)
  region.setAttribute('aria-atomic', 'true')
  region.className = 'sr-only'
  document.body.appendChild(region)
  return region
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(
  message: string,
  level: 'polite' | 'assertive' = 'polite'
): void {
  const region = createLiveRegion(level)
  region.textContent = message
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(region)
  }, 1000)
}

/**
 * Get keyboard shortcut description
 */
export function getKeyboardShortcutDescription(key: string, modifiers?: {
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
}): string {
  const parts: string[] = []
  
  if (modifiers?.ctrl || modifiers?.meta) {
    parts.push(modifiers.meta ? 'Command' : 'Control')
  }
  if (modifiers?.shift) {
    parts.push('Shift')
  }
  if (modifiers?.alt) {
    parts.push('Alt')
  }
  parts.push(key.toUpperCase())
  
  return parts.join(' + ')
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  return element.matches(focusableSelectors)
}

/**
 * Get skip link text
 */
export function getSkipLinkText(target: string): string {
  const labels: Record<string, string> = {
    main: 'Skip to main content',
    navigation: 'Skip to navigation',
    search: 'Skip to search',
    footer: 'Skip to footer',
  }
  
  return labels[target] || `Skip to ${target}`
}


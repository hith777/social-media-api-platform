'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { followUser, unfollowUser } from '@/api/social'
import { useAuthStore } from '@/stores/authStore'
import { getFollowButtonLabel } from '@/utils/accessibility'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  username?: string
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  username = 'user',
  onFollowChange,
  variant = 'default',
  size = 'default',
  className,
}: FollowButtonProps) {
  const { user } = useAuthStore()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  // Don't show follow button for own profile
  if (user?.id === userId) {
    return null
  }

  const handleFollow = async () => {
    setIsLoading(true)
    try {
      if (isFollowing) {
        const response = await unfollowUser(userId)
        setIsFollowing(false)
        onFollowChange?.(false, response.followersCount)
      } else {
        const response = await followUser(userId)
        setIsFollowing(true)
        onFollowChange?.(true, response.followersCount)
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      // Revert on error
      setIsFollowing(initialIsFollowing)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      aria-label={getFollowButtonLabel(isFollowing, username)}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      ) : (
        <>
          {isFollowing ? (
            <>
              <UserMinus className="mr-2 h-4 w-4" />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Follow
            </>
          )}
        </>
      )}
    </Button>
  )
}


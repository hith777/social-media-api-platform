'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { User } from '@/types/api'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from './FollowButton'
import { useAuthStore } from '@/stores/authStore'
import { Check } from 'lucide-react'

interface UserCardProps {
  user: User
  showFollowButton?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  onClick?: (user: User) => void
}

export function UserCard({
  user,
  showFollowButton = true,
  variant = 'default',
  onClick,
}: UserCardProps) {
  const { user: currentUser } = useAuthStore()
  const isOwnProfile = currentUser?.id === user.id

  const handleClick = () => {
    if (onClick) {
      onClick(user)
    }
  }

  if (variant === 'compact') {
    return (
      <Card className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}>
        <CardContent className="p-3" onClick={handleClick}>
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`} onClick={(e) => e.stopPropagation()}>
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.id}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold hover:underline truncate text-sm">
                    {user.displayName || user.username}
                  </h3>
                  {user.isVerified && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </div>
              </Link>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
            {showFollowButton && !isOwnProfile && (
              <FollowButton
                userId={user.id}
                isFollowing={false}
                size="sm"
                variant="outline"
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}>
      <CardContent className="p-4" onClick={handleClick}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={`/profile/${user.id}`} onClick={(e) => e.stopPropagation()}>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username}
                width={variant === 'detailed' ? 64 : 48}
                height={variant === 'detailed' ? 64 : 48}
                className="rounded-full"
              />
            ) : (
              <div
                className={`${
                  variant === 'detailed' ? 'w-16 h-16' : 'w-12 h-12'
                } rounded-full bg-primary/10 flex items-center justify-center`}
              >
                <span
                  className={`${
                    variant === 'detailed' ? 'text-xl' : 'text-lg'
                  } font-medium text-primary`}
                >
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.id}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <h3 className="font-semibold hover:underline truncate">
                  {user.displayName || user.username}
                </h3>
                {user.isVerified && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </Link>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            {user.bio && (
              <p className={`text-sm mt-1 ${variant === 'detailed' ? '' : 'line-clamp-2'}`}>
                {user.bio}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <Link
                href={`/profile/${user.id}/followers`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                {user.followersCount || 0} followers
              </Link>
              <Link
                href={`/profile/${user.id}/following`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                {user.followingCount || 0} following
              </Link>
              <span>{user.postsCount || 0} posts</span>
            </div>
          </div>

          {/* Follow Button */}
          {showFollowButton && !isOwnProfile && (
            <FollowButton
              userId={user.id}
              isFollowing={false}
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}


'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { User } from '@/types/api'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from './FollowButton'
import { useAuthStore } from '@/stores/authStore'

interface UserCardProps {
  user: User
  showFollowButton?: boolean
}

export function UserCard({ user, showFollowButton = true }: UserCardProps) {
  const { user: currentUser } = useAuthStore()
  const isOwnProfile = currentUser?.id === user.id

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={`/profile/${user.id}`}>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.id}`}>
              <h3 className="font-semibold hover:underline truncate">
                {user.displayName || user.username}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            {user.bio && (
              <p className="text-sm mt-1 line-clamp-2">{user.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{user.followersCount || 0} followers</span>
              <span>{user.postsCount || 0} posts</span>
            </div>
          </div>

          {/* Follow Button */}
          {showFollowButton && !isOwnProfile && (
            <FollowButton
              userId={user.id}
              isFollowing={false} // TODO: Get actual follow status from user object
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}


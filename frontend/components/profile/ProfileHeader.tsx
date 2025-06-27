'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { User } from '@/types/api'
import { Button } from '@/components/ui/button'
import { EditProfileDialog } from './EditProfileDialog'

interface ProfileHeaderProps {
  user: User
  onUpdate: (user: User) => void
}

export function ProfileHeader({ user, onUpdate }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <>
      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl font-bold">
                {user.displayName || user.username}
              </h1>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.bio && (
                <p className="mt-2 text-sm">{user.bio}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="font-semibold">{user.postsCount}</span>{' '}
                <span className="text-muted-foreground">Posts</span>
              </div>
              <div>
                <span className="font-semibold">{user.followersCount}</span>{' '}
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div>
                <span className="font-semibold">{user.followingCount}</span>{' '}
                <span className="text-muted-foreground">Following</span>
              </div>
            </div>

            <Button onClick={() => setIsEditOpen(true)} variant="outline">
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <EditProfileDialog
        user={user}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={onUpdate}
      />
    </>
  )
}


'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { User } from '@/types/api'
import { Button } from '@/components/ui/button'
import { EditProfileDialog } from './EditProfileDialog'
import { AvatarUpload } from './AvatarUpload'

interface ProfileHeaderProps {
  user: User
  onUpdate: (user: User) => void
}

export function ProfileHeader({ user, onUpdate }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAvatarEditOpen, setIsAvatarEditOpen] = useState(false)

  return (
    <>
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-muted">
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

          <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {user.displayName || user.username}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">@{user.username}</p>
              {user.bio && (
                <p className="mt-2 text-sm">{user.bio}</p>
              )}
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-sm">
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

            <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
              <Button onClick={() => setIsEditOpen(true)} variant="outline" className="w-full sm:w-auto">
                Edit Profile
              </Button>
              <Button
                onClick={() => setIsAvatarEditOpen(true)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Change Avatar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EditProfileDialog
        user={user}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={onUpdate}
      />

      {isAvatarEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsAvatarEditOpen(false)}
        >
          <div
            className="bg-background rounded-lg border p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Change Avatar</h2>
            <AvatarUpload
              currentAvatar={user.avatar}
              username={user.username}
              onUploadComplete={(avatarUrl) => {
                onUpdate({ ...user, avatar: avatarUrl })
                setIsAvatarEditOpen(false)
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAvatarEditOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


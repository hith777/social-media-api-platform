'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ban, Shield, MoreVertical } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { BlockUserDialog } from './BlockUserDialog'
import { getUserProfile } from '@/api/user'
import type { User } from '@/types/api'

interface BlockButtonProps {
  userId: string
  isBlocked?: boolean
  username?: string
  onBlockChange?: (isBlocked: boolean) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showAsMenu?: boolean
}

export function BlockButton({
  userId,
  isBlocked: initialIsBlocked = false,
  username = 'user',
  onBlockChange,
  variant = 'ghost',
  size = 'sm',
  className,
  showAsMenu = false,
}: BlockButtonProps) {
  const { user } = useAuthStore()
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<User | null>(null)

  // Don't show block button for own profile
  if (user?.id === userId) {
    return null
  }

  const handleOpenDialog = async () => {
    try {
      // Fetch user details if not already available
      if (!targetUser || targetUser.id !== userId) {
        const userData = await getUserProfile(userId)
        setTargetUser(userData)
      }
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // Still open dialog with minimal user info
      setTargetUser({
        id: userId,
        username: '',
        displayName: '',
        email: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User)
      setIsDialogOpen(true)
    }
  }

  const handleBlockSuccess = () => {
    setIsBlocked(true)
    onBlockChange?.(true)
  }

  const handleUnblockSuccess = () => {
    setIsBlocked(false)
    onBlockChange?.(false)
  }

  if (showAsMenu) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenDialog}>
              {isBlocked ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Unblock User
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Block User
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {targetUser && (
          <BlockUserDialog
            user={targetUser}
            isBlocked={isBlocked}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSuccess={isBlocked ? handleUnblockSuccess : handleBlockSuccess}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        aria-label={getBlockButtonLabel(isBlocked, username)}
        className={className}
      >
        {isBlocked ? (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Unblock
          </>
        ) : (
          <>
            <Ban className="mr-2 h-4 w-4" />
            Block
          </>
        )}
      </Button>
      {targetUser && (
        <BlockUserDialog
          user={targetUser}
          isBlocked={isBlocked}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={isBlocked ? handleUnblockSuccess : handleBlockSuccess}
        />
      )}
    </>
  )
}


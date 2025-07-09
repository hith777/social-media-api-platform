'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ban, Shield, Loader2, MoreVertical } from 'lucide-react'
import { blockUser, unblockUser } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'

interface BlockButtonProps {
  userId: string
  isBlocked?: boolean
  onBlockChange?: (isBlocked: boolean) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showAsMenu?: boolean
}

export function BlockButton({
  userId,
  isBlocked: initialIsBlocked = false,
  onBlockChange,
  variant = 'ghost',
  size = 'sm',
  className,
  showAsMenu = false,
}: BlockButtonProps) {
  const { user } = useAuthStore()
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked)
  const [isLoading, setIsLoading] = useState(false)

  // Don't show block button for own profile
  if (user?.id === userId) {
    return null
  }

  const handleBlock = async () => {
    if (!confirm('Are you sure you want to block this user? You won\'t be able to see their posts or interact with them.')) {
      return
    }

    setIsLoading(true)
    try {
      await blockUser(userId)
      setIsBlocked(true)
      onBlockChange?.(true)
    } catch (error) {
      console.error('Failed to block user:', error)
      alert('Failed to block user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = async () => {
    setIsLoading(true)
    try {
      await unblockUser(userId)
      setIsBlocked(false)
      onBlockChange?.(false)
    } catch (error) {
      console.error('Failed to unblock user:', error)
      alert('Failed to unblock user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (showAsMenu) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isBlocked ? (
            <DropdownMenuItem onClick={handleUnblock} disabled={isLoading}>
              <Shield className="mr-2 h-4 w-4" />
              {isLoading ? 'Unblocking...' : 'Unblock User'}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={handleBlock}
              disabled={isLoading}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              {isLoading ? 'Blocking...' : 'Block User'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={isBlocked ? handleUnblock : handleBlock}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isBlocked ? 'Unblocking...' : 'Blocking...'}
        </>
      ) : (
        <>
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
        </>
      )}
    </Button>
  )
}


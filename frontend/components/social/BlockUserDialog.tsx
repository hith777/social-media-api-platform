'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { blockUser, unblockUser } from '@/api/user'
import { showToast } from '@/utils/toast'
import { Ban, UserX } from 'lucide-react'
import type { User } from '@/types/api'

interface BlockUserDialogProps {
  user: User
  isBlocked: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BlockUserDialog({
  user,
  isBlocked,
  open,
  onOpenChange,
  onSuccess,
}: BlockUserDialogProps) {
  const handleBlock = async () => {
    try {
      await blockUser(user.id)
      showToast.success(
        'User blocked',
        `You have blocked ${user.displayName || user.username}. You won't see their content anymore.`
      )
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      showToast.error('Failed to block user', error.message || 'Please try again.')
    }
  }

  const handleUnblock = async () => {
    try {
      await unblockUser(user.id)
      showToast.success(
        'User unblocked',
        `You have unblocked ${user.displayName || user.username}.`
      )
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      showToast.error('Failed to unblock user', error.message || 'Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocked ? (
              <>
                <UserX className="h-5 w-5" />
                Unblock User
              </>
            ) : (
              <>
                <Ban className="h-5 w-5" />
                Block User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBlocked ? (
              <>
                Are you sure you want to unblock <strong>{user.displayName || user.username}</strong>?
                You will be able to see their posts and interact with them again.
              </>
            ) : (
              <>
                Are you sure you want to block <strong>{user.displayName || user.username}</strong>?
                <br />
                <br />
                When you block someone:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>You won't see their posts in your feed</li>
                  <li>They won't be able to see your posts</li>
                  <li>You won't be able to follow each other</li>
                  <li>You won't be able to message each other</li>
                </ul>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isBlocked ? 'default' : 'destructive'}
            onClick={isBlocked ? handleUnblock : handleBlock}
          >
            {isBlocked ? 'Unblock' : 'Block User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


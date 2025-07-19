'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { deletePost } from '@/api/post'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2, Flag, Ban } from 'lucide-react'
import type { Post } from '@/types/api'
import { ReportPostDialog } from './ReportPostDialog'
import { BlockUserDialog } from '@/components/social/BlockUserDialog'
import { getUserProfile } from '@/api/user'
import { useState, useEffect } from 'react'

interface PostActionsMenuProps {
  post: Post
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  onReport?: (postId: string) => void
}

export function PostActionsMenu({
  post,
  onEdit,
  onDelete,
  onReport,
}: PostActionsMenuProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [postUser, setPostUser] = useState<any>(null)
  const isOwnPost = user?.id === post.userId

  useEffect(() => {
    if (isBlockDialogOpen && !postUser) {
      getUserProfile(post.userId)
        .then(setPostUser)
        .catch(() => {
          // Fallback user object
          setPostUser({
            id: post.userId,
            username: post.user?.username || '',
            displayName: post.user?.displayName || '',
            email: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        })
    }
  }, [isBlockDialogOpen, post.userId, post.user, postUser])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deletePost(post.id)
      onDelete?.(post.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    onEdit?.(post)
  }

  const handleReport = () => {
    setIsReportDialogOpen(true)
    onReport?.(post.id)
  }

  const handleBlock = () => {
    setIsBlockDialogOpen(true)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isOwnPost && (
          <>
            <DropdownMenuItem onClick={handleEdit} disabled={isDeleting}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {!isOwnPost && (
          <>
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="mr-2 h-4 w-4" />
              Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleBlock}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Block User
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      <ReportPostDialog
        postId={post.id}
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        onSuccess={() => {
          setIsReportDialogOpen(false)
        }}
      />
      {postUser && (
        <BlockUserDialog
          user={postUser}
          isBlocked={false}
          open={isBlockDialogOpen}
          onOpenChange={setIsBlockDialogOpen}
          onSuccess={() => {
            setIsBlockDialogOpen(false)
            router.refresh()
          }}
        />
      )}
    </DropdownMenu>
  )
}


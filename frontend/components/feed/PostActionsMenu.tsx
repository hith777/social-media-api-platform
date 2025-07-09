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
import { blockUser } from '@/api/user'

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
  const isOwnPost = user?.id === post.userId

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
    onReport?.(post.id)
  }

  const handleBlock = async () => {
    if (!confirm('Are you sure you want to block this user? You won\'t be able to see their posts or interact with them.')) {
      return
    }

    try {
      await blockUser(post.userId)
      alert('User blocked successfully')
      router.refresh()
    } catch (error) {
      console.error('Failed to block user:', error)
      alert('Failed to block user. Please try again.')
    }
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
    </DropdownMenu>
  )
}


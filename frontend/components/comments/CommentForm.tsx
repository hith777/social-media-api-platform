'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createComment } from '@/api/comment'
import { Send } from 'lucide-react'

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentFormProps {
  postId: string
  parentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  const onSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await createComment(postId, {
        content: data.content.trim(),
        parentId: parentId,
      })

      reset()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          {...register('content')}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          autoFocus={autoFocus}
          disabled={isSubmitting}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            'Posting...'
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {parentId ? 'Reply' : 'Post Comment'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}


'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FormError, FormFieldWrapper } from '@/components/ui/form-error'
import { Image as ImageIcon, X } from 'lucide-react'
import { createPost } from '@/api/post'
import type { Post } from '@/types/api'
import { PostVisibilitySelector } from './PostVisibilitySelector'
import { trackInteraction } from '@/utils/analytics'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  visibility: z.enum(['public', 'private', 'friends']).default('public'),
})

type CreatePostFormData = z.infer<typeof createPostSchema>

interface CreatePostFormProps {
  onPostCreated?: (post: Post) => void
  onCancel?: () => void
}

export function CreatePostForm({ onPostCreated, onCancel }: CreatePostFormProps) {
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      visibility: 'public',
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Validate file count (max 10)
    if (mediaFiles.length + files.length > 10) {
      setError('Maximum 10 images allowed')
      return
    }

    // Validate file types and sizes
    const validFiles: File[] = []
    const previews: string[] = []

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`)
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is larger than 10MB`)
        return
      }

      validFiles.push(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        if (previews.length === validFiles.length) {
          setMediaPreviews((prev) => [...prev, ...previews])
        }
      }
      reader.readAsDataURL(file)
    })

    setMediaFiles((prev) => [...prev, ...validFiles])
    setError(null)
  }

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CreatePostFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const post = await createPost(
        {
          content: data.content,
          visibility: data.visibility,
        },
        mediaFiles.length > 0 ? mediaFiles : undefined
      )

      // Reset form
      reset()
      setMediaFiles([])
      setMediaPreviews([])
      
      // Track analytics
      trackInteraction.createPost()
      
      onPostCreated?.(post)
    } catch (err: any) {
      setError(err.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const visibility = watch('visibility')

  // Keyboard shortcuts
  useKeyboardNavigation({
    onEscape: () => {
      if (!isSubmitting && onCancel) {
        onCancel()
      }
    },
    enabled: true,
  })

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Create Post</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormError error={error} dismissible onDismiss={() => setError(null)} />

          <FormFieldWrapper
            label="What's on your mind?"
            required
            error={errors.content}
            description={`${watch('content')?.length || 0} / 5000 characters`}
          >
            <textarea
              id="content"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What's on your mind?"
              aria-invalid={!!errors.content}
              {...register('content')}
              maxLength={5000}
            />
          </FormFieldWrapper>

          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="post-media-upload"
                disabled={isSubmitting}
              />
              <label htmlFor="post-media-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isSubmitting}
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Add Photos
                  </span>
                </Button>
              </label>

              <PostVisibilitySelector
                value={visibility}
                onChange={(value) => setValue('visibility', value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2">
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
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


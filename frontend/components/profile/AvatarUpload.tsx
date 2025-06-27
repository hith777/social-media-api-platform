'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { uploadAvatar } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'

interface AvatarUploadProps {
  currentAvatar?: string
  username: string
  onUploadComplete?: (avatarUrl: string) => void
}

export function AvatarUpload({
  currentAvatar,
  username,
  onUploadComplete,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setUser } = useAuthStore()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadAvatar(file)
      setPreview(null)
      
      // Update auth store user
      const { user } = useAuthStore.getState()
      if (user) {
        setUser({ ...user, avatar: result.avatar })
      }

      onUploadComplete?.(result.avatar)
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const avatarUrl = preview || currentAvatar

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border-2 border-border">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />
          <label htmlFor="avatar-upload">
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={isUploading}
            >
              <span>Choose Image</span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or GIF. Max 5MB
          </p>
        </div>
      </div>

      {preview && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}


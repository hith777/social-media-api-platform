'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { User } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError, FormFieldWrapper } from '@/components/ui/form-error'
import { updateProfile } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'

const updateProfileSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
})

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

interface EditProfileDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (user: User) => void
}

export function EditProfileDialog({
  user,
  open,
  onOpenChange,
  onUpdate,
}: EditProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUser: setAuthUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      bio: user.bio || '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
      })
      setError(null)
    }
  }, [open, user, reset])

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedUser = await updateProfile(data)
      onUpdate(updatedUser)
      setAuthUser(updatedUser)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-background rounded-lg border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        
        <FormError error={error} dismissible onDismiss={() => setError(null)} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormFieldWrapper
              label="First Name"
              error={errors.firstName}
              description="Maximum 50 characters"
            >
              <Input
                id="firstName"
                aria-invalid={!!errors.firstName}
                {...register('firstName')}
              />
            </FormFieldWrapper>
            <FormFieldWrapper
              label="Last Name"
              error={errors.lastName}
              description="Maximum 50 characters"
            >
              <Input
                id="lastName"
                aria-invalid={!!errors.lastName}
                {...register('lastName')}
              />
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper
            label="Bio"
            error={errors.bio}
            description={`${watch('bio')?.length || 0} / 500 characters`}
          >
            <textarea
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!errors.bio}
              {...register('bio')}
              maxLength={500}
            />
          </FormFieldWrapper>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


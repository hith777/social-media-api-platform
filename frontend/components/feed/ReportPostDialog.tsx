'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { reportPost } from '@/api/post'
import { showToast } from '@/utils/toast'
import { Flag } from 'lucide-react'

const reportReasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'violence', label: 'Violence or Dangerous Content' },
  { value: 'nudity', label: 'Nudity or Sexual Content' },
  { value: 'false_information', label: 'False Information' },
  { value: 'intellectual_property', label: 'Intellectual Property Violation' },
  { value: 'other', label: 'Other' },
]

const reportSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
})

type ReportFormData = z.infer<typeof reportSchema>

interface ReportPostDialogProps {
  postId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReportPostDialog({
  postId,
  open,
  onOpenChange,
  onSuccess,
}: ReportPostDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: undefined,
      description: '',
    },
  })

  const reason = watch('reason')

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true)
    try {
      await reportPost(postId, {
        reason: data.reason,
        description: data.description || undefined,
      })
      showToast.success('Report submitted', 'Thank you for reporting. We will review this post.')
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      showToast.error('Failed to submit report', error.message || 'Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report Post
          </DialogTitle>
          <DialogDescription>
            Help us understand the problem. Please select a reason and provide additional details if
            needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Select
              value={reason || ''}
              onValueChange={(value) => setValue('reason', value)}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about why you're reporting this post..."
              {...register('description')}
              rows={4}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {watch('description')?.length || 0} / 1000 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !reason}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


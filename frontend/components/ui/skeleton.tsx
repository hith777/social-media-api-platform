'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'text'
  lines?: number
}

export function Skeleton({ className, variant = 'default', lines = 1 }: SkeletonProps) {
  if (variant === 'circular') {
    return (
      <div
        className={cn(
          'animate-pulse rounded-full bg-muted',
          className || 'h-12 w-12'
        )}
      />
    )
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse rounded bg-muted',
              i === lines - 1 ? 'w-3/4' : 'w-full',
              className || 'h-4'
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'animate-pulse rounded bg-muted',
        className || 'h-4 w-full'
      )}
    />
  )
}

interface PostCardSkeletonProps {
  className?: string
}

export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
      <Skeleton className="h-48 w-full rounded-md" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

interface UserCardSkeletonProps {
  className?: string
  variant?: 'default' | 'compact'
}

export function UserCardSkeleton({ className, variant = 'default' }: UserCardSkeletonProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3', className)}>
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton variant="text" lines={2} className="h-3" />
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

interface CommentSkeletonProps {
  className?: string
  hasReplies?: boolean
}

export function CommentSkeleton({ className, hasReplies = false }: CommentSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="h-8 w-8" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton variant="text" lines={2} className="h-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
      {hasReplies && (
        <div className="ml-11 space-y-3 pl-4 border-l-2">
          <CommentSkeleton hasReplies={false} />
        </div>
      )}
    </div>
  )
}

interface NotificationSkeletonProps {
  className?: string
}

export function NotificationSkeleton({ className }: NotificationSkeletonProps) {
  return (
    <div className={cn('flex items-start gap-3 p-4 border-b', className)}>
      <Skeleton variant="circular" className="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-2 w-2 rounded-full" />
    </div>
  )
}


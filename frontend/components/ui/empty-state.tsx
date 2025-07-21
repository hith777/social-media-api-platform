'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    icon: 'h-8 w-8',
    title: 'text-base',
    description: 'text-sm',
    padding: 'py-8',
  },
  md: {
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm',
    padding: 'py-12',
  },
  lg: {
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base',
    padding: 'py-16',
  },
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClass = sizeClasses[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClass.padding,
        className
      )}
    >
      {icon && (
        <div className={cn('text-muted-foreground mb-4', sizeClass.icon)}>{icon}</div>
      )}
      <h3 className={cn('font-semibold text-foreground mb-2', sizeClass.title)}>{title}</h3>
      {description && (
        <p className={cn('text-muted-foreground max-w-md mb-6', sizeClass.description)}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}


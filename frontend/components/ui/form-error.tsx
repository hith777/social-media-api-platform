'use client'

import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FormErrorProps {
  error?: string | null
  className?: string
  dismissible?: boolean
  onDismiss?: () => void
}

export function FormError({ error, className, dismissible = false, onDismiss }: FormErrorProps) {
  if (!error) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{error}</div>
      {dismissible && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 text-destructive hover:text-destructive"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

interface FieldErrorProps {
  error?: string | { message?: string }
  className?: string
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) {
    return null
  }

  const errorMessage = typeof error === 'string' ? error : error.message

  if (!errorMessage) {
    return null
  }

  return (
    <p
      className={cn('text-sm text-destructive mt-1.5 flex items-center gap-1.5', className)}
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{errorMessage}</span>
    </p>
  )
}

interface FormFieldWrapperProps {
  label?: string
  required?: boolean
  error?: string | { message?: string }
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormFieldWrapper({
  label,
  required = false,
  error,
  description,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      <FieldError error={error} />
    </div>
  )
}


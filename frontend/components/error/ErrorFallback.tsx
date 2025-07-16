'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
          <Button onClick={resetErrorBoundary} variant="outline">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


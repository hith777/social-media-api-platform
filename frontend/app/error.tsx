'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { getErrorMessage } from '@/utils/errorUtils'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const errorMessage = getErrorMessage(error, 'Something went wrong!')

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="rounded-md bg-muted p-3 text-xs">
              <summary className="cursor-pointer font-medium mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="overflow-auto whitespace-pre-wrap">
                {error.stack || error.toString()}
              </pre>
              {error.digest && (
                <p className="mt-2 text-xs">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


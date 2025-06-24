'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyEmail } from '@/api/auth'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing')
      return
    }

    const verify = async () => {
      try {
        await verifyEmail({ token })
        setStatus('success')
        setMessage('Email verified successfully! You can now login.')
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || 'Email verification failed. The link may have expired.')
      }
    }

    verify()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Verifying your email</h1>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {status === 'success' ? 'Email Verified!' : 'Verification Failed'}
          </h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {status === 'success' && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
            <p>Your email has been successfully verified. You can now log in to your account.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            <p>{message}</p>
            <p className="mt-2">You can request a new verification email from your account settings.</p>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Go to Login
          </Button>
          {status === 'error' && (
            <Button
              variant="outline"
              onClick={() => router.push('/register')}
              className="w-full"
            >
              Back to Register
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}


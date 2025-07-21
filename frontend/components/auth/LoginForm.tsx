'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError, FormFieldWrapper } from '@/components/ui/form-error'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUser, setTokens } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await login(data)
      setUser(response.user)
      setTokens(response.accessToken, response.refreshToken)
      router.push('/feed')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormError error={error} dismissible onDismiss={() => setError(null)} />

      <FormFieldWrapper
        label="Email or Username"
        required
        error={errors.identifier}
      >
        <Input
          id="identifier"
          type="text"
          placeholder="Enter your email or username"
          aria-invalid={!!errors.identifier}
          {...register('identifier')}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Password"
        required
        error={errors.password}
      >
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
      </FormFieldWrapper>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <div className="text-center text-sm">
        <a
          href="/forgot-password"
          className="text-primary hover:underline"
        >
          Forgot your password?
        </a>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <a href="/register" className="text-primary hover:underline">
          Sign up
        </a>
      </div>
    </form>
  )
}


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
import { register } from '@/api/auth'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await register(data)
      // Redirect to login after successful registration
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormError error={error} dismissible onDismiss={() => setError(null)} />

      <div className="grid grid-cols-2 gap-4">
        <FormFieldWrapper
          label="First Name"
          error={errors.firstName}
          description="Optional"
        >
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            aria-invalid={!!errors.firstName}
            {...registerField('firstName')}
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Last Name"
          error={errors.lastName}
          description="Optional"
        >
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            aria-invalid={!!errors.lastName}
            {...registerField('lastName')}
          />
        </FormFieldWrapper>
      </div>

      <FormFieldWrapper
        label="Email"
        required
        error={errors.email}
        description="We'll never share your email with anyone else"
      >
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          aria-invalid={!!errors.email}
          {...registerField('email')}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Username"
        required
        error={errors.username}
        description="3-20 characters, letters, numbers, and underscores only"
      >
        <Input
          id="username"
          type="text"
          placeholder="johndoe"
          aria-invalid={!!errors.username}
          {...registerField('username')}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Password"
        required
        error={errors.password}
        description="At least 8 characters with uppercase, lowercase, and number"
      >
        <Input
          id="password"
          type="password"
          placeholder="Enter a strong password"
          aria-invalid={!!errors.password}
          {...registerField('password')}
        />
      </FormFieldWrapper>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="text-primary hover:underline">
          Sign in
        </a>
      </div>
    </form>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getProfile } from '@/api/user'
import type { User } from '@/types/api'
import { ProfileHeader } from './ProfileHeader'
import { ProfileTabs } from './ProfileTabs'
import { Container } from '@/components/layout'

export function ProfilePage() {
  const { user: authUser } = useAuthStore()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const profile = await getProfile()
        setUser(profile)
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No profile found</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="space-y-6 py-6">
        <ProfileHeader user={user} onUpdate={setUser} />
        <ProfileTabs user={user} />
      </div>
    </Container>
  )
}


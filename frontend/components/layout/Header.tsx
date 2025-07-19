'use client'

import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/search/SearchBar'
import { Navbar } from './Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { LazyImage } from '@/components/ui/lazy-image'

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2 font-bold text-xl">
            <span>Social</span>
          </Link>

          {/* Search Bar - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Navbar className="hidden lg:flex" />

            {/* User Menu */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
                {user.avatar ? (
                  <LazyImage
                    src={user.avatar}
                    alt={user.username}
                    width={32}
                    height={32}
                    className="rounded-full"
                    priority
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium">
                  {user.displayName || user.username}
                </span>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}


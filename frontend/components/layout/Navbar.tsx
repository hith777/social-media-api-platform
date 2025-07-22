'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Home, User, Search, Bell, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { NotificationBell } from '@/components/notifications/NotificationBell'

const navItems = [
  {
    label: 'Feed',
    href: '/feed',
    icon: Home,
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
]

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()

  return (
    <nav role="navigation" aria-label="Main navigation" className={cn('flex items-center gap-1', className)}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

        if (item.href === '/notifications') {
          return <NotificationBell key={item.href} />
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        )
      })}

      {user && (
        <Link
          href={`/profile/${user.id}`}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname?.startsWith(`/profile/${user.id}`)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <User className="h-5 w-5" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      )}
    </nav>
  )
}


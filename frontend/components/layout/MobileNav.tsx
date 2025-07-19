'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Home, User, Search, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { NotificationBell } from '@/components/notifications/NotificationBell'

const mobileNavItems = [
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
    isNotification: true,
  },
  {
    label: 'Profile',
    href: (userId: string) => `/profile/${userId}`,
    icon: User,
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const href = typeof item.href === 'function' ? item.href(user.id) : item.href
          const isActive =
            pathname === href ||
            (typeof item.href === 'function' && pathname?.startsWith(href))

          if (item.isNotification) {
            return (
              <div key="notifications" className="flex-1 flex items-center justify-center">
                <NotificationBell />
              </div>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


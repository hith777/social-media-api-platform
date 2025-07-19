'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Home,
  User,
  Search,
  Bell,
  Settings,
  Users,
  TrendingUp,
  Bookmark,
  HelpCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

const mainNavItems = [
  {
    label: 'Feed',
    href: '/feed',
    icon: Home,
    description: 'Your personalized feed',
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
    description: 'Search posts and users',
  },
  {
    label: 'Trending',
    href: '/search?trending=true',
    icon: TrendingUp,
    description: 'Trending posts',
  },
]

const profileNavItems = [
  {
    label: 'My Profile',
    href: (userId: string) => `/profile/${userId}`,
    icon: User,
  },
  {
    label: 'Followers',
    href: (userId: string) => `/profile/${userId}/followers`,
    icon: Users,
  },
  {
    label: 'Following',
    href: (userId: string) => `/profile/${userId}/following`,
    icon: Users,
  },
]

const otherNavItems = [
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    label: 'Help',
    href: '/help',
    icon: HelpCircle,
  },
]

interface NavigationMenuProps {
  variant?: 'desktop' | 'mobile'
  className?: string
}

export function NavigationMenu({ variant = 'desktop', className }: NavigationMenuProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()

  if (variant === 'mobile') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Navigation</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn('flex items-center gap-2', isActive && 'bg-accent')}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            )
          })}
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Profile</DropdownMenuLabel>
              {profileNavItems.map((item) => {
                const Icon = item.icon
                const href = item.href(user.id)
                const isActive = pathname === href
                return (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link
                      href={href}
                      className={cn('flex items-center gap-2', isActive && 'bg-accent')}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
          <DropdownMenuSeparator />
          {otherNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn('flex items-center gap-2', isActive && 'bg-accent')}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {mainNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <div className="flex flex-col">
              <span>{item.label}</span>
              <span className="text-xs opacity-70">{item.description}</span>
            </div>
          </Link>
        )
      })}

      {user && (
        <>
          <div className="my-2 border-t" />
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Profile
          </div>
          {profileNavItems.map((item) => {
            const Icon = item.icon
            const href = item.href(user.id)
            const isActive = pathname === href || pathname?.startsWith(href + '/')
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </>
      )}

      <div className="my-2 border-t" />
      {otherNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}


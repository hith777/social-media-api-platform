'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { NavigationMenu } from './NavigationMenu'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LazyImage } from '@/components/ui/lazy-image'
import Link from 'next/link'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function Sidebar({ isOpen = false, onClose, className }: SidebarProps) {
  const { user } = useAuthStore()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between border-b p-4 lg:hidden">
            <h2 className="font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          {/* User Info */}
          {user && (
            <div className="border-b p-4">
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                {user.avatar ? (
                  <LazyImage
                    src={user.avatar}
                    alt={user.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                    priority
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-4">
            <NavigationMenu variant="desktop" />
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} Social Media Platform
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}


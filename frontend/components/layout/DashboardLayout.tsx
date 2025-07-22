'use client'

import { ReactNode, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main id="main-content" role="main" className="flex-1 lg:ml-64 transition-all duration-300">
          {/* Mobile menu button */}
          <div className="lg:hidden fixed top-20 left-4 z-30">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="bg-background shadow-md"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </div>
          <div className="min-h-[calc(100vh-4rem)] pb-16 lg:pb-0">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}


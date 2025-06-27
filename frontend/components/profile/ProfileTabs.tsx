'use client'

import { useState } from 'react'
import type { User } from '@/types/api'
import { Button } from '@/components/ui/button'

interface ProfileTabsProps {
  user: User
}

export function ProfileTabs({ user }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts')

  return (
    <div className="space-y-4">
      <div className="border-b">
        <div className="flex gap-4">
          <Button
            variant={activeTab === 'posts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </Button>
          <Button
            variant={activeTab === 'followers' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('followers')}
          >
            Followers
          </Button>
          <Button
            variant={activeTab === 'following' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('following')}
          >
            Following
          </Button>
        </div>
      </div>

      <div className="min-h-[200px]">
        {activeTab === 'posts' && (
          <div className="text-center py-8 text-muted-foreground">
            Posts will be displayed here
          </div>
        )}
        {activeTab === 'followers' && (
          <div className="text-center py-8 text-muted-foreground">
            Followers will be displayed here
          </div>
        )}
        {activeTab === 'following' && (
          <div className="text-center py-8 text-muted-foreground">
            Following will be displayed here
          </div>
        )}
      </div>
    </div>
  )
}


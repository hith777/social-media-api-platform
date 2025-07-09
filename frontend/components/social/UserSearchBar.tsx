'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { searchUsers } from '@/api/user'
import type { User } from '@/types/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Loader2 } from 'lucide-react'
import { UserCard } from './UserCard'

interface UserSearchBarProps {
  onUserSelect?: (user: User) => void
  placeholder?: string
  showResults?: boolean
  className?: string
}

export function UserSearchBar({
  onUserSelect,
  placeholder = 'Search users...',
  showResults = true,
  className,
}: UserSearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await searchUsers({ query: query.trim(), page: 1, limit: 10 })
        setResults(response.data)
        setShowDropdown(true)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const handleUserClick = (user: User) => {
    if (onUserSelect) {
      onUserSelect(user)
    } else {
      router.push(`/profile/${user.id}`)
    }
    setShowDropdown(false)
    setQuery('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=users`)
      setShowDropdown(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setQuery('')
              setResults([])
              setShowDropdown(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {showResults && showDropdown && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-background border rounded-md shadow-lg max-h-[400px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2 space-y-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="cursor-pointer hover:bg-muted rounded-md p-2 transition-colors"
                >
                  <UserCard user={user} showFollowButton={false} />
                </div>
              ))}
              {results.length >= 10 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSubmit}
                >
                  View all results
                </Button>
              )}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}


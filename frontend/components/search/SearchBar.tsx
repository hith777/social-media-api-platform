'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchUsers, searchPosts } from '@/api/search'
import type { User, Post } from '@/types/api'
import { trackInteraction } from '@/utils/analytics'
import Link from 'next/link'
import Image from 'next/image'

interface SearchBarProps {
  onSelect?: (type: 'user' | 'post', item: User | Post) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ onSelect, placeholder = 'Search...', className }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Debounce search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.trim().length < 2) {
      setUsers([])
      setPosts([])
      setIsOpen(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const [usersResult, postsResult] = await Promise.all([
          searchUsers({ q: query, limit: 5 }),
          searchPosts({ q: query, limit: 5 }),
        ])
        setUsers(usersResult.data)
        setPosts(postsResult.data)
        setIsOpen(true)
        
        // Track search
        const totalResults = usersResult.data.length + postsResult.data.length
        trackInteraction.search(query, totalResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      const totalItems = users.length + posts.length
      if (totalItems === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0) {
            handleSelect(selectedIndex)
          } else {
            handleSearch()
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, selectedIndex, users, posts])

  const handleSelect = (index: number) => {
    if (index < users.length) {
      const user = users[index]
      if (onSelect) {
        onSelect('user', user)
      } else {
        router.push(`/profile/${user.id}`)
      }
    } else {
      const post = posts[index - users.length]
      if (onSelect) {
        onSelect('post', post)
      } else {
        router.push(`/posts/${post.id}`)
      }
    }
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(-1)
  }

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery('')
    }
  }

  const handleClear = () => {
    setQuery('')
    setUsers([])
    setPosts([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const hasResults = users.length > 0 || posts.length > 0
  const showDropdown = isOpen && (isLoading || hasResults || query.trim().length >= 2)

  return (
    <div ref={searchRef} className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true)
            }
          }}
          aria-label="Search for users and posts"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
          className="pl-10 pr-10"
        />
        {query && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClear}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {showDropdown && (
        <div 
          id="search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute top-full z-50 mt-2 w-full max-w-[calc(100vw-2rem)] sm:max-w-md rounded-lg border bg-popover shadow-lg"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              <p className="mt-2">Searching...</p>
            </div>
          ) : hasResults ? (
            <div className="max-h-[400px] overflow-y-auto">
              {users.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                    Users
                  </div>
                  {users.map((user, index) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      onClick={() => {
                        setIsOpen(false)
                        setQuery('')
                      }}
                      className={`flex items-center gap-3 px-3 py-2 hover:bg-muted ${
                        selectedIndex === index ? 'bg-muted' : ''
                      }`}
                    >
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <span className="text-sm font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {posts.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                    Posts
                  </div>
                  {posts.map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      onClick={() => {
                        setIsOpen(false)
                        setQuery('')
                      }}
                      className={`flex items-start gap-3 px-3 py-2 hover:bg-muted ${
                        selectedIndex === users.length + index ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{post.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {post.user.displayName || post.user.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={handleSearch}
                >
                  <Search className="mr-2 h-4 w-4" />
                  View all results for &quot;{query}&quot;
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>No results found</p>
              <Button
                variant="ghost"
                className="mt-2 text-sm"
                onClick={handleSearch}
              >
                Search for &quot;{query}&quot;
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


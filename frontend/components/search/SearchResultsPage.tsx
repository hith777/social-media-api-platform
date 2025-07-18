'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { searchPosts, searchUsers } from '@/api/search'
import type { Post, User, PaginatedResponse } from '@/types/api'
import { PostCard } from '@/components/feed/PostCard'
import { UserCard } from '@/components/social/UserCard'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

export function SearchResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [postsPagination, setPostsPagination] = useState<PaginatedResponse<Post>['pagination'] | null>(null)
  const [usersPagination, setUsersPagination] = useState<PaginatedResponse<User>['pagination'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [postSortBy, setPostSortBy] = useState<'newest' | 'oldest' | 'popular' | 'relevance'>('newest')
  const [postVisibility, setPostVisibility] = useState<'public' | 'private' | 'friends' | 'all'>('all')
  const [userSortBy, setUserSortBy] = useState<'relevance' | 'newest' | 'oldest' | 'username'>('relevance')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  // Initial search
  useEffect(() => {
    const searchQuery = searchParams.get('q')
    if (searchQuery) {
      setQuery(searchQuery)
      performSearch(searchQuery, 'posts', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const performSearch = async (
    searchQuery: string,
    type: 'posts' | 'users',
    page = 1
  ) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      if (type === 'posts') {
        const result = await searchPosts({
          q: searchQuery,
          page,
          limit: 20,
          sortBy: postSortBy,
          visibility: postVisibility !== 'all' ? postVisibility : undefined,
        })
        if (page === 1) {
          setPosts(result.data)
        } else {
          setPosts((prev) => [...prev, ...result.data])
        }
        setPostsPagination(result.pagination)
      } else {
        const result = await searchUsers({
          q: searchQuery,
          page,
          limit: 20,
          sortBy: userSortBy,
          verifiedOnly: verifiedOnly || undefined,
        })
        if (page === 1) {
          setUsers(result.data)
        } else {
          setUsers((prev) => [...prev, ...result.data])
        }
        setUsersPagination(result.pagination)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      performSearch(query.trim(), activeTab, 1)
    }
  }

  const handleLoadMore = () => {
    if (!isLoading && query.trim()) {
      const pagination = activeTab === 'posts' ? postsPagination : usersPagination
      if (pagination && pagination.currentPage < pagination.totalPages) {
        performSearch(query.trim(), activeTab, pagination.currentPage + 1)
      }
    }
  }

  const hasNextPage =
    activeTab === 'posts'
      ? postsPagination?.currentPage && postsPagination.currentPage < postsPagination.totalPages
      : usersPagination?.currentPage && usersPagination.currentPage < usersPagination.totalPages

  const { observerTarget } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isLoading,
    onLoadMore: handleLoadMore,
  })

  // Refetch when filters change
  useEffect(() => {
    if (query.trim() && activeTab === 'posts') {
      performSearch(query.trim(), 'posts', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postSortBy, postVisibility])

  useEffect(() => {
    if (query.trim() && activeTab === 'users') {
      performSearch(query.trim(), 'users', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSortBy, verifiedOnly])

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts, users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {query.trim() && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'posts' | 'users')}>
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="posts" className="flex-1 sm:flex-initial">
                Posts {postsPagination && `(${postsPagination.total})`}
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 sm:flex-initial">
                Users {usersPagination && `(${usersPagination.total})`}
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {activeTab === 'posts' ? (
                <>
                  <Select value={postSortBy} onValueChange={(v) => setPostSortBy(v as any)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="relevance">Relevance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={postVisibility}
                    onValueChange={(v) => setPostVisibility(v as any)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="friends">Friends</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Select value={userSortBy} onValueChange={(v) => setUserSortBy(v as any)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="username">Username</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={verifiedOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                  >
                    Verified Only
                  </Button>
                </>
              )}
            </div>
          </div>

          <TabsContent value="posts" className="mt-4">
            {isLoading && posts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                {hasNextPage && (
                  <div ref={observerTarget} className="py-4 text-center">
                    {isLoading && (
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>No posts found for &quot;{query}&quot;</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            {isLoading && users.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
                {hasNextPage && (
                  <div ref={observerTarget} className="py-4 text-center col-span-full">
                    {isLoading && (
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>No users found for &quot;{query}&quot;</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!query.trim() && (
        <div className="py-12 text-center text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Enter a search query to find posts and users</p>
        </div>
      )}
    </div>
  )
}


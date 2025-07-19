'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X } from 'lucide-react'
import type { PostQueryParams } from '@/types/post'

interface PostFiltersProps {
  filters: PostQueryParams
  onFiltersChange: (filters: PostQueryParams) => void
  showSort?: boolean
  showVisibility?: boolean
  showSearch?: boolean
}

export function PostFilters({
  filters,
  onFiltersChange,
  showSort = true,
  showVisibility = true,
  showSearch = false,
}: PostFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState(filters.search || '')

  const hasActiveFilters =
    filters.sortBy !== 'newest' ||
    filters.visibility !== undefined ||
    (filters.search && filters.search.length > 0)

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sortBy: value as 'newest' | 'oldest' | 'popular',
      page: 1, // Reset to first page when filters change
    })
  }

  const handleVisibilityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      visibility: value === 'all' ? undefined : (value as 'public' | 'private' | 'friends'),
      page: 1,
    })
  }

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery !== (filters.search || '')) {
        onFiltersChange({
          ...filters,
          search: searchQuery || undefined,
          page: 1,
        })
      }
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const clearFilters = () => {
    setSearchQuery('')
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      sortBy: 'newest',
    })
  }

  return (
    <div className="space-y-4">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {showSort && (
          <Select value={filters.sortBy || 'newest'} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        )}

        {showVisibility && (
          <Select
            value={filters.visibility || 'all'}
            onValueChange={handleVisibilityChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
              <SelectItem value="private">Private Only</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
            </SelectContent>
          </Select>
        )}

        {showSearch && (
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          <Filter className="mr-2 h-4 w-4" />
          {isExpanded ? 'Less Filters' : 'More Filters'}
        </Button>
      </div>

      {/* Expanded Filters (if needed in future) */}
      {isExpanded && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Additional filter options will be available here in the future.
          </p>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {filters.sortBy && filters.sortBy !== 'newest' && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
              Sort: {filters.sortBy}
            </span>
          )}
          {filters.visibility && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
              Visibility: {filters.visibility}
            </span>
          )}
          {filters.search && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
              Search: {filters.search}
            </span>
          )}
        </div>
      )}
    </div>
  )
}


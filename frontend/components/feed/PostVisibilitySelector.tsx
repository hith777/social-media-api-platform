'use client'

import { Globe, Lock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type VisibilityOption = 'public' | 'private' | 'friends'

interface PostVisibilitySelectorProps {
  value: VisibilityOption
  onChange: (value: VisibilityOption) => void
  disabled?: boolean
}

const visibilityOptions: {
  value: VisibilityOption
  label: string
  icon: React.ReactNode
  description: string
}[] = [
  {
    value: 'public',
    label: 'Public',
    icon: <Globe className="h-4 w-4" />,
    description: 'Anyone can see this post',
  },
  {
    value: 'friends',
    label: 'Friends',
    icon: <Users className="h-4 w-4" />,
    description: 'Only people you follow can see this',
  },
  {
    value: 'private',
    label: 'Private',
    icon: <Lock className="h-4 w-4" />,
    description: 'Only you can see this post',
  },
]

export function PostVisibilitySelector({
  value,
  onChange,
  disabled = false,
}: PostVisibilitySelectorProps) {
  const selectedOption = visibilityOptions.find((opt) => opt.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          {selectedOption?.icon}
          <span>{selectedOption?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibilityOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex items-center gap-2"
          >
            {option.icon}
            <div className="flex flex-col">
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


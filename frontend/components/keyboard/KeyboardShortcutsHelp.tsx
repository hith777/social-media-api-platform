'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard, HelpCircle } from 'lucide-react'
import { useKeyboardShortcut } from '@/hooks/useKeyboardNavigation'

interface Shortcut {
  keys: string[]
  description: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Focus search' },
  { keys: ['/'], description: 'Focus search (when not typing)' },
  { keys: ['Ctrl', '1'], description: 'Go to Feed' },
  { keys: ['Ctrl', '2'], description: 'Go to Profile' },
  { keys: ['Ctrl', '3'], description: 'Go to Notifications' },
  { keys: ['Ctrl', '4'], description: 'Go to Search' },
  { keys: ['Esc'], description: 'Close dialog or go back' },
  { keys: ['↑', '↓'], description: 'Navigate search results' },
  { keys: ['Enter'], description: 'Select search result' },
  { keys: ['Tab'], description: 'Navigate between form fields' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backwards' },
]

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  // Open help with Ctrl/Cmd + ?
  useKeyboardShortcut('?', () => {
    setOpen(true)
  }, { ctrl: true })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Keyboard shortcuts (Ctrl+?)">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-xs text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">?</kbd> to open this help
        </div>
      </DialogContent>
    </Dialog>
  )
}


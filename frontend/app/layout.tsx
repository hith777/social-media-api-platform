import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { ErrorBoundaryWrapper } from '@/components/error/ErrorBoundaryWrapper'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Social Media Platform',
  description: 'A comprehensive social media platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundaryWrapper>
          {children}
          <Toaster />
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}


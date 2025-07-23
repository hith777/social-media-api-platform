import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { ErrorBoundaryWrapper } from '@/components/error/ErrorBoundaryWrapper'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { GlobalKeyboardShortcuts } from '@/components/keyboard/GlobalKeyboardShortcuts'
import { generateMetadata as generateSEOMetadata, generateWebsiteStructuredData } from '@/utils/seo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateSEOMetadata({
  title: 'Social Media Platform',
  description: 'Connect, share, and discover on our comprehensive social media platform. Share your thoughts, follow friends, and explore trending content.',
  url: '/',
  type: 'website',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const websiteStructuredData = generateWebsiteStructuredData()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>
        <ErrorBoundaryWrapper>
          <AnalyticsProvider>
            <GlobalKeyboardShortcuts />
            {children}
            <Toaster />
          </AnalyticsProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}


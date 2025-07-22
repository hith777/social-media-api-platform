/**
 * SEO utility functions for generating meta tags and structured data
 */

import type { Metadata } from 'next'

interface SEOConfig {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  siteName?: string
  locale?: string
}

/**
 * Generate metadata for Next.js pages
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title = 'Social Media Platform',
    description = 'A comprehensive social media platform',
    image,
    url,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    siteName = 'Social Media Platform',
    locale = 'en_US',
  } = config

  const fullTitle = title.includes('Social Media Platform')
    ? title
    : `${title} | Social Media Platform`

  const imageUrl = image || '/og-image.png'
  const absoluteUrl = url ? (url.startsWith('http') ? url : `https://example.com${url}`) : undefined

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: absoluteUrl,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: absoluteUrl,
    },
  }
}

/**
 * Generate JSON-LD structured data for articles/posts
 */
export function generateArticleStructuredData({
  title,
  description,
  image,
  url,
  author,
  publishedTime,
  modifiedTime,
}: {
  title: string
  description: string
  image?: string
  url: string
  author: {
    name: string
    url?: string
  }
  publishedTime: string
  modifiedTime?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || '/og-image.png',
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Social Media Platform',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

/**
 * Generate JSON-LD structured data for profiles
 */
export function generateProfileStructuredData({
  name,
  username,
  bio,
  image,
  url,
  followersCount,
  followingCount,
  postsCount,
}: {
  name: string
  username: string
  bio?: string
  image?: string
  url: string
  followersCount?: number
  followingCount?: number
  postsCount?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name,
      alternateName: username,
      description: bio,
      image: image || '/default-avatar.png',
      url,
      ...(followersCount !== undefined && {
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/FollowAction',
            userInteractionCount: followersCount,
          },
        ],
      }),
    },
  }
}

/**
 * Generate JSON-LD structured data for organization/website
 */
export function generateWebsiteStructuredData({
  name = 'Social Media Platform',
  url = 'https://example.com',
  description = 'A comprehensive social media platform',
  logo = '/logo.png',
}: {
  name?: string
  url?: string
  description?: string
  logo?: string
} = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    publisher: {
      '@type': 'Organization',
      name,
      logo: {
        '@type': 'ImageObject',
        url: logo,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}


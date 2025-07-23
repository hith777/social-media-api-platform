# Social Media Platform - Frontend

A modern, responsive social media platform built with React, Next.js, TypeScript, and shadcn/ui.

## Features

### Core Features
- **Authentication**: Login, registration, email verification, password reset
- **User Profiles**: View and edit profiles, avatar upload, follower/following management
- **Posts**: Create, edit, delete posts with text and media
- **Comments**: Nested comments with replies, like/unlike functionality
- **Social Interactions**: Follow/unfollow users, like posts and comments
- **Notifications**: Real-time notifications via WebSocket
- **Search**: Search users and posts with filters and sorting
- **Trending**: Discover trending posts based on engagement
- **Content Moderation**: Report posts, block/unblock users

### Technical Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Performance**: Code splitting, lazy loading, image optimization
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **SEO**: Meta tags, Open Graph, structured data
- **Analytics**: Performance monitoring and user interaction tracking
- **Error Handling**: Comprehensive error boundaries and error tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Date Formatting**: date-fns
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see main README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Social Media Platform
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Optional: Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id

# Optional: Error Tracking
NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT=your-endpoint
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── login/            # Authentication pages
│   └── register/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── feed/            # Post-related components
│   ├── comments/        # Comment components
│   ├── profile/          # Profile components
│   ├── social/          # Social interaction components
│   ├── search/          # Search components
│   ├── notifications/   # Notification components
│   ├── layout/          # Layout components
│   ├── error/           # Error handling components
│   ├── analytics/       # Analytics components
│   └── ui/              # shadcn/ui components
├── api/                 # API client and functions
├── hooks/               # Custom React hooks
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── config/            # Configuration files
└── lib/               # Library utilities
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Components

### Authentication
- `LoginForm` - User login
- `RegisterForm` - User registration
- `ProtectedRoute` - Route protection wrapper

### Feed
- `FeedPage` - Main feed with posts
- `PostCard` - Individual post display
- `CreatePostForm` - Post creation form
- `PostDetailPage` - Post detail with comments

### Profile
- `ProfilePage` - User profile view
- `ProfileHeader` - Profile header with stats
- `EditProfileDialog` - Profile editing

### Social
- `FollowButton` - Follow/unfollow button
- `BlockButton` - Block/unblock button
- `UserCard` - User display card

### Search
- `SearchBar` - Global search with autocomplete
- `SearchResultsPage` - Search results with filters
- `TrendingPosts` - Trending posts section

### Notifications
- `NotificationBell` - Notification dropdown
- `NotificationsPage` - Full notifications page

## State Management

### Zustand Stores
- `authStore` - Authentication state (persisted)
- `userStore` - User profile data
- `notificationStore` - Notifications (persisted)

## API Integration

All API calls are made through:
- `api/client.ts` - Axios instance with interceptors
- Individual API modules in `api/` directory
- Automatic token refresh on 401 errors

## Performance Optimizations

- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Optimization**: Webpack chunk splitting
- **Caching**: Browser caching for static assets
- **Lazy Loading**: Components loaded on demand

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Focus management in modals
- Skip to main content link

## SEO

- Meta tags for all pages
- Open Graph tags for social sharing
- Twitter Card support
- Structured data (JSON-LD)
- Canonical URLs

## Analytics

- Google Analytics 4 integration
- Custom event tracking
- Performance metrics
- Error tracking
- User interaction tracking

## Environment Variables

See `.env.local.example` for all available environment variables.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add JSDoc comments for functions
4. Write tests for new features
5. Update documentation

## License

See main project README for license information.

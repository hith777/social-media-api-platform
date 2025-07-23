# Frontend Architecture

## Overview

The frontend is built with Next.js 14 using the App Router, providing server-side rendering, static generation, and optimal performance out of the box.

## Architecture Patterns

### Component Structure

```
Component Hierarchy:
├── Layout Components (Header, Sidebar, DashboardLayout)
├── Page Components (FeedPage, ProfilePage, etc.)
├── Feature Components (PostCard, CommentList, etc.)
└── UI Components (Button, Input, Card, etc.)
```

### State Management

**Zustand Stores:**
- `authStore`: Authentication state (persisted to localStorage)
- `userStore`: Current user profile data
- `notificationStore`: Notifications list (persisted to localStorage)

**Local State:**
- Component-level state for UI interactions
- Form state managed by React Hook Form
- Server state fetched via API calls

### Data Flow

1. **User Action** → Component Event Handler
2. **API Call** → Axios Client (with interceptors)
3. **Response** → Update Zustand Store or Local State
4. **UI Update** → React Re-render

### Routing

- **App Router**: Next.js 14 App Router
- **Route Groups**: `(dashboard)` for protected routes
- **Dynamic Routes**: `[id]` for posts and profiles
- **Middleware**: Route protection and redirects

### API Integration

**Axios Instance:**
- Base URL configuration
- Request interceptors (add auth token)
- Response interceptors (handle 401, refresh token)
- Error handling

**API Modules:**
- `api/auth.ts` - Authentication endpoints
- `api/user.ts` - User endpoints
- `api/post.ts` - Post endpoints
- `api/comment.ts` - Comment endpoints
- `api/social.ts` - Social interaction endpoints
- `api/notification.ts` - Notification endpoints
- `api/search.ts` - Search endpoints

### Real-time Communication

**Socket.IO Client:**
- Connection managed by `lib/socket.ts`
- `useSocket` hook for component integration
- Automatic reconnection on disconnect
- Event listeners for notifications

### Performance Optimizations

1. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting (automatic)

2. **Image Optimization**
   - Next.js Image component
   - Lazy loading with Intersection Observer
   - WebP/AVIF format support

3. **Bundle Optimization**
   - Webpack chunk splitting
   - Tree shaking
   - Package import optimization

4. **Caching**
   - Browser caching for static assets
   - Zustand persist middleware for state

### Error Handling

**Error Boundaries:**
- `ErrorBoundary` component for React errors
- `ErrorFallback` for error display
- `ErrorBoundaryWrapper` for global error handling

**Error Tracking:**
- `useErrorHandler` hook
- Analytics error tracking
- Console logging in development

### Accessibility

**ARIA Support:**
- Labels on all interactive elements
- Roles and properties for screen readers
- Keyboard navigation support

**Keyboard Navigation:**
- `useKeyboardNavigation` hook
- `useKeyboardShortcut` hook
- Focus trap for modals

### SEO

**Meta Tags:**
- Dynamic metadata generation
- Open Graph tags
- Twitter Cards

**Structured Data:**
- JSON-LD for articles
- JSON-LD for profiles
- Website schema

### Analytics

**Tracking:**
- Google Analytics 4 integration
- Custom event tracking
- Performance metrics
- Error tracking

**Privacy:**
- Respects `NEXT_PUBLIC_ENABLE_ANALYTICS` flag
- No tracking in development by default

## File Organization

### Components

Components are organized by feature:
- `auth/` - Authentication components
- `feed/` - Post-related components
- `comments/` - Comment components
- `profile/` - Profile components
- `social/` - Social interaction components
- `search/` - Search components
- `notifications/` - Notification components
- `layout/` - Layout components
- `ui/` - Reusable UI components (shadcn/ui)

### Utilities

- `utils/analytics.ts` - Analytics tracking
- `utils/accessibility.ts` - Accessibility helpers
- `utils/seo.ts` - SEO utilities
- `utils/tokenManager.ts` - Token management
- `utils/errorUtils.ts` - Error handling utilities

### Hooks

- `hooks/useAnalytics.ts` - Analytics hooks
- `hooks/useSocket.ts` - Socket.IO hook
- `hooks/useInfiniteScroll.ts` - Infinite scroll
- `hooks/useKeyboardNavigation.ts` - Keyboard navigation
- `hooks/useErrorHandler.ts` - Error handling
- `hooks/useRequireAuth.ts` - Auth requirement

## Best Practices

1. **Type Safety**: All components and functions are typed
2. **Code Splitting**: Heavy components are lazy-loaded
3. **Error Handling**: All API calls have error handling
4. **Accessibility**: ARIA labels on all interactive elements
5. **Performance**: Optimize images and bundle size
6. **SEO**: Meta tags and structured data
7. **Analytics**: Track important user interactions

## Development Guidelines

1. Use TypeScript for all new code
2. Follow the existing component structure
3. Add JSDoc comments for functions
4. Use Zustand for global state
5. Use React Hook Form for forms
6. Implement proper error handling
7. Add accessibility attributes
8. Optimize for performance


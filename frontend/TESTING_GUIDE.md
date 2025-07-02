# Frontend Testing Guide

## Overview
This guide covers all features built up to Phase 9 (Comments - in progress). Use this to manually test the application.

## Prerequisites
1. Backend API should be running on `http://localhost:3000`
2. Frontend should be running on `http://localhost:3001` (or configured port)
3. Set up `.env.local` with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_WS_URL=http://localhost:3000
   ```

## Phase 1: Setup & Configuration ✅

### Features Built:
- ✅ Next.js 14 with TypeScript
- ✅ Tailwind CSS configuration
- ✅ shadcn/ui base components (Button, Input, Label, Card, Dialog, Dropdown)
- ✅ Zustand state management
- ✅ Axios API client with interceptors
- ✅ Environment configuration
- ✅ Path aliases (@/ imports)
- ✅ Base layout components

### Test:
1. Verify the app starts without errors
2. Check that Tailwind styles are applied
3. Verify TypeScript compilation works

## Phase 2: Authentication ✅

### Features Built:

#### Auth API:
- ✅ Login API
- ✅ Register API
- ✅ Token refresh API
- ✅ Password reset API
- ✅ Email verification API

#### Auth UI:
- ✅ Login page (`/login`)
- ✅ Register page (`/register`)
- ✅ Forgot password page (`/forgot-password`)
- ✅ Reset password page (`/reset-password`)
- ✅ Email verification page (`/verify-email`)

#### Auth Logic:
- ✅ Zustand auth store with login/register actions
- ✅ Token management (localStorage with expiry checking)
- ✅ Protected route middleware
- ✅ Client-side auth protection hooks

### Test Scenarios:

#### Registration Flow:
1. Navigate to `/register`
2. Fill in: email, username, password, firstName (optional), lastName (optional)
3. Submit form
4. Should redirect to `/login?registered=true`
5. Check email for verification link (if email service configured)

#### Login Flow:
1. Navigate to `/login`
2. Enter email/username and password
3. Submit form
4. Should redirect to `/feed`
5. Check that auth state is persisted (refresh page, should stay logged in)

#### Password Reset Flow:
1. Navigate to `/forgot-password`
2. Enter email address
3. Submit form
4. Should show success message
5. Check email for reset link
6. Click reset link (should go to `/reset-password?token=...`)
7. Enter new password and confirm
8. Should redirect to login

#### Email Verification:
1. Click verification link from email
2. Should navigate to `/verify-email?token=...`
3. Should show success/error message
4. Should redirect to login on success

#### Token Refresh:
1. Login to the app
2. Wait for token to expire (or manually expire in localStorage)
3. Make an API request
4. Should automatically refresh token and retry request

#### Protected Routes:
1. While logged out, try to access `/feed` or `/profile`
2. Should redirect to `/login` with redirect parameter
3. After login, should redirect back to original page

## Phase 3: User Profile ✅

### Features Built:

#### Profile API:
- ✅ Get current user profile
- ✅ Update profile
- ✅ Upload avatar
- ✅ Get user profile by ID
- ✅ Search users
- ✅ Get followers/following lists

#### Profile UI:
- ✅ Profile page (`/profile`)
- ✅ Profile header with avatar, stats, edit button
- ✅ Edit profile dialog
- ✅ Avatar upload component with preview
- ✅ Profile tabs (Posts, Followers, Following - UI only)

#### Profile Store:
- ✅ Zustand user store with profile management

### Test Scenarios:

#### View Own Profile:
1. Navigate to `/profile`
2. Should display:
   - Avatar (or initial if no avatar)
   - Display name or username
   - Bio (if set)
   - Posts count, Followers count, Following count
   - Edit Profile button

#### Edit Profile:
1. Click "Edit Profile" button
2. Update firstName, lastName, bio
3. Submit form
4. Should update profile and close dialog
5. Verify changes are reflected immediately

#### Upload Avatar:
1. Click "Change Avatar" button
2. Select an image file (JPG, PNG, GIF, max 5MB)
3. Should show preview
4. Click "Upload"
5. Should update avatar and close dialog
6. Verify new avatar appears in profile header

#### View Other User Profile:
1. Navigate to `/profile/[userId]` (replace with actual user ID)
2. Should display user's profile information
3. Should not show edit buttons (only for own profile)

## Phase 4: Posts & Feed ✅

### Features Built:

#### Post API:
- ✅ Create post (with media upload)
- ✅ Get posts (with filtering/sorting)
- ✅ Get single post
- ✅ Update post
- ✅ Delete post
- ✅ Get feed (posts from followed users)
- ✅ Get user posts
- ✅ Report post

#### Feed UI:
- ✅ Feed page (`/feed`)
- ✅ Post card component
- ✅ Infinite scroll
- ✅ Post creation form
- ✅ Post detail page (`/posts/[id]`)
- ✅ Post visibility selector

#### Post Interactions:
- ✅ Like/unlike posts (with optimistic updates)
- ✅ Post actions menu (Edit, Delete, Report)
- ✅ Visibility settings UI

### Test Scenarios:

#### View Feed:
1. Navigate to `/feed`
2. Should display list of posts from followed users
3. Scroll down - should automatically load more posts (infinite scroll)
4. Each post should show:
   - User avatar and name
   - Post content
   - Media images (if any)
   - Like count, Comment count
   - Like, Comment, Share buttons
   - More options menu

#### Create Post:
1. On feed page, find/create post creation form
2. Enter post content
3. Optionally add images (click "Add Photos", select files)
4. Select visibility (Public, Friends, Private)
5. Click "Post"
6. Should create post and refresh feed
7. New post should appear at top of feed

#### Like/Unlike Post:
1. Click heart icon on any post
2. Should immediately update (optimistic update):
   - Heart fills with red color
   - Like count increases
3. Click again to unlike
4. Should revert changes

#### Post Actions (Own Post):
1. Click three dots menu on your own post
2. Should show:
   - Edit option
   - Delete option
3. Click "Delete"
4. Should show confirmation dialog
5. Confirm deletion
6. Post should be removed from feed

#### Post Actions (Other User's Post):
1. Click three dots menu on someone else's post
2. Should show:
   - Report option only
3. Click "Report"
4. Should trigger report functionality (if implemented)

#### View Post Detail:
1. Click on a post or navigate to `/posts/[postId]`
2. Should display full post details
3. Should show back button
4. Should display comments section (placeholder for now)

#### Post Visibility:
1. When creating post, click visibility selector
2. Should show dropdown with:
   - Public (Globe icon) - "Anyone can see this post"
   - Friends (Users icon) - "Only people you follow can see this"
   - Private (Lock icon) - "Only you can see this post"
3. Select different visibility
4. Create post
5. Verify visibility setting is applied

## Phase 5: Comments (In Progress) ✅

### Features Built:

#### Comment API:
- ✅ Create comment
- ✅ Get post comments
- ✅ Update comment
- ✅ Delete comment
- ✅ Toggle comment like
- ✅ Get comment replies

#### Comment UI:
- ✅ Comment list component (basic structure)
- ⏳ Comment item component (next)
- ⏳ Comment form (next)
- ⏳ Nested replies display (next)

### Test Scenarios:

#### View Comments:
1. Navigate to a post detail page
2. Should display comments section
3. Should show "No comments yet" if no comments
4. Should list all comments if they exist

## Current Status

### Completed Phases:
1. ✅ Setup & Configuration
2. ✅ Authentication (API, UI, Logic)
3. ✅ User Profile
4. ✅ Posts & Feed
5. ⏳ Comments (API done, UI in progress)

### Next Steps:
- Complete comment UI components
- Add social interactions (follow/unfollow)
- Add notifications
- Add search functionality
- Add real-time features (WebSocket)

## Common Issues to Check:

1. **CORS Errors**: Ensure backend allows frontend origin
2. **Token Issues**: Check localStorage for `auth-storage` key
3. **Image Loading**: Verify image URLs are correct and backend serves them
4. **API Errors**: Check browser console and network tab
5. **TypeScript Errors**: Run `npm run build` to check for type errors

## Manual Testing Checklist

- [ ] App starts without errors
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can view own profile
- [ ] Can edit profile
- [ ] Can upload avatar
- [ ] Can view feed
- [ ] Can create post
- [ ] Can like/unlike posts
- [ ] Can delete own posts
- [ ] Can view post details
- [ ] Token refresh works automatically
- [ ] Protected routes redirect to login
- [ ] Auth state persists on page refresh


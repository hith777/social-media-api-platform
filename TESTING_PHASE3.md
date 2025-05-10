# Phase 3: Content Service - Posts - Testing Guide

This guide covers all Phase 3 features for testing the Posts API endpoints.

## Prerequisites

1. Server is running: `npm run dev`
2. Database migrations are applied: `npm run prisma:migrate`
3. You have at least 2 registered users (for testing visibility and interactions)
4. Redis is running (if using caching)

## Base URL
```
http://localhost:3000
```

## Test Users Setup

Create at least 2 users for comprehensive testing:

**User 1:**
- Email: `testuser1@example.com`
- Username: `testuser1`
- Password: `Test123!@#`

**User 2:**
- Email: `testuser2@example.com`
- Username: `testuser2`
- Password: `Test123!@#`

---

## 1. Post Creation

### 1.1 Create Post (Text Only)
**Endpoint:** `POST /api/posts`  
**Auth:** Required

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is my first post! Testing the social media API.",
    "visibility": "public"
  }'
```

**Expected Response:**
- Status: `201 Created`
- Contains: `id`, `content`, `author`, `visibility`, `mediaUrls`, `createdAt`
- Author info includes: `id`, `username`, `firstName`, `lastName`, `avatar`

### 1.2 Create Post with Media URLs
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out these images!",
    "mediaUrls": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "visibility": "public"
  }'
```

### 1.3 Create Post with File Upload
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "content=Post with uploaded image" \
  -F "media=@/path/to/image1.jpg" \
  -F "media=@/path/to/image2.jpg" \
  -F "visibility=public"
```

**Test Cases:**
- ✅ Create post with text only
- ✅ Create post with media URLs
- ✅ Create post with file uploads (up to 10 images)
- ✅ Create post with private visibility
- ✅ Create post with friends visibility
- ❌ Reject empty content
- ❌ Reject content > 5000 characters
- ❌ Reject > 10 media files
- ❌ Reject invalid file types (non-images)
- ❌ Reject files > 5MB

---

## 2. Post Retrieval

### 2.1 Get Single Post
**Endpoint:** `GET /api/posts/:id`  
**Auth:** Optional

```bash
curl -X GET http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
- Status: `200 OK`
- Contains: Full post details with author, like/comment counts, `isLiked` flag

**Test Cases:**
- ✅ Get public post (authenticated)
- ✅ Get public post (unauthenticated)
- ✅ Get private post (as author)
- ❌ Cannot get private post (as non-author)
- ✅ Get friends post (as follower)
- ❌ Cannot get friends post (as non-follower)
- ❌ Cannot get post from blocked user
- ❌ Cannot get deleted post

### 2.2 Get User Feed
**Endpoint:** `GET /api/posts/feed`  
**Auth:** Required

```bash
curl -X GET "http://localhost:3000/api/posts/feed?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
- Status: `200 OK`
- Contains: `posts` array, `total`, `page`, `limit`, `totalPages`
- Posts from followed users and own posts
- Excludes blocked users

**Test Cases:**
- ✅ Get feed with posts from followed users
- ✅ Get feed includes own posts
- ✅ Feed excludes blocked users
- ✅ Feed respects visibility (public, friends)
- ✅ Feed pagination works correctly
- ✅ Empty feed returns empty array

### 2.3 Get User Posts
**Endpoint:** `GET /api/posts/user/:userId`  
**Auth:** Optional

```bash
curl -X GET "http://localhost:3000/api/posts/user/USER_ID?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
- Status: `200 OK`
- Contains: Paginated posts from specified user
- Respects visibility settings

**Test Cases:**
- ✅ Get own posts (shows all visibility levels)
- ✅ Get other user's public posts
- ✅ Get other user's friends posts (if following)
- ❌ Cannot get other user's private posts
- ❌ Cannot get posts from blocked user
- ✅ Pagination works correctly

---

## 3. Post Update

### 3.1 Update Post Content
**Endpoint:** `PUT /api/posts/:id`  
**Auth:** Required (post owner only)

```bash
curl -X PUT http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated post content"
  }'
```

**Expected Response:**
- Status: `200 OK`
- Contains: Updated post with new content

**Test Cases:**
- ✅ Update own post content
- ✅ Update own post visibility
- ✅ Update own post media URLs
- ✅ Update with file uploads
- ❌ Cannot update other user's post
- ❌ Cannot update deleted post
- ❌ Reject empty content
- ❌ Reject content > 5000 characters

---

## 4. Post Deletion

### 4.1 Delete Post (Soft Delete)
**Endpoint:** `DELETE /api/posts/:id`  
**Auth:** Required (post owner only)

```bash
curl -X DELETE http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
- Status: `200 OK`
- Message: "Post deleted successfully"

**Test Cases:**
- ✅ Delete own post
- ❌ Cannot delete other user's post
- ❌ Cannot delete already deleted post
- ✅ Deleted post not visible in queries
- ✅ Deleted post has `isDeleted: true` and `deletedAt` timestamp

---

## 5. Post Media Attachments

### 5.1 Upload Multiple Images
**Endpoint:** `POST /api/posts`  
**Auth:** Required

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "content=Post with multiple images" \
  -F "media=@image1.jpg" \
  -F "media=@image2.jpg" \
  -F "media=@image3.jpg"
```

**Test Cases:**
- ✅ Upload single image
- ✅ Upload multiple images (up to 10)
- ✅ Upload with both files and URLs
- ❌ Reject > 10 files
- ❌ Reject non-image files
- ❌ Reject files > 5MB
- ✅ Images saved to `/uploads/posts/` directory
- ✅ Media URLs returned in response

---

## 6. Post Pagination

### 6.1 Test Pagination
**Endpoints:** 
- `GET /api/posts/feed?page=1&limit=10`
- `GET /api/posts/user/:userId?page=1&limit=10`
- `GET /api/posts?page=1&limit=10`

**Test Cases:**
- ✅ Default pagination (page=1, limit=10)
- ✅ Custom page and limit
- ✅ Maximum limit enforcement (50 for posts, 100 for feed)
- ✅ Pagination metadata (total, page, limit, totalPages)
- ✅ Empty results return empty array
- ✅ Last page returns remaining items
- ❌ Reject invalid page numbers
- ❌ Reject limit > max allowed

---

## 7. Post Filtering and Sorting

### 7.1 Filter Posts
**Endpoint:** `GET /api/posts`  
**Auth:** Optional

```bash
# Filter by author
curl -X GET "http://localhost:3000/api/posts?authorId=USER_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filter by visibility
curl -X GET "http://localhost:3000/api/posts?visibility=public" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Search posts
curl -X GET "http://localhost:3000/api/posts?search=keyword" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7.2 Sort Posts
```bash
# Sort by newest (default)
curl -X GET "http://localhost:3000/api/posts?sortBy=newest"

# Sort by oldest
curl -X GET "http://localhost:3000/api/posts?sortBy=oldest"

# Sort by popular
curl -X GET "http://localhost:3000/api/posts?sortBy=popular"
```

**Test Cases:**
- ✅ Filter by authorId
- ✅ Filter by visibility
- ✅ Search by content keyword
- ✅ Sort by newest (default)
- ✅ Sort by oldest
- ✅ Sort by popular
- ✅ Combine filters and sorting
- ✅ Exclude blocked users from results
- ✅ Respect visibility when filtering

---

## 8. Post Visibility

### 8.1 Test Visibility Levels

**Create posts with different visibility:**
```bash
# Public post
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"content": "Public post", "visibility": "public"}'

# Private post
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"content": "Private post", "visibility": "private"}'

# Friends post
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"content": "Friends post", "visibility": "friends"}'
```

**Test Cases:**
- ✅ Public posts visible to everyone
- ✅ Private posts only visible to author
- ✅ Friends posts visible to author and followers
- ✅ Friends posts not visible to non-followers
- ✅ Visibility enforced in all retrieval endpoints
- ✅ Visibility can be updated by post owner

---

## 9. Post Reporting

### 9.1 Report a Post
**Endpoint:** `POST /api/posts/:id/report`  
**Auth:** Required

```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/report \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Spam",
    "description": "This post contains spam content"
  }'
```

**Expected Response:**
- Status: `200 OK`
- Message: "Post reported successfully"

**Test Cases:**
- ✅ Report a post successfully
- ✅ Report with reason only
- ✅ Report with reason and description
- ❌ Cannot report own post (optional - depends on requirements)
- ❌ Cannot report already reported post (pending/reviewed)
- ❌ Cannot report deleted post
- ❌ Reject empty reason
- ❌ Reject reason > 200 characters
- ❌ Reject description > 1000 characters

---

## 10. Integration Tests

### 10.1 Complete Post Workflow
1. Create a post
2. Get the post by ID
3. Update the post
4. Add media to the post
5. Get user's posts (verify update)
6. Delete the post
7. Verify post is not accessible

### 10.2 Visibility Workflow
1. User 1 creates public post
2. User 1 creates private post
3. User 1 creates friends post
4. User 2 follows User 1
5. User 2 can see public and friends posts
6. User 2 cannot see private post
7. User 1 can see all their posts

### 10.3 Blocking Workflow
1. User 1 creates a post
2. User 2 blocks User 1
3. User 2 cannot see User 1's posts
4. User 1 cannot see User 2's posts

---

## Error Cases to Test

1. **Authentication Errors:**
   - Missing token
   - Invalid token
   - Expired token

2. **Authorization Errors:**
   - Update other user's post
   - Delete other user's post
   - Access private post without permission

3. **Validation Errors:**
   - Empty content
   - Content too long
   - Invalid visibility value
   - Invalid media URLs
   - Too many media files

4. **Not Found Errors:**
   - Post doesn't exist
   - Post is deleted
   - User doesn't exist

5. **Conflict Errors:**
   - Duplicate report
   - Already deleted post

---

## Performance Tests

1. **Pagination Performance:**
   - Test with large datasets (1000+ posts)
   - Verify query performance
   - Check response times

2. **Media Upload Performance:**
   - Test multiple concurrent uploads
   - Verify file size limits
   - Check storage efficiency

---

## Database Verification

After testing, verify in database:

```sql
-- Check posts
SELECT id, content, "authorId", visibility, "isDeleted", "createdAt" 
FROM posts 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check reports
SELECT id, "postId", "reporterId", reason, status, "createdAt" 
FROM reports 
ORDER BY "createdAt" DESC;

-- Check post counts
SELECT COUNT(*) FROM posts WHERE "isDeleted" = false;
SELECT COUNT(*) FROM posts WHERE visibility = 'public';
SELECT COUNT(*) FROM posts WHERE visibility = 'private';
SELECT COUNT(*) FROM posts WHERE visibility = 'friends';
```

---

## Checklist

- [ ] Post creation (text, media, file upload)
- [ ] Post retrieval (single, feed, user posts)
- [ ] Post update (content, media, visibility)
- [ ] Post deletion (soft delete)
- [ ] Media attachments (upload, validation)
- [ ] Pagination (all endpoints)
- [ ] Filtering (author, visibility, search)
- [ ] Sorting (newest, oldest, popular)
- [ ] Visibility (public, private, friends)
- [ ] Post reporting
- [ ] Error handling
- [ ] Authentication/Authorization
- [ ] Blocking functionality
- [ ] Database integrity

---

## Notes

- All timestamps should be in ISO format
- Media URLs should be relative paths starting with `/uploads/posts/`
- Pagination defaults: page=1, limit=10
- Maximum limits: 50 for posts list, 100 for feed
- File size limit: 5MB per file
- Maximum files: 10 per post
- Content limit: 5000 characters


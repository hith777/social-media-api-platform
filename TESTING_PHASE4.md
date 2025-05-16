# Phase 4 Testing Guide: Content Service - Comments

This guide covers manual testing of all Phase 4 features related to comments.

## Prerequisites

1. Ensure the server is running: `npm run dev`
2. Have at least 2-3 test user accounts registered and verified
3. Have at least one test post created

## Test Users Setup

Create test users if not already created:
- User 1: testuser1@example.com / Test123!@#
- User 2: testuser2@example.com / Test123!@#
- User 3: testuser3@example.com / Test123!@#

## 1. Comment Creation

### Test 1.1: Create a Comment on a Post
**Endpoint:** `POST /api/posts/:id/comments`  
**Auth:** Required

```bash
# Login as User 2
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser2@example.com", "password": "Test123!@#"}'

# Create comment (replace POST_ID and TOKEN)
curl -X POST http://localhost:3000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "This is a test comment"}'
```

**Expected:** 201 Created with comment data including author info and counts

### Test 1.2: Create a Nested Comment (Reply)
**Endpoint:** `POST /api/posts/:id/comments`  
**Auth:** Required

```bash
# Create reply (replace POST_ID, PARENT_COMMENT_ID, and TOKEN)
curl -X POST http://localhost:3000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a reply to the comment",
    "parentId": "PARENT_COMMENT_ID"
  }'
```

**Expected:** 201 Created with parentId set

### Test 1.3: Validation Tests
- Empty content: Should return 400
- Content with only whitespace: Should return 400
- Content exceeding 2000 characters: Should return 400
- Non-existent post: Should return 404
- Non-existent parent comment: Should return 404
- Without authentication: Should return 401

## 2. Get Comments for Post

### Test 2.1: Get Comments with Nested Replies
**Endpoint:** `GET /api/posts/:id/comments`  
**Auth:** Optional

```bash
# Get comments (replace POST_ID)
curl -X GET http://localhost:3000/api/posts/POST_ID/comments

# With authentication (replace POST_ID and TOKEN)
curl -X GET http://localhost:3000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with:
- `comments` array (top-level comments)
- Each comment has `replies` array (nested replies)
- `repliesCount` and `hasMoreReplies` flags
- `isLiked` flag for authenticated users
- Pagination metadata: `total`, `page`, `limit`, `totalPages`

### Test 2.2: Pagination
**Endpoint:** `GET /api/posts/:id/comments?page=1&limit=5`

```bash
curl -X GET "http://localhost:3000/api/posts/POST_ID/comments?page=1&limit=5"
```

**Expected:** Returns only 5 comments per page with correct pagination metadata

### Test 2.3: Replies Limit
**Endpoint:** `GET /api/posts/:id/comments?repliesLimit=3`

```bash
curl -X GET "http://localhost:3000/api/posts/POST_ID/comments?repliesLimit=3"
```

**Expected:** Each comment shows maximum 3 direct replies

## 3. Get Comment Replies (Paginated)

### Test 3.1: Get Paginated Replies for a Comment
**Endpoint:** `GET /api/comments/:id/replies`  
**Auth:** Optional

```bash
# Get replies (replace COMMENT_ID)
curl -X GET http://localhost:3000/api/comments/COMMENT_ID/replies

# With pagination
curl -X GET "http://localhost:3000/api/comments/COMMENT_ID/replies?page=1&limit=5"
```

**Expected:** 200 OK with:
- `replies` array
- Pagination metadata: `total`, `page`, `limit`, `totalPages`
- `isLiked` flag for authenticated users

### Test 3.2: Non-existent Comment
**Endpoint:** `GET /api/comments/nonexistent/replies`

**Expected:** 404 Not Found

## 4. Update Comment

### Test 4.1: Update Own Comment
**Endpoint:** `PUT /api/comments/:id`  
**Auth:** Required

```bash
# Update comment (replace COMMENT_ID and TOKEN)
curl -X PUT http://localhost:3000/api/comments/COMMENT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated comment content"}'
```

**Expected:** 200 OK with updated comment data

### Test 4.2: Update Someone Else's Comment
**Endpoint:** `PUT /api/comments/:id`  
**Auth:** Required (different user)

**Expected:** 403 Forbidden

### Test 4.3: Validation Tests
- Empty content: Should return 400
- Content exceeding 2000 characters: Should return 400
- Non-existent comment: Should return 404
- Without authentication: Should return 401

## 5. Delete Comment

### Test 5.1: Delete Own Comment
**Endpoint:** `DELETE /api/comments/:id`  
**Auth:** Required

```bash
# Delete comment (replace COMMENT_ID and TOKEN)
curl -X DELETE http://localhost:3000/api/comments/COMMENT_ID \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

**Verify:** Comment should be soft deleted (isDeleted=true, deletedAt set)
- Comment should not appear in GET requests
- Comment should not be accessible for updates

### Test 5.2: Delete Someone Else's Comment
**Endpoint:** `DELETE /api/comments/:id`  
**Auth:** Required (different user)

**Expected:** 403 Forbidden

### Test 5.3: Non-existent Comment
**Endpoint:** `DELETE /api/comments/nonexistent`

**Expected:** 404 Not Found

## 6. Comment Reactions (Likes)

### Test 6.1: Like a Comment
**Endpoint:** `POST /api/comments/:id/like`  
**Auth:** Required

```bash
# Like comment (replace COMMENT_ID and TOKEN)
curl -X POST http://localhost:3000/api/comments/COMMENT_ID/like \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

### Test 6.2: Like Already Liked Comment
**Endpoint:** `POST /api/comments/:id/like`  
**Auth:** Required (same user)

**Expected:** 400 Bad Request (already liked)

### Test 6.3: Unlike a Comment
**Endpoint:** `DELETE /api/comments/:id/like`  
**Auth:** Required

```bash
# Unlike comment (replace COMMENT_ID and TOKEN)
curl -X DELETE http://localhost:3000/api/comments/COMMENT_ID/like \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

### Test 6.4: Unlike Not Liked Comment
**Endpoint:** `DELETE /api/comments/:id/like`  
**Auth:** Required

**Expected:** 400 Bad Request (not liked)

### Test 6.5: Toggle Comment Like
**Endpoint:** `POST /api/comments/:id/toggle-like`  
**Auth:** Required

```bash
# Toggle like (replace COMMENT_ID and TOKEN)
curl -X POST http://localhost:3000/api/comments/COMMENT_ID/toggle-like \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with `{ liked: true }` or `{ liked: false }`

**Test Flow:**
1. First call: Should like (liked: true)
2. Second call: Should unlike (liked: false)
3. Third call: Should like again (liked: true)

### Test 6.6: Verify isLiked Flag
1. Like a comment as User 1
2. Get comments as User 1
3. Check that the comment has `isLiked: true`
4. Get comments as User 2 (who didn't like)
5. Check that the comment has `isLiked: false`

### Test 6.7: Like Count
1. Like a comment
2. Get comments
3. Verify `_count.likes` is incremented

## 7. Edge Cases

### Test 7.1: Comments on Deleted Posts
1. Create a post and comment
2. Delete the post (soft delete)
3. Try to get comments for the deleted post
4. **Expected:** 404 Not Found

### Test 7.2: Deleted Comments Not Visible
1. Create a comment
2. Delete the comment
3. Get comments for the post
4. **Expected:** Deleted comment should not appear in results

### Test 7.3: Deep Nested Replies
1. Create a parent comment
2. Create a reply to the parent (level 1)
3. Create a reply to the level 1 reply (level 2)
4. Create a reply to the level 2 reply (level 3)
5. Get comments and verify nested structure
6. **Expected:** All nested levels should be visible (up to max depth)

### Test 7.4: Multiple Users Interacting
1. User 1 creates a post
2. User 2 comments on the post
3. User 3 replies to User 2's comment
4. User 1 replies to User 3's reply
5. User 2 likes User 3's reply
6. Get comments and verify all interactions are correct

### Test 7.5: Pagination Edge Cases
1. Create exactly 20 comments
2. Get page 1 with limit 10: Should return 10 comments, totalPages = 2
3. Get page 2 with limit 10: Should return 10 comments
4. Get page 3 with limit 10: Should return empty array

## 8. Integration Tests

### Test 8.1: Full Comment Flow
1. User 1 creates a post
2. User 2 creates a comment on the post
3. User 3 creates a reply to User 2's comment
4. User 1 likes User 2's comment
5. User 2 updates their comment
6. User 3 likes their own reply
7. Get comments and verify:
   - All comments and replies are visible
   - Like counts are correct
   - isLiked flags are correct for each user
   - Author information is correct

### Test 8.2: Comment with Many Replies
1. Create a comment
2. Create 15 replies to that comment
3. Get comments with repliesLimit=10
4. **Expected:** Should show 10 replies with `hasMoreReplies: true`
5. Get paginated replies: `/api/comments/COMMENT_ID/replies?page=1&limit=5`
6. **Expected:** Should return 5 replies, page 2 should return next 5

## Automated Testing

To run automated tests (after installing dependencies):

```bash
# Install dependencies if not already installed
npm install

# Run Phase 4 tests
npm test -- tests/phase4.test.ts
```

## Test Checklist

- [ ] Comment creation (top-level)
- [ ] Comment creation (nested/reply)
- [ ] Comment validation (empty, too long, etc.)
- [ ] Get comments with nested replies
- [ ] Comment pagination
- [ ] Replies pagination
- [ ] Update own comment
- [ ] Cannot update others' comments
- [ ] Delete own comment (soft delete)
- [ ] Cannot delete others' comments
- [ ] Like comment
- [ ] Unlike comment
- [ ] Toggle like
- [ ] isLiked flag works correctly
- [ ] Like counts are accurate
- [ ] Deleted comments not visible
- [ ] Comments on deleted posts return 404
- [ ] Deep nested replies work
- [ ] Authentication required for write operations
- [ ] Optional authentication for read operations

## Notes

- All comment operations respect soft delete (isDeleted flag)
- Comments on deleted posts are not accessible
- Nested replies are limited by maxDepth (default 3)
- Pagination works for both top-level comments and replies
- Like operations use unique constraints to prevent duplicates
- All validation follows the same patterns as posts (trimmed content, length limits)

